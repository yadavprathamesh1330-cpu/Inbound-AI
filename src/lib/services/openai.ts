import "server-only";
import OpenAI from "openai";
import { requireEnv } from "@/lib/services/errors";

/**
 * A single turn in a call transcript, as stored in `Call.transcript` (Json).
 */
export interface TranscriptTurn {
  speaker: string;
  text: string;
}

export interface ExtractedLeadFields {
  name?: string;
  email?: string;
  budget?: string;
  interestedService?: string;
  nextAction?: string;
}

/**
 * Real, current chat-completions-compatible model. gpt-4o-mini is cheap and
 * fast enough for per-call summarization/scoring/extraction and for the
 * live turn-by-turn reasoning step.
 */
const CHAT_MODEL = "gpt-4o-mini";

let cachedClient: OpenAI | null = null;

/**
 * Lazily constructs the OpenAI client. Lazy so that importing this module
 * (e.g. from route handlers at build/type-check time) never throws just
 * because OPENAI_API_KEY isn't set yet — the error only surfaces once a
 * function here is actually invoked.
 */
function getClient(): OpenAI {
  const apiKey = requireEnv("OPENAI_API_KEY", "OpenAI");
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }
  return cachedClient;
}

function transcriptToText(transcript: TranscriptTurn[]): string {
  return transcript.map((t) => `${t.speaker}: ${t.text}`).join("\n");
}

/**
 * Summarizes a completed call transcript into a short paragraph suitable
 * for `Call.summary`.
 */
export async function generateCallSummary(
  transcript: TranscriptTurn[],
): Promise<string> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "You are an assistant that writes concise, factual summaries of " +
          "phone call transcripts between an AI voice receptionist and a " +
          "caller. Summarize in 2-4 sentences: who called, what they " +
          "wanted, and the outcome. Do not invent details not present in " +
          "the transcript.",
      },
      {
        role: "user",
        content: `Transcript:\n${transcriptToText(transcript)}\n\nSummary:`,
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

/**
 * Scores how promising this caller is as a sales lead, from 0 (not a lead
 * at all / spam / wrong number) to 100 (highly qualified, ready to buy).
 */
export async function scoreLeadFromTranscript(
  transcript: TranscriptTurn[],
): Promise<number> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a sales lead-scoring assistant. Given a call transcript " +
          "between an AI voice receptionist and a caller, score how " +
          "promising this caller is as a sales lead from 0-100 (0 = not a " +
          "lead at all/spam/wrong number, 100 = highly qualified and ready " +
          "to buy). Consider expressed intent, budget signals, urgency, " +
          "and engagement. Respond with strict JSON: {\"score\": <integer 0-100>}.",
      },
      {
        role: "user",
        content: `Transcript:\n${transcriptToText(transcript)}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as { score?: unknown };
    const score = Number(parsed.score);
    if (Number.isFinite(score)) {
      return Math.max(0, Math.min(100, Math.round(score)));
    }
  } catch {
    // fall through to default below
  }
  return 0;
}

/**
 * Extracts structured lead fields from a transcript using JSON mode.
 */
export async function extractLeadFields(
  transcript: TranscriptTurn[],
): Promise<ExtractedLeadFields> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You extract structured lead information from phone call " +
          "transcripts between an AI voice receptionist and a caller. " +
          "Respond with strict JSON matching this shape (omit a key, or " +
          'set it to null, if the transcript does not mention it): ' +
          '{"name": string | null, "email": string | null, ' +
          '"budget": string | null, "interestedService": string | null, ' +
          '"nextAction": string | null}. "nextAction" should be a short ' +
          'phrase describing the agreed follow-up (e.g. "Schedule a ' +
          'callback", "Send pricing via email", "Book on-site visit ' +
          'Tuesday 3pm"). Do not fabricate values not supported by the ' +
          "transcript.",
      },
      {
        role: "user",
        content: `Transcript:\n${transcriptToText(transcript)}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean = (v: unknown): string | undefined =>
      typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
    return {
      name: clean(parsed.name),
      email: clean(parsed.email),
      budget: clean(parsed.budget),
      interestedService: clean(parsed.interestedService),
      nextAction: clean(parsed.nextAction),
    };
  } catch {
    return {};
  }
}

export interface ExtractedLoadDetails {
  isLoadOffer: boolean;
  originCity?: string;
  originState?: string;
  destCity?: string;
  destState?: string;
  equipment?: string;
  weightLbs?: number;
  commodity?: string;
  rateDollars?: number;
  pickupDate?: string;
  deliveryDate?: string;
  brokerName?: string;
  brokerMc?: string;
  brokerPhone?: string;
}

/**
 * Detects whether a call transcript was a broker/shipper offering a freight
 * load (vs. a driver check-in, parts order, or unrelated call) and, if so,
 * extracts the structured load fields mentioned. Used by
 * `processCompletedCall` to auto-create a `Load` row on the dispatch board
 * so a dispatcher doesn't have to re-type what the AI already collected.
 */
