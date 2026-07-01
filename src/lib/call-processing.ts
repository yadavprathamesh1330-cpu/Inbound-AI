import "server-only";
import { prisma } from "@/lib/prisma";
import {
  extractLeadFields,
  generateCallSummary,
  scoreLeadFromTranscript,
  type TranscriptTurn,
} from "@/lib/services/openai";
import { MissingCredentialError } from "@/lib/services/errors";
import type { Sentiment } from "@/generated/prisma/enums";

function deriveSentiment(score: number): Sentiment {
  if (score >= 70) return "POSITIVE";
  if (score >= 40) return "NEUTRAL";
  return "NEGATIVE";
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
        stage: "NEW",
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
      },
    });
  }
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
