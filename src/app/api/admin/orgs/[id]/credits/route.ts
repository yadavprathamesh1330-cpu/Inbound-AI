import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/admin-guard";
import { applyCreditDelta } from "@/lib/billing";

export const runtime = "nodejs";

const schema = z.object({
  amountDollars: z.number().positive("Enter an amount greater than 0"),
  mode: z.enum(["add", "deduct"]),
  reason: z.string().max(200).optional(),
});

/**
 * POST /api/admin/orgs/[id]/credits — super-admin credit adjustment.
 *
 * Thin wrapper around the shared `applyCreditDelta` (src/lib/billing.ts),
 * which also backs automatic per-call usage deduction — one source of truth
 * for how an org's credit balance changes and how the ledger is written.
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
    const result = await applyCreditDelta({
      organizationId: id,
      amountCents: signed,
      reason,
      createdBy: admin.email,
    });

    if (!result) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, balanceCents: result.balanceCents });
  } catch (err) {
    console.error("[admin/credits] failed:", err);
    return NextResponse.json({ error: "Failed to adjust credits" }, { status: 500 });
  }
}
