import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAgentReply } from "@/lib/services/openai";
import { buildTwimlResponse } from "@/lib/services/telephony";
import { MissingCredentialError } from "@/lib/services/errors";
import type { TranscriptTurn } from "@/lib/services/openai";
import type { Prisma } from "@/generated/prisma/client";

export const runtime = "nodejs";

/**
 * Twilio inbound-call webhook.
 *
 * Contract: Twilio POSTs `application/x-www-form-urlencoded` on the first
 * hit to a call (with `CallSid`, `From`, `To`) and again on every
 * subsequent turn once a `<Gather input="speech">` collects the caller's
 * utterance (adding `SpeechResult`). This single route handles both:
 *   - First hit (no SpeechResult yet): create/find the Call row, greet the
 *     caller, and gather their first utterance.
 *   - Every following hit (SpeechResult present): append the caller's
 *     turn + the agent's reply to the running transcript, and gather the
 *     next utterance.
 *
 * SIMPLIFICATION (turn-taking model): this uses Twilio's synchronous
 * `<Gather input="speech">` request/response cycle — Twilio does its own
 * STT for each utterance and blocks until the caller stops talking, then
 * POSTs here with the final text. That means each turn incurs one full
 * Twilio-STT + OpenAI round trip before the agent can respond, which is
 * simple and reliable but not the lowest-latency option. A production
 * voice agent would instead open a Twilio Media Stream (raw audio over a
 * WebSocket) and pipe it through Deepgram's realtime streaming API
 * (`deepgram.ts` intentionally exposes only the batch
 * `transcribeAudioChunk` today, see the comment there) for
 * partial/interim transcripts and lower perceived latency. That streaming
 * rework is a larger infra change (a persistent WS server, not a stateless
 * Next.js route handler) and is out of scope here.
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

  const agent = phoneNumber.agent;

  let call = await prisma.call.findUnique({ where: { twilioCallSid: callSid } });
  if (!call) {
    call = await prisma.call.create({
      data: {
        twilioCallSid: callSid,
        status: "IN_PROGRESS",
        direction: "inbound",
        callerPhone: from,
        organizationId: phoneNumber.organizationId,
        agentId: agent.id,
        phoneNumberId: phoneNumber.id,
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
    // Append the caller's turn, then ask OpenAI for the agent's reply.
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
        console.warn(`[calls/webhook] ${err.message}`);
        agentReply =
          "I'm sorry, I'm having trouble thinking right now. Someone from our team will call you back shortly.";
      } else {
        console.error("[calls/webhook] generateAgentReply failed:", err);
        agentReply =
          "Sorry, I ran into an issue. Could you say that again?";
      }
    }
  }

  existingTranscript.push({ speaker: "agent", text: agentReply });

  await prisma.call.update({
    where: { id: call.id },
    // Prisma's Json input type has no structural overlap with our typed
    // TranscriptTurn[] interface (no index signature), so this round-trips
    // through `unknown` — the runtime value is still a plain JSON-safe array.
    data: { transcript: existingTranscript as unknown as Prisma.InputJsonValue },
  });

  // NOTE: `buildTwimlResponse` (via the telephony facade) uses `<Say>` —
  // the provider's built-in TTS — rather than ElevenLabs today. See the doc
  // comment on that function in `src/lib/services/twilio.ts` /
  // `signalwire.ts` for why (no audio hosting wired up yet) and the upgrade
  // path.
  const twiml = buildTwimlResponse(agentReply, true);
  return new NextResponse(twiml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
