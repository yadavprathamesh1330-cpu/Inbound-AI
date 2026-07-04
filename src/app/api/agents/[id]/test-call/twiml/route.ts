import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTwimlResponse } from "@/lib/services/telephony";
import { handleCallTurn } from "@/lib/call-turn";

export const runtime = "nodejs";

/**
 * TwiML/LaML webhook for the "Test Call" feature — hit by the telephony
 * provider when the owner's outbound test call connects, and again on every
 * subsequent turn. Unlike `/api/calls/webhook`, the agent is resolved
 * directly from the route param (there's no dialed-in PhoneNumber to look up
 * for an outbound call), then delegated to the same `handleCallTurn` used by
 * production inbound calls.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const form = await request.formData();
  const callSid = form.get("CallSid")?.toString();
  const to = form.get("To")?.toString();
  const speechResult = form.get("SpeechResult")?.toString();

  if (!callSid || !to) {
    return NextResponse.json(
      { error: "Missing required webhook fields (CallSid/To)." },
      { status: 400 },
    );
  }

  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) {
    return new NextResponse(
      buildTwimlResponse("Sorry, this test agent isn't available. Goodbye.", false),
      { status: 200, headers: { "Content-Type": "text/xml" } },
    );
  }

  const phoneNumber = await prisma.phoneNumber.findFirst({
    where: { agentId: agent.id },
    select: { id: true },
  });

  const twiml = await handleCallTurn({
    agent,
    organizationId: agent.organizationId,
    phoneNumberId: phoneNumber?.id ?? null,
    callSid,
    callerPhone: to,
    callerName: "Test Call",
    direction: "outbound-test",
    speechResult,
    actionUrl: `/api/agents/${agent.id}/test-call/twiml`,
  });

  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
