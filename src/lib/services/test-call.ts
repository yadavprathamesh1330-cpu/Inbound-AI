import "server-only";
import twilio from "twilio";
import { RestClient } from "@signalwire/compatibility-api";
import { decryptSecret } from "@/lib/crypto";
import type { Organization } from "@/generated/prisma/client";

export class TelephonyNotConnectedError extends Error {
  constructor() {
    super(
      "Connect your Twilio or SignalWire account on the Phone Numbers page first.",
    );
    this.name = "TelephonyNotConnectedError";
  }
}

/**
 * Places an outbound call from the org's own connected telephony account
 * (BYO credentials on Organization — see /phone-numbers) to `to`, with
 * `url` as the TwiML/LaML webhook for when the call connects. Used by the
 * "Test Call" feature: the org calls itself so the owner can hear their
 * agent live without waiting for a real customer to call in.
 */
export async function placeOutboundCall(opts: {
  organization: Pick<
    Organization,
    | "telephonyProvider"
    | "telephonyAccountSid"
    | "telephonyAuthToken"
    | "telephonySpaceUrl"
  >;
  from: string;
  to: string;
  url: string;
  statusCallbackUrl: string;
}): Promise<{ sid: string }> {
  const { organization: org, from, to, url, statusCallbackUrl } = opts;

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
    const call = await client.calls.create({
      to,
      from,
      url,
      method: "POST",
      statusCallback: statusCallbackUrl,
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["completed"],
    });
    return { sid: call.sid };
  }

  // Default: Twilio
  const client = twilio(org.telephonyAccountSid, authToken);
  const call = await client.calls.create({
    to,
    from,
    url,
    method: "POST",
    statusCallback: statusCallbackUrl,
    statusCallbackMethod: "POST",
    statusCallbackEvent: ["completed"],
  });
  return { sid: call.sid };
}
