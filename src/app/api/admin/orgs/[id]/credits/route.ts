import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  amountDollars: z.number().positive("Enter an amount greater than 0"),
  mode: z.enum(["add", "deduct"]),
  reason: z.string().max(200).optional(),
});

/**
 * POST /api/admin/orgs/[id]/credits — super-admin credit adjustment.
 *
 * Applies a signed delta to the org's balance and writes an append-only
 * CreditTransaction (with the post-change balance) atomically. Deductions are
 * clamped so the balance never goes negative; the ledger records the actual
 * amount applied.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const { amountDollars, mode, reason } = parsed.data;
  const requested = Math.round(amountDollars * 100);
  const signed = mode === "deduct" ? -requested : requested;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUnique({
        where: { id },
        select: { creditCents: true },
      });
      if (!org) return null;

      const newBalance = Math.max(0, org.creditCents + signed);
      const applied = newBalance - org.creditCents;

      await tx.organization.update({
        where: { id },
        data: { creditCents: newBalance },
      });
      await tx.creditTransaction.create({
        data: {
          organizationId: id,
          amountCents: applied,
          balanceAfter: newBalance,
          reason: reason ?? null,
          createdBy: admin.email,
        },
      });
      return { newBalance, applied };
    });

    if (!result) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, balanceCents: result.newBalance });
  } catch (err) {
    console.error("[admin/credits] failed:", err);
    return NextResponse.json({ error: "Failed to adjust credits" }, { status: 500 });
  }
}
