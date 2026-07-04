import "server-only";
import { prisma } from "@/lib/prisma";
import { isBreakdownMessage } from "@/lib/breakdown-detection";
import { sendOrgSms } from "@/lib/services/sms";

/**
 * Checks a caller's utterance for breakdown/emergency language and, on a
 * match, SMS's the agent's on-call number. Idempotent per call (checked via
 * `call.escalatedAt`) and never throws — a messaging failure must never
 * break the live call flow, so any error here is logged and swallowed.
 *
 * Fires-and-awaits (not fire-and-forget): serverless functions can be frozen
 * once the HTTP response is sent, so we can't rely on background execution
 * after returning the TwiML — this must complete before handleCallTurn
 * responds. That does add a little latency to the one turn that trips it,
 * which is an acceptable trade for actually guaranteeing delivery.
 */
export async function maybeEscalateBreakdown(params: {
  callId: string;
  organizationId: string;
  callerPhone: string;
  phoneNumberId: string | null;
  onCallPhone: string | null;
  alreadyEscalated: boolean;
  speechText: string;
}): Promise<void> {
  const {
    callId,
    organizationId,
    callerPhone,
    phoneNumberId,
    onCallPhone,
    alreadyEscalated,
    speechText,
  } = params;

  // Cheap checks first — no DB query at all on the vast majority of turns
  // that aren't emergencies.
  if (alreadyEscalated) return;
  if (!onCallPhone) return;
  if (!phoneNumberId) return;
  if (!isBreakdownMessage(speechText)) return;

  try {
    const [organization, phoneNumber] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          telephonyProvider: true,
          telephonyAccountSid: true,
          telephonyAuthToken: true,
          telephonySpaceUrl: true,
        },
      }),
      prisma.phoneNumber.findUnique({
        where: { id: phoneNumberId },
        select: { e164: true },
      }),
    ]);
    if (!organization || !phoneNumber) return;

    await sendOrgSms({
      organization,
      from: phoneNumber.e164,
      to: onCallPhone,
      body: `⚠️ BREAKDOWN ALERT: ${callerPhone} said: "${speechText}" — call them back now.`,
    });

    await prisma.call.update({
      where: { id: callId },
      data: { escalatedAt: new Date() },
    });
  } catch (err) {
    console.error(`[escalation] failed for call ${callId}:`, err);
  }
}
