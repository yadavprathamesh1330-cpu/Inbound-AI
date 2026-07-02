import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import {
  connectSignalWireNumber,
  connectTwilioNumber,
} from "@/lib/services/telephony-connect";

export const runtime = "nodejs";

const schema = z.object({
  provider: z.enum(["twilio", "signalwire"]),
  // Twilio Account SID or SignalWire Project ID
  accountSid: z.string().min(2, "Account SID / Project ID is required"),
  // Twilio Auth Token or SignalWire API Token
  authToken: z.string().min(2, "Auth token is required"),
  // SignalWire only
  spaceUrl: z.string().optional(),
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Use E.164 format, e.g. +17755999726"),
  agentId: z.string().optional(),
  label: z.string().optional(),
});

/**
 * POST /api/phone-numbers/connect
 *
 * Self-serve "bring your own number": validates the org's telephony
 * credentials, repoints the number's voice webhook at our inbound route,
 * stores the (encrypted) credentials on the org, and records the PhoneNumber
 * so inbound calls resolve to this org + agent.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const b = parsed.data;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://inbound-ai-liard.vercel.app";
  const webhookUrl = `${appUrl}/api/calls/webhook`;
  const statusUrl = `${appUrl}/api/calls/webhook/status`;

  // If an agent was chosen, make sure it belongs to this org.
  if (b.agentId) {
    const agent = await prisma.agent.findFirst({
      where: { id: b.agentId, organizationId: user.orgId },
      select: { id: true },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found." }, { status: 400 });
    }
  }

  let sid: string;
  try {
    if (b.provider === "twilio") {
      ({ sid } = await connectTwilioNumber({
        accountSid: b.accountSid,
        authToken: b.authToken,
        phoneNumber: b.phoneNumber,
        webhookUrl,
        statusUrl,
      }));
    } else {
      if (!b.spaceUrl) {
        return NextResponse.json(
          { error: "SignalWire needs a Space URL (e.g. myspace.signalwire.com)." },
          { status: 400 },
        );
      }
      ({ sid } = await connectSignalWireNumber({
        projectId: b.accountSid,
        apiToken: b.authToken,
        spaceUrl: b.spaceUrl,
        phoneNumber: b.phoneNumber,
        webhookUrl,
        statusUrl,
      }));
    }
  } catch (err) {
    // Bad credentials / number not on account / provider API error — surface
    // a clear message rather than a 500.
    const message =
      err instanceof Error ? err.message : "Failed to connect the number.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Store the credentials (token encrypted) so we can manage the number later.
  await prisma.organization.update({
    where: { id: user.orgId },
    data: {
      telephonyProvider: b.provider,
      telephonyAccountSid: b.accountSid,
      telephonyAuthToken: encryptSecret(b.authToken),
      telephonySpaceUrl: b.spaceUrl ?? null,
    },
  });

  const phone = await prisma.phoneNumber.upsert({
    where: { e164: b.phoneNumber },
    create: {
      e164: b.phoneNumber,
      twilioSid: sid,
      label: b.label ?? null,
      organizationId: user.orgId,
      agentId: b.agentId ?? null,
    },
    update: {
      twilioSid: sid,
      label: b.label ?? undefined,
      organizationId: user.orgId,
      agentId: b.agentId ?? null,
    },
  });

  return NextResponse.json({ ok: true, phoneNumber: phone.e164, sid });
}
