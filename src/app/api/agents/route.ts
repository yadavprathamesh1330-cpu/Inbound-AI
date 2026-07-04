import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AgentObjective,
  AgentStatus,
  VoiceAccent,
  VoiceGender,
} from "@/generated/prisma/client";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agents = await prisma.agent.findMany({
    where: { organizationId: user.orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(agents);
}

interface CreateAgentBody {
  name: string;
  businessName: string;
  industry?: string;
  businessDescription?: string;
  businessHours?: Record<string, string>;
  website?: string;
  timezone?: string;
  languages?: string[];
  voiceGender?: VoiceGender;
  voiceAccent?: VoiceAccent;
  speakingSpeed?: number;
  voiceStyle?: string;
  systemPrompt?: string;
  greeting?: string;
  fallbackResponses?: string;
  transferRules?: string;
  businessRules?: string;
  customInstructions?: string;
  objectives?: AgentObjective[];
  phoneNumber?: {
    mode: "buy" | "existing";
    e164?: string;
    workingHours?: Record<string, string>;
    voicemailEnabled?: boolean;
  };
  integrationIds?: string[];
}

/** Thrown inside the create transaction when the chosen number belongs to
 * another organization — rolls back the agent and surfaces a 409. */
class PhoneTakenError extends Error {}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as CreateAgentBody;

  if (!body.name?.trim() || !body.businessName?.trim()) {
    return NextResponse.json(
      { error: "name and businessName are required" },
      { status: 400 },
    );
  }

  const objectives = (body.objectives ?? []).filter((o) =>
    Object.values(AgentObjective).includes(o),
  );

  try {
    const agent = await prisma.$transaction(async (tx) => {
      const created = await tx.agent.create({
        data: {
          name: body.name.trim(),
          status: AgentStatus.DRAFT,
          businessName: body.businessName.trim(),
          industry: body.industry || null,
          businessDescription: body.businessDescription || null,
          businessHours: body.businessHours ?? undefined,
          website: body.website || null,
          timezone: body.timezone || "America/New_York",
          languages: body.languages?.length ? body.languages : ["en"],
          voiceGender: body.voiceGender ?? VoiceGender.FEMALE,
          voiceAccent: body.voiceAccent ?? VoiceAccent.AMERICAN,
          speakingSpeed: body.speakingSpeed ?? 1.0,
          voiceStyle: body.voiceStyle || null,
          systemPrompt: body.systemPrompt || null,
          greeting: body.greeting || null,
          fallbackResponses: body.fallbackResponses || null,
          transferRules: body.transferRules || null,
          businessRules: body.businessRules || null,
          customInstructions: body.customInstructions || null,
          objectives,
          organizationId: user.orgId,
        },
      });

      if (body.phoneNumber?.mode === "existing" && body.phoneNumber.e164?.trim()) {
        const e164 = body.phoneNumber.e164.trim();
        // The number may already exist (e.g. connected via /phone-numbers or
        // on a previous agent). If it's ours, reassign it to this new agent;
        // if it belongs to another org, reject. Otherwise create it.
        const existingPn = await tx.phoneNumber.findUnique({
          where: { e164 },
          select: { organizationId: true },
        });
        if (existingPn && existingPn.organizationId !== user.orgId) {
          throw new PhoneTakenError();
        }
        await tx.phoneNumber.upsert({
          where: { e164 },
          create: {
            e164,
            organizationId: user.orgId,
            agentId: created.id,
            workingHours: body.phoneNumber.workingHours ?? undefined,
            voicemailEnabled: body.phoneNumber.voicemailEnabled ?? true,
          },
          update: {
            agentId: created.id,
            workingHours: body.phoneNumber.workingHours ?? undefined,
            voicemailEnabled: body.phoneNumber.voicemailEnabled ?? true,
          },
        });
      }

      if (body.integrationIds?.length) {
        const orgIntegrations = await tx.integration.findMany({
          where: {
            organizationId: user.orgId,
            id: { in: body.integrationIds },
          },
          select: { id: true },
        });

        if (orgIntegrations.length > 0) {
          await tx.agentIntegration.createMany({
            data: orgIntegrations.map((integration) => ({
              agentId: created.id,
              integrationId: integration.id,
            })),
          });
        }
      }

      return created;
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    if (error instanceof PhoneTakenError) {
      return NextResponse.json(
        {
          error:
            "That phone number is already connected to a different workspace.",
        },
        { status: 409 },
      );
    }
    console.error("Failed to create agent", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 },
    );
  }
}
