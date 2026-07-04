import "server-only";
import { prisma } from "@/lib/prisma";
import {
  extractLeadFields,
  extractLoadDetails,
  generateCallSummary,
  scoreLeadFromTranscript,
  type TranscriptTurn,
} from "@/lib/services/openai";
import { MissingCredentialError } from "@/lib/services/errors";
import { deductCallUsage } from "@/lib/billing";
import type { Sentiment, LeadStage } from "@/generated/prisma/enums";

function deriveSentiment(score: number): Sentiment {
  if (score >= 70) return "POSITIVE";
  if (score >= 40) return "NEUTRAL";
  return "NEGATIVE";
}

// Progression rank used to decide whether an AI-suggested stage should move
// an existing lead forward. NEW and LOST both rank 0 ("not yet advanced") so
// a re-engaged LOST lead can still progress on a later positive call; WON
// ranks highest and is never set or overwritten by this automation — only a
// human closes a deal.
const STAGE_RANK: Record<LeadStage, number> = {
  NEW: 0,
  LOST: 0,
  QUALIFIED: 1,
  APPOINTMENT: 2,
  WON: 3,
};

/**
 * Applies an AI-suggested stage to a lead's pipeline position without ever
 * regressing progress a human (or an earlier call) already made, and without
 * ever touching a lead a human has marked WON.
 */
function nextLeadStage(
  currentStage: LeadStage,
  suggestedStage: LeadStage | undefined,
): LeadStage {
  if (currentStage === "WON") return "WON";
  if (!suggestedStage) return currentStage;
  return STAGE_RANK[suggestedStage] >= STAGE_RANK[currentStage]
    ? suggestedStage
    : currentStage;
}

function parseTranscript(transcriptJson: unknown): TranscriptTurn[] {
  if (!Array.isArray(transcriptJson)) return [];
  return transcriptJson.filter(
    (turn): turn is TranscriptTurn =>
      typeof turn === "object" &&
      turn !== null &&
      typeof (turn as Record<string, unknown>).speaker === "string" &&
      typeof (turn as Record<string, unknown>).text === "string",
  );
}

/**
 * Post-call processing pipeline: loads the Call row, runs it through
 * OpenAI for summary/lead-score/structured-field extraction, persists the
 * results back onto the Call row, and upserts a linked Lead.
 *
 * Every OpenAI call is individually wrapped in try/catch. If OPENAI_API_KEY
 * isn't set (guaranteed in this environment), `MissingCredentialError` is
 * caught, a warning is logged, and that step is skipped — the Call row
 * still gets whatever real data it already has (transcript, duration,
 * etc.) rather than the whole pipeline failing or faking AI output.
 */
