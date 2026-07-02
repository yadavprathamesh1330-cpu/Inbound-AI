import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { processCompletedCall } from "@/lib/call-processing";

export const runtime = "nodejs";

/**
 * Twilio call status callback webhook (`statusCallback` on the incoming
 * phone number config in `twilio.ts`'s `buyPhoneNumber`). Twilio POSTs here
 * on call lifecycle events; we only
 * care about the terminal ones (`completed`, and treating `busy`/`failed`/
 * `no-answer` as terminal-but-not-completed) to close out the Call row and
 * kick off post-call processing.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const callSid = form.get("CallSid")?.toString();
  const callStatus = form.get("CallStatus")?.toString();
  const callDuration = form.get("CallDuration")?.toString();
  const recordingUrl = form.get("RecordingUrl")?.toString();

  if (!callSid || !callStatus) {
    return NextResponse.json(
      { error: "Missing required Twilio status callback fields." },
      { status: 400 },
    );
  }

  const call = await prisma.call.findUnique({ where: { twilioCallSid: callSid } });
  if (!call) {
    console.warn(
      `[calls/webhook/status] No Call found for CallSid ${callSid}, ignoring status ${callStatus}.`,
    );
    return NextResponse.json({ ok: true });
  }

  const terminalStatuses = new Set([
    "completed",
    "busy",
    "failed",
    "no-answer",
    "canceled",
  ]);
  if (!terminalStatuses.has(callStatus)) {
    // Non-terminal lifecycle event (e.g. "ringing", "in-progress") — no
    // action needed, the in-call webhook route already tracks the Call row.
    return NextResponse.json({ ok: true });
  }

  const endedAt = new Date();
  const durationSeconds = callDuration ? Number(callDuration) : undefined;

  await prisma.call.update({
    where: { id: call.id },
    data: {
      status: callStatus === "completed" ? "COMPLETED" : "FAILED",
      endedAt,
      durationSeconds:
        durationSeconds !== undefined && Number.isFinite(durationSeconds)
          ? durationSeconds
          : undefined,
      recordingUrl: recordingUrl ?? call.recordingUrl,
    },
  });

  try {
    await processCompletedCall(call.id);
  } catch (err) {
    // processCompletedCall already catches per-provider credential errors
    // internally; anything that escapes here is unexpected (e.g. a DB
    // error) and should be logged rather than crashing the webhook
    // response Twilio is waiting on.
    console.error(
      `[calls/webhook/status] processCompletedCall failed for ${call.id}:`,
      err,
    );
  }

  return NextResponse.json({ ok: true });
}
