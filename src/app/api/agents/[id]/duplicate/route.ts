import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgentStatus } from "@/generated/prisma/client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const source = await prisma.agent.findFirst({
    where: { id, organizationId: user.orgId },
  });

  if (!source) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const duplicate = await prisma.agent.create({
    data: {
      name: `${source.name} (Copy)`,
      status: AgentStatus.DRAFT,
      businessName: source.businessName,
      industry: source.industry,
      businessDescription: source.businessDescription,
      businessHours: source.businessHours ?? undefined,
      website: source.website,
      timezone: source.timezone,
      languages: source.languages,
      voiceGender: source.voiceGender,
      voiceAccent: source.voiceAccent,
      speakingSpeed: source.speakingSpeed,
      voiceStyle: source.voiceStyle,
      systemPrompt: source.systemPrompt,
      greeting: source.greeting,
      fallbackResponses: source.fallbackResponses,
      transferRules: source.transferRules,
      businessRules: source.businessRules,
      customInstructions: source.customInstructions,
      objectives: source.objectives,
      organizationId: user.orgId,
    },
  });

  return NextResponse.json(duplicate, { status: 201 });
}
