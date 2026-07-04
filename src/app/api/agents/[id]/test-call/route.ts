import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  placeOutboundCall,
  TelephonyNotConnectedError,
} from "@/lib/services/test-call";

export const runtime = "nodejs";

const schema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Use E.164 format, e.g. +919812345678"),
});

/**
 * POST /api/agents/[id]/test-call
 *
 * "Test Agent" feature: places a real outbound call — from the number
 * connected to this agent, using the org's own BYO Twilio/SignalWire
 * credentials — to the phone number the owner provides, so they can hear
 * their live agent answer. The call's TwiML is served by
 * `/api/agents/[id]/test-call/twiml`, which reuses the exact same
 * turn-taking logic as production inbound calls.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid phone number" },
      { status: 400 },
    );
  }

  const agent = await prisma.agent.findFirst({
    where: { id, organizationId: user.orgId },
    select: { id: true },
  });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const fromNumber = await prisma.phoneNumber.findFirst({
    where: { agentId: agent.id },
    select: { e164: true },
  });
  if (!fromNumber) {
    return NextResponse.json(
      {
        error:
          "Connect a phone number to this agent first (Phone Numbers page).",
      },
      { status: 400 },
    );
  }

  const organization = await prisma.organization.findUnique({
    where: { id: user.orgId },
    select: {
      telephonyProvider: true,
      telephonyAccountSid: true,
      telephonyAuthToken: true,
      telephonySpaceUrl: true,
    },
  });
  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://inbound-ai-liard.vercel.app";

  try {
    const call = await placeOutboundCall({
      organization,
      from: fromNumber.e164,
      to: parsed.data.phoneNumber,
      url: `${appUrl}/api/agents/${agent.id}/test-call/twiml`,
      statusCallbackUrl: `${appUrl}/api/calls/webhook/status`,
    });
    return NextResponse.json({ ok: true, callSid: call.sid });
  } catch (err) {
    if (err instanceof TelephonyNotConnectedError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to place the call.";
    console.error("[test-call] failed:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
