import "server-only";
import { prisma } from "@/lib/prisma";
import { generateAgentReply, type TranscriptTurn } from "@/lib/services/openai";
import { buildTwimlResponse } from "@/lib/services/telephony";
import { MissingCredentialError } from "@/lib/services/errors";
import { resolvePollyVoice } from "@/lib/voice-map";
import { hasCreditsRemaining } from "@/lib/billing";
import type { Agent, Prisma } from "@/generated/prisma/client";

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
  }

  existingTranscript.push({ speaker: "agent", text: agentReply });

  await prisma.call.update({
    where: { id: call.id },
    data: { transcript: existingTranscript as unknown as Prisma.InputJsonValue },
  });

  const voice = resolvePollyVoice(agent.voiceGender, agent.voiceAccent);
  return buildTwimlResponse(agentReply, true, actionUrl, voice);
}
