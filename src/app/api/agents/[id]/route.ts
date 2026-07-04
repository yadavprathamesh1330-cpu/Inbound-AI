import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgentStatus } from "@/generated/prisma/client";

async function findOrgAgent(orgId: string, agentId: string) {
  return prisma.agent.findFirst({
    where: { id: agentId, organizationId: orgId },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await findOrgAgent(user.orgId, id);
  if (!existing) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const body = await req.json();

  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") data.name = body.name;
  if (
    typeof body.status === "string" &&
    Object.values(AgentStatus).includes(body.status)
  ) {
    data.status = body.status;
  }
  if (typeof body.businessName === "string") data.businessName = body.businessName;
  if (typeof body.industry === "string" || body.industry === null) data.industry = body.industry;
  if (typeof body.businessDescription === "string" || body.businessDescription === null)
    data.businessDescription = body.businessDescription;
  if (body.businessHours !== undefined) data.businessHours = body.businessHours;
  if (typeof body.website === "string" || body.website === null) data.website = body.website;
  if (typeof body.timezone === "string") data.timezone = body.timezone;
  if (Array.isArray(body.languages)) data.languages = body.languages;
  if (typeof body.voiceGender === "string") data.voiceGender = body.voiceGender;
  if (typeof body.voiceAccent === "string") data.voiceAccent = body.voiceAccent;
  if (typeof body.speakingSpeed === "number") data.speakingSpeed = body.speakingSpeed;
  if (typeof body.voiceStyle === "string" || body.voiceStyle === null) data.voiceStyle = body.voiceStyle;
  if (typeof body.systemPrompt === "string" || body.systemPrompt === null) data.systemPrompt = body.systemPrompt;
  if (typeof body.greeting === "string" || body.greeting === null) data.greeting = body.greeting;
  if (typeof body.fallbackResponses === "string" || body.fallbackResponses === null)
    data.fallbackResponses = body.fallbackResponses;
  if (typeof body.transferRules === "string" || body.transferRules === null)
    data.transferRules = body.transferRules;
  if (typeof body.businessRules === "string" || body.businessRules === null)
    data.businessRules = body.businessRules;
  if (typeof body.customInstructions === "string" || body.customInstructions === null)
    data.customInstructions = body.customInstructions;
  if (Array.isArray(body.objectives)) data.objectives = body.objectives;
  if (typeof body.onCallPhone === "string" || body.onCallPhone === null)
    data.onCallPhone = body.onCallPhone;

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const updated = await prisma.agent.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await findOrgAgent(user.orgId, id);
  if (!existing) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await prisma.agent.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
