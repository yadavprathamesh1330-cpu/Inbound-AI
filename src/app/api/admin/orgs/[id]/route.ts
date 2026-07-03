import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  plan: z.enum(["trial", "owner_operator", "fleet", "enterprise"]).optional(),
});

/**
 * PATCH /api/admin/orgs/[id] — super-admin updates to an org's platform
 * controls (suspend/activate, plan tier).
 */
export async function PATCH(
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
  if (!parsed.success || (!parsed.data.status && !parsed.data.plan)) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  await prisma.organization.update({
    where: { id },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.plan ? { plan: parsed.data.plan } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
