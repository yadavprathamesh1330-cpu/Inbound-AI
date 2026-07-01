import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeadStage } from "@/generated/prisma/client";

const patchSchema = z.object({
  stage: z.enum(LeadStage),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.lead.findFirst({
    where: { id, organizationId: user.orgId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: { stage: parsed.data.stage },
    include: {
      agent: { select: { id: true, name: true } },
      call: { select: { id: true, summary: true, sentiment: true } },
    },
  });

  return NextResponse.json({ lead });
}