export async function extractLoadDetails(
  transcript: TranscriptTurn[],
): Promise<ExtractedLoadDetails> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You analyze phone call transcripts for a trucking dispatch " +
          "AI agent. First decide: is the caller a broker or shipper " +
          "OFFERING A FREIGHT LOAD (a specific lane to haul)? This is " +
          "different from a driver check-in, a parts order, or an " +
          "unrelated call. Respond with strict JSON: " +
          '{"isLoadOffer": boolean, "originCity": string|null, ' +
          '"originState": string|null, "destCity": string|null, ' +
          '"destState": string|null, "equipment": string|null, ' +
          '"weightLbs": number|null, "commodity": string|null, ' +
          '"rateDollars": number|null, "pickupDate": string|null, ' +
          '"deliveryDate": string|null, "brokerName": string|null, ' +
          '"brokerMc": string|null, "brokerPhone": string|null}. ' +
          "Dates should be ISO 8601 (YYYY-MM-DD) if a specific date is " +
          "mentioned, else null (do not guess a year for vague terms like " +
          '"Friday" unless a date is stated). rateDollars is the numeric ' +
          "all-in rate only (no currency symbols). If isLoadOffer is " +
          "false, all other fields should be null. Do not fabricate " +
          "values not supported by the transcript.",
      },
      {
        role: "user",
        content: `Transcript:\n${transcriptToText(transcript)}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.isLoadOffer !== true) return { isLoadOffer: false };

    const str = (v: unknown): string | undefined =>
      typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
    const num = (v: unknown): number | undefined => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    };

    return {
      isLoadOffer: true,
      originCity: str(parsed.originCity),
      originState: str(parsed.originState),
      destCity: str(parsed.destCity),
      destState: str(parsed.destState),
      equipment: str(parsed.equipment),
      weightLbs: num(parsed.weightLbs),
      commodity: str(parsed.commodity),
      rateDollars: num(parsed.rateDollars),
      pickupDate: str(parsed.pickupDate),
      deliveryDate: str(parsed.deliveryDate),
      brokerName: str(parsed.brokerName),
      brokerMc: str(parsed.brokerMc),
      brokerPhone: str(parsed.brokerPhone),
    };
  } catch {
    return { isLoadOffer: false };
  }
}

export interface GeneratedAgentScript {
  systemPrompt: string;
  greeting: string;
}

/**
 * Writes a ready-to-use system prompt + spoken greeting for a voice agent
 * from the business details the user has entered. This powers the "Write with
 * AI" helper so owners who don't know how to write a prompt still get a
 * professional, industry-specific one.
 */
export async function generateAgentScript(input: {
  businessName?: string;
  industry?: string;
  businessDescription?: string;
  objectives?: string[];
  instruction?: string;
}): Promise<GeneratedAgentScript> {
  const client = getClient();

  const context =
    [
      input.businessName && `Business name: ${input.businessName}`,
      input.industry && `Industry: ${input.industry}`,
      input.businessDescription &&
        `About the business: ${input.businessDescription}`,
      input.objectives?.length &&
        `Primary objectives: ${input.objectives.join(", ")}`,
      input.instruction &&
        `Extra instructions from the owner: ${input.instruction}`,
    ]
      .filter(Boolean)
      .join("\n") || "A small business phone receptionist.";

  const completion = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You write system prompts and greetings for AI phone voice agents " +
          "(receptionists, dispatchers, parts counters, service desks). Given " +
          "a business's details, produce a clear, professional system prompt " +
          "that: states who the agent is and the business it represents; lists " +
          "exactly what information to collect from callers (use short bullet " +
          "lines starting with '- '); gives rules (never invent prices, never " +
          "commit to things it can't, warm-transfer to a human for complex " +
          "cases, keep replies short because it's a phone call). Tailor it to " +
          "the industry and objectives. Also write a single warm one-sentence " +
          "spoken greeting. Return STRICT JSON: " +
          '{"systemPrompt": string, "greeting": string}. No markdown headers, ' +
          "no backticks.",
      },
      { role: "user", content: context },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw) as {
      systemPrompt?: unknown;
      greeting?: unknown;
    };
    return {
      systemPrompt:
        typeof parsed.systemPrompt === "string"
          ? parsed.systemPrompt.trim()
          : "",
      greeting:
        typeof parsed.greeting === "string" ? parsed.greeting.trim() : "",
    };
  } catch {
    return { systemPrompt: "", greeting: "" };
  }
}

/**
 * Generates the AI voice agent's next reply during a live call, given the
 * agent's configured system prompt and the conversation so far. Used by
 * the Twilio webhook route for the turn-by-turn reasoning step.
 */
export async function generateAgentReply(
  systemPrompt: string,
  conversationHistory: {
    role: "system" | "user" | "assistant";
    content: string;
  }[],
): Promise<string> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.6,
    max_tokens: 200,
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory.filter((m) => m.role !== "system"),
    ],
  });

  return (
    completion.choices[0]?.message?.content?.trim() ??
    "Sorry, could you repeat that?"
  );
}
