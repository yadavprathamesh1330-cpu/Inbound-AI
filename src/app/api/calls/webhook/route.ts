import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTwimlResponse } from "@/lib/services/telephony";
import { handleCallTurn } from "@/lib/call-turn";

export const runtime = "nodejs";

/**
 * Twilio/SignalWire inbound-call webhook.
 *
 * Contract: the provider POSTs `application/x-www-form-urlencoded` on the
 * first hit to a call (with `CallSid`, `From`, `To`) and again on every
 * subsequent turn once a `<Gather input="speech">` collects the caller's
 * utterance (adding `SpeechResult`). This route resolves which org/agent
 * owns the dialed number, then delegates the actual turn-taking logic
 * (transcript, LLM reply, persistence) to `handleCallTurn` — the same
 * function used by the owner-initiated Test Call flow
 * (`/api/agents/[id]/test-call/twiml`), so both paths behave identically.
 *
 * SIMPLIFICATION (turn-taking model): this uses the provider's synchronous
 * `<Gather input="speech">` request/response cycle — the provider does its
 * own STT for each utterance and blocks until the caller stops talking, then
 * POSTs here with the final text. That means each turn incurs one full
 * STT + OpenAI round trip before the agent can respond, which is simple and
 * reliable but not the lowest-latency option. A production voice agent would
 * instead open a Media Stream (raw audio over a WebSocket) and pipe it
 * through Deepgram's realtime streaming API (`deepgram.ts` intentionally
 * exposes only the batch `transcribeAudioChunk` today, see the comment there)
 * for partial/interim transcripts and lower perceived latency. That
 * streaming rework is a larger infra change (a persistent WS server, not a
 * stateless Next.js route handler) and is out of scope here.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const callSid = form.get("CallSid")?.toString();
  const from = form.get("From")?.toString();
  const to = form.get("To")?.toString();
  const speechResult = form.get("SpeechResult")?.toString();

  if (!callSid || !from || !to) {
    return NextResponse.json(
      { error: "Missing required Twilio webhook fields (CallSid/From/To)." },
      { status: 400 },
    );
  }

  // Resolve the org/agent this call belongs to via the dialed-in number.
  const phoneNumber = await prisma.phoneNumber.findUnique({
    where: { e164: to },
    include: { agent: true },
  });

  if (!phoneNumber || !phoneNumber.agent) {
    console.error(
      `[calls/webhook] No PhoneNumber/Agent configured for dialed number ${to}.`,
    );
    return new NextResponse(
      buildTwimlResponse(
        "Sorry, this number isn't set up correctly yet. Goodbye.",
        false,
      ),
      { status: 200, headers: { "Content-Type": "text/xml" } },
    );
  }

  const twiml = await handleCallTurn({
    agent: phoneNumber.agent,
    organizationId: phoneNumber.organizationId,
    phoneNumberId: phoneNumber.id,
    callSid,
    callerPhone: from,
    direction: "inbound",
    speechResult,
  });

  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
