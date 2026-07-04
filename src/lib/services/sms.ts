import "server-only";
import twilio from "twilio";
import { RestClient } from "@signalwire/compatibility-api";
import { decryptSecret } from "@/lib/crypto";
import { TelephonyNotConnectedError } from "@/lib/services/test-call";
import type { Organization } from "@/generated/prisma/client";

/**
 * Sends an SMS from the org's own connected telephony account (BYO
 * credentials on Organization — see /phone-numbers). Used by breakdown
 * escalation to alert an agent's on-call number the moment a driver
 * reports an emergency mid-call.
 */
export async function sendOrgSms(opts: {
  organization: Pick<
    Organization,
    | "telephonyProvider"
    | "telephonyAccountSid"
    | "telephonyAuthToken"
    | "telephonySpaceUrl"
  >;
  from: string;
  to: string;
  body: string;
}): Promise<{ sid: string }> {
  const { organization: org, from, to, body } = opts;

  if (!org.telephonyProvider || !org.telephonyAccountSid || !org.telephonyAuthToken) {
    throw new TelephonyNotConnectedError();
  }
  const authToken = decryptSecret(org.telephonyAuthToken);

  if (org.telephonyProvider === "signalwire") {
    if (!org.telephonySpaceUrl) {
      throw new TelephonyNotConnectedError();
    }
    const client = new RestClient(org.telephonyAccountSid, authToken, {
      signalwireSpaceUrl: org.telephonySpaceUrl,
    });
    const message = await client.messages.create({ to, from, body });
    return { sid: message.sid };
  }

  // Default: Twilio
  const client = twilio(org.telephonyAccountSid, authToken);
  const message = await client.messages.create({ to, from, body });
  return { sid: message.sid };
}
