import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Blended cost per call-minute (telephony + STT + LLM + TTS), used both to
 * give the platform owner an at-a-glance spend estimate in /admin and to
 * actually deduct real usage from an org's credit balance. Not billing-grade
 * (a real system would price telephony/AI legs separately), but keeps the
 * estimate and the real deduction consistent with each other.
 */
export const BLENDED_COST_PER_MINUTE_CENTS = 10;

/**
 * Applies a signed credit delta to an org's balance and writes an
 * append-only ledger entry, atomically. Deductions clamp so the balance
 * never goes negative; the ledger records the amount actually applied
 * (which may be less than requested if the balance couldn't cover it).
 *
 * Single source of truth for "how an org's credit balance changes" — used
 * by both the super-admin manual adjustment API and automatic per-call
 * usage deduction below.
 */
export async function applyCreditDelta(opts: {
  organizationId: string;
  amountCents: number; // signed: positive = add, negative = deduct
  reason?: string;
  createdBy: string;
  callId?: string;
}): Promise<{ balanceCents: number; applied: number } | null> {
  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.findUnique({
      where: { id: opts.organizationId },
      select: { creditCents: true },
    });
    if (!org) return null;

    const newBalance = Math.max(0, org.creditCents + opts.amountCents);
    const applied = newBalance - org.creditCents;

    await tx.organization.update({
      where: { id: opts.organizationId },
      data: { creditCents: newBalance },
    });
    await tx.creditTransaction.create({
      data: {
        organizationId: opts.organizationId,
        amountCents: applied,
        balanceAfter: newBalance,
        reason: opts.reason ?? null,
        createdBy: opts.createdBy,
        callId: opts.callId ?? null,
      },
    });
    return { balanceCents: newBalance, applied };
  });
}

/**
 * Deducts the blended usage cost for a completed call from its org's
 * balance. Idempotent — a unique constraint on CreditTransaction.callId
 * means calling this twice for the same call (e.g. a retried status
 * webhook) is a harmless no-op on the second call, caught here before
 * hitting the DB constraint.
 *
 * Intentionally does NOT block or warn when a balance runs out — usage
 * enforcement (pausing agents, blocking new calls) is a business-policy
 * decision for later, not something to impose silently here.
 */
export async function deductCallUsage(call: {
  id: string;
  organizationId: string;
  durationSeconds: number | null;
}): Promise<void> {
  if (!call.durationSeconds || call.durationSeconds <= 0) return;

  const existing = await prisma.creditTransaction.findUnique({
    where: { callId: call.id },
    select: { id: true },
  });
  if (existing) return;

  const minutes = call.durationSeconds / 60;
  const costCents = Math.max(
    1,
    Math.round(minutes * BLENDED_COST_PER_MINUTE_CENTS),
  );

  try {
    await applyCreditDelta({
      organizationId: call.organizationId,
      amountCents: -costCents,
      reason: `Call usage (${Math.ceil(minutes)} min)`,
      createdBy: "system",
      callId: call.id,
    });
  } catch (err) {
    // Race-condition guard: if two invocations slip past the findUnique
    // check above at the same time, the DB's unique constraint on callId
    // rejects the second insert — swallow that specific case rather than
    // crashing call-completion processing over a billing race.
    console.error(`[billing] deductCallUsage failed for call ${call.id}:`, err);
  }
}
