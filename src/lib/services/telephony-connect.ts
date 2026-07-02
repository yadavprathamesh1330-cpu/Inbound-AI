import "server-only";
import twilio from "twilio";
import { RestClient } from "@signalwire/compatibility-api";

/**
 * "Bring your own number" wiring.
 *
 * Given a customer's telephony credentials + a number they already own on
 * that account, this validates the credentials (an auth failure throws) and
 * points the number's voice webhook at our inbound call route — the one step
 * that makes their calls actually reach Omni AI. Used by
 * POST /api/phone-numbers/connect.
 */
export interface ConnectResult {
  sid: string;
}

export async function connectTwilioNumber(opts: {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  webhookUrl: string;
  statusUrl: string;
}): Promise<ConnectResult> {
  const client = twilio(opts.accountSid, opts.authToken);

  // Validates creds (throws on bad auth) and confirms the org owns the number.
  const matches = await client.incomingPhoneNumbers.list({
    phoneNumber: opts.phoneNumber,
    limit: 1,
  });
  const number = matches[0];
  if (!number) {
    throw new Error(
      `${opts.phoneNumber} isn't on this Twilio account. Buy it in Twilio first, then connect it here.`,
    );
  }

  await client.incomingPhoneNumbers(number.sid).update({
    voiceUrl: opts.webhookUrl,
    voiceMethod: "POST",
    statusCallback: opts.statusUrl,
    statusCallbackMethod: "POST",
  });

  return { sid: number.sid };
}

export async function connectSignalWireNumber(opts: {
  projectId: string;
  apiToken: string;
  spaceUrl: string;
  phoneNumber: string;
  webhookUrl: string;
  statusUrl: string;
}): Promise<ConnectResult> {
  const client = new RestClient(opts.projectId, opts.apiToken, {
    signalwireSpaceUrl: opts.spaceUrl,
  });

  const matches = await client.incomingPhoneNumbers.list({
    phoneNumber: opts.phoneNumber,
    limit: 1,
  });
  const number = matches[0];
  if (!number) {
    throw new Error(
      `${opts.phoneNumber} isn't on this SignalWire space. Buy it in SignalWire first, then connect it here.`,
    );
  }

  await client.incomingPhoneNumbers(number.sid).update({
    voiceUrl: opts.webhookUrl,
    voiceMethod: "POST",
    statusCallback: opts.statusUrl,
    statusCallbackMethod: "POST",
  });

  return { sid: number.sid };
}
