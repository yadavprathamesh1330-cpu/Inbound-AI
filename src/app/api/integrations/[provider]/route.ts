import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IntegrationProvider, IntegrationStatus } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

const patchSchema = z.object({
  status: z.enum(IntegrationStatus),
  config: z.record(z.string(), z.unknown()).optional(),
});

// Connect/disconnect toggle for a single provider, upserted on the
// [organizationId, provider] unique constraint.
//
// For GOOGLE_SHEETS / GOOGLE_CALENDAR this only flips status + stores a
// placeholder config - it does NOT perform real OAuth. A production
// integration needs GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET (see
// .env.example) and a `/api/integrations/google/callback` route that
// exchanges the OAuth code for tokens and stores them in `config`.
//
// SLACK/HUBSPOT/SALESFORCE/ZOHO are likewise toggle-only placeholders
// until their real OAuth/API-key flows are built.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider: providerParam } = await params;
  const providerParsed = z.enum(IntegrationProvider).safeParse(providerParam);
  if (!providerParsed.success) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }
  const provider = providerParsed.data;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { status, config } = parsed.data;
  const configJson = config as Prisma.InputJsonValue | undefined;

  const integration = await prisma.integration.upsert({
    where: {
      organizationId_provider: {
        organizationId: user.orgId,
        provider,
      },
    },
    update: {
      status,
      config: configJson,
      connectedAt: status === IntegrationStatus.CONNECTED ? new Date() : null,
    },
    create: {
      organizationId: user.orgId,
      provider,
      status,
      config: configJson,
      connectedAt: status === IntegrationStatus.CONNECTED ? new Date() : null,
    },
  });

  return NextResponse.json(integration);
}