export async function processCompletedCall(callId: string): Promise<void> {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: { lead: true },
  });

  if (!call) {
    console.warn(`[call-processing] Call ${callId} not found, skipping.`);
    return;
  }

  const transcript = parseTranscript(call.transcript);

  let summary: string | undefined;
  let leadScore: number | undefined;
  let extracted: Awaited<ReturnType<typeof extractLeadFields>> = {};
  let loadDetails: Awaited<ReturnType<typeof extractLoadDetails>> = {
    isLoadOffer: false,
  };

  if (transcript.length === 0) {
    console.warn(
      `[call-processing] Call ${callId} has no usable transcript, skipping AI steps.`,
    );
  } else {
    try {
      summary = await generateCallSummary(transcript);
    } catch (err) {
      logStepSkipped("generateCallSummary", err);
    }

    try {
      leadScore = await scoreLeadFromTranscript(transcript);
    } catch (err) {
      logStepSkipped("scoreLeadFromTranscript", err);
    }

    try {
      extracted = await extractLeadFields(transcript);
    } catch (err) {
      logStepSkipped("extractLeadFields", err);
    }

    try {
      loadDetails = await extractLoadDetails(transcript);
    } catch (err) {
      logStepSkipped("extractLoadDetails", err);
    }
  }

  const sentiment =
    leadScore !== undefined ? deriveSentiment(leadScore) : undefined;

  const updatedCall = await prisma.call.update({
    where: { id: callId },
    data: {
      ...(summary !== undefined ? { summary } : {}),
      ...(leadScore !== undefined ? { leadScore } : {}),
      ...(sentiment !== undefined ? { sentiment } : {}),
      ...(extracted.name !== undefined ? { extractedName: extracted.name } : {}),
      ...(extracted.email !== undefined
        ? { extractedEmail: extracted.email }
        : {}),
      ...(extracted.budget !== undefined
        ? { extractedBudget: extracted.budget }
        : {}),
      ...(extracted.interestedService !== undefined
        ? { extractedInterestedService: extracted.interestedService }
        : {}),
      ...(extracted.nextAction !== undefined
        ? { nextAction: extracted.nextAction }
        : {}),
    },
  });

  // Upsert a Lead linked to this call if one doesn't already exist.
  if (!call.lead) {
    await prisma.lead.create({
      data: {
        organizationId: updatedCall.organizationId,
        agentId: updatedCall.agentId,
        callId: updatedCall.id,
        name: extracted.name ?? updatedCall.callerName ?? undefined,
        email: extracted.email,
        phone: updatedCall.callerPhone,
        budget: extracted.budget,
        interestedService: extracted.interestedService,
        score: leadScore,
        stage: extracted.suggestedStage ?? "NEW",
      },
    });
  } else {
    await prisma.lead.update({
      where: { id: call.lead.id },
      data: {
        name: extracted.name ?? call.lead.name ?? undefined,
        email: extracted.email ?? call.lead.email ?? undefined,
        budget: extracted.budget ?? call.lead.budget ?? undefined,
        interestedService:
          extracted.interestedService ?? call.lead.interestedService ?? undefined,
        score: leadScore ?? call.lead.score ?? undefined,
        stage: nextLeadStage(call.lead.stage, extracted.suggestedStage),
      },
    });
  }

  await maybeCreateLoadFromCall(updatedCall, loadDetails);
  await deductCallUsage(updatedCall);
}

function parseIsoDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * Auto-creates a dispatch-board Load when the call was a broker/shipper
 * offering freight, so a dispatcher doesn't have to re-type what the AI
 * already collected. Requires at least a lane or broker name (not just a
 * lone "isLoadOffer: true" with nothing else) and is idempotent — skips if
 * a Load already references this call.
 */
async function maybeCreateLoadFromCall(
  call: { id: string; organizationId: string; agentId: string },
  details: Awaited<ReturnType<typeof extractLoadDetails>>,
): Promise<void> {
  if (!details.isLoadOffer) return;

  const hasMeaningfulData =
    details.originCity ||
    details.destCity ||
    details.brokerName ||
    details.rateDollars;
  if (!hasMeaningfulData) return;

  const existing = await prisma.load.findFirst({
    where: { sourceCallId: call.id },
    select: { id: true },
  });
  if (existing) return;

  await prisma.load.create({
    data: {
      organizationId: call.organizationId,
      agentId: call.agentId,
      sourceCallId: call.id,
      status: "NEW",
      originCity: details.originCity,
      originState: details.originState,
      destCity: details.destCity,
      destState: details.destState,
      equipment: details.equipment,
      weightLbs: details.weightLbs,
      commodity: details.commodity,
      rateCents: details.rateDollars
        ? Math.round(details.rateDollars * 100)
        : undefined,
      pickupDate: parseIsoDate(details.pickupDate),
      deliveryDate: parseIsoDate(details.deliveryDate),
      brokerName: details.brokerName,
      brokerMc: details.brokerMc,
      brokerPhone: details.brokerPhone,
      notes: "Auto-created from a dispatch call transcript.",
    },
  });
}

function logStepSkipped(stepName: string, err: unknown): void {
  if (err instanceof MissingCredentialError) {
    console.warn(
      `[call-processing] Skipping ${stepName}: ${err.message}`,
    );
  } else {
    console.error(`[call-processing] ${stepName} failed unexpectedly:`, err);
  }
}
