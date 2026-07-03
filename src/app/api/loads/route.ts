import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadInputSchema, toLoadData } from "@/lib/load-input";

export const runtime = "nodejs";

/** POST /api/loads — create a load for the current org. */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = loadInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid load" },
      { status: 400 },
    );
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
  const load = await prisma.load.create({
    data: {
      ...data,
      status: parsed.data.status ?? "NEW",
      organization: { connect: { id: user.orgId } },
      ...(parsed.data.agentId
        ? { agent: { connect: { id: parsed.data.agentId } } }
        : {}),
    },
    include: { agent: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ ok: true, load });
}
