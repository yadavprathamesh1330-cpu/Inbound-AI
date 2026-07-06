import "server-only";
import { prisma } from "@/lib/prisma";
import { generateAgentReply, type TranscriptTurn } from "@/lib/services/openai";
import { buildTwimlResponse } from "@/lib/services/telephony";
import { MissingCredentialError } from "@/lib/services/errors";
import { resolvePollyVoice } from "@/lib/voice-map";
import { hasCreditsRemaining } from "@/lib/billing";
import { maybeEscalateBreakdown } from "@/lib/escalation";
import type { Agent, Prisma } from "@/generated/prisma/client";

/**
 * Hard cap on a single call's length. Deduction only happens once, at
 * completion, based on actual duration — with no live cap, a caller who
 * never hangs up (stuck line, confused caller, or someone deliberately
 * running up cost) could stay connected indefinitely. This bounds the
 * worst case regardless of how the call ends.
 */
const MAX_CALL_DURATION_MS = 15 * 60 * 1000;

export interface CallTurnParams {
  agent: Agent;
  organizationId: string;
  phoneNumberId?: string | null;
  callSid: string;
  callerPhone: string;
  callerName?: string | null;
  direction?: string;
  speechResult?: string | null;
  /** Where Twilio/SignalWire should POST the caller's next utterance. */
  actionUrl?: string;
}

/**
 * Computes the next turn's TwiML/LaML for an in-progress call: creates the
 * Call row on first contact, appends the caller's utterance + the agent's
 * reply to the transcript, and persists it.
 *
 * Shared by two callers that resolve the agent differently:
 *   - `/api/calls/webhook` (production inbound) — agent resolved via the
 *     dialed PhoneNumber.
 *   - `/api/agents/[id]/test-call/twiml` (owner-initiated test call) —
 *     agent resolved directly from the route param.
 */
export async function handleCallTurn(params: CallTurnParams): Promise<string> {
  const {
    agent,
    organizationId,
    phoneNumberId,
    callSid,
    callerPhone,
    callerName,
    direction,
    speechResult,
    actionUrl,
  } = params;

  let call = await prisma.call.findUnique({ where: { twilioCallSid: callSid } });
  if (!call) {
    // Gate only brand-new calls — never cut off a conversation already in
    // progress because of this. An org at exactly 0 credits can't start
    // another billable call; the caller hears a graceful decline instead of
    // an internal "insufficient balance" detail.
    if (!(await hasCreditsRemaining(organizationId))) {
      const voice = resolvePollyVoice(agent.voiceGender, agent.voiceAccent);
      return buildTwimlResponse(
        "We're sorry, this service is temporarily unavailable. Please try again later.",
        false,
        undefined,
        voice,
      );
    }

    call = await prisma.call.create({
      data: {
        twilioCallSid: callSid,
        status: "IN_PROGRESS",
        direction: direction ?? "inbound",
        callerPhone,
        callerName: callerName ?? null,
        organizationId,
        agentId: agent.id,
        phoneNumberId: phoneNumberId ?? null,
        transcript: [],
      },
    });
  }

  // Enforce the max length on an existing call before doing any more work
  // (including skipping the LLM call we'd otherwise make) — never applies
  // to a call we just created above, since it can't have exceeded anything
  // yet.
  if (Date.now() - call.startedAt.getTime() > MAX_CALL_DURATION_MS) {
    const voice = resolvePollyVoice(agent.voiceGender, agent.voiceAccent);
    return buildTwimlResponse(
      "We're sorry, this call has reached its maximum length. Please call back if you need more help. Goodbye.",
      false,
      undefined,
      voice,
    );
  }

  const existingTranscript: TranscriptTurn[] = Array.isArray(call.transcript)
    ? (call.transcript as unknown as TranscriptTurn[])
    : [];

  const systemPrompt =
    agent.systemPrompt ??
    `You are ${agent.name}, an AI voice receptionist for ${agent.businessName}. ` +
      "Be warm, concise, and helpful. Keep replies short since this is a phone call.";

  let agentReply: string;

  if (!speechResult) {
    // First hit for this call: greet, don't call the LLM yet.
    agentReply =
      agent.greeting ??
      `Hi, thanks for calling ${agent.businessName}. How can I help you today?`;
  } else {
    existingTranscript.push({ speaker: "caller", text: speechResult });

    const conversationHistory = existingTranscript.map((turn) => ({
      role: (turn.speaker === "caller" ? "user" : "assistant") as
        | "user"
        | "assistant",
      content: turn.text,
    }));

    // Runs concurrently with the LLM reply — independent concerns, no need
    // to serialize them and add their latencies together.
    const escalationPromise = maybeEscalateBreakdown({
      callId: call.id,
      organizationId,
      callerPhone,
      phoneNumberId: call.phoneNumberId,
      onCallPhone: agent.onCallPhone,
      alreadyEscalated: call.escalatedAt !== null,
      speechText: speechResult,
    });

    try {
      agentReply = await generateAgentReply(systemPrompt, conversationHistory);
    } catch (err) {
      if (err instanceof MissingCredentialError) {
        console.warn(`[call-turn] ${err.message}`);
        agentReply =
          "I'm sorry, I'm having trouble thinking right now. Someone from our team will call you back shortly.";
      } else {
        console.error("[call-turn] generateAgentReply failed:", err);
        agentReply = "Sorry, I ran into an issue. Could you say that again?";
      }
    }

    await escalationPromise;
  }

  existingTranscript.push({ speaker: "agent", text: agentReply });

  await prisma.call.update({
    where: { id: call.id },
    data: { transcript: existingTranscript as unknown as Prisma.InputJsonValue },
  });

  const voice = resolvePollyVoice(agent.voiceGender, agent.voiceAccent);
  return buildTwimlResponse(agentReply, true, actionUrl, voice);
}
