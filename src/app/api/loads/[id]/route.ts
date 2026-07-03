import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadInputSchema, toLoadData } from "@/lib/load-input";

export const runtime = "nodejs";

/** PATCH /api/loads/[id] — update fields and/or status of a load. */
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
  const parsed = loadInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid load" },
      { status: 400 },
    );
  }

  const existing = await prisma.load.findFirst({
    where: { id, organizationId: user.orgId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Load not found" }, { status: 404 });
  }

  if (parsed.data.agentId) {
    const agent = await prisma.agent.findFirst({
      where: { id: parsed.data.agentId, organizationId: user.orgId },
      select: { id: true },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found." }, { status: 400 });
    }
  }

  const data = toLoadData(parsed.data);
  const load = await prisma.load.update({
    where: { id },
    data: {
      ...data,
      ...(parsed.data.agentId
        ? { agent: { connect: { id: parsed.data.agentId } } }
        : {}),
    },
    include: { agent: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ ok: true, load });
}

/** DELETE /api/loads/[id] — remove a load. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.load.findFirst({
    where: { id, organizationId: user.orgId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Load not found" }, { status: 404 });
  }

  await prisma.load.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
