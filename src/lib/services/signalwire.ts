import "server-only";
import { RestClient } from "@signalwire/compatibility-api";
import type { RestClientInstance } from "@signalwire/compatibility-api";
import { requireEnv } from "@/lib/services/errors";

/**
 * SignalWire telephony service — one of two interchangeable providers behind
 * `telephony.ts` (the other is `twilio.ts`). SignalWire exposes a
 * Twilio-compatible "Compatibility API": the REST client mirrors Twilio's SDK
 * surface and LaML is byte-compatible with TwiML, so this module intentionally
 * exposes the exact same function shapes as `twilio.ts`.
 *
 * Required env (only when TELEPHONY_PROVIDER=signalwire):
 *   SIGNALWIRE_PROJECT_ID   — project UUID from the SignalWire dashboard
 *   SIGNALWIRE_API_TOKEN    — API token (starts with "PT...")
 *   SIGNALWIRE_SPACE_URL    — your space host, e.g. "myspace.signalwire.com"
 *   SIGNALWIRE_PHONE_NUMBER — the E.164 number calls come in on
 */
let cachedClient: RestClientInstance | null = null;

function getClient(): RestClientInstance {
  const projectId = requireEnv("SIGNALWIRE_PROJECT_ID", "SignalWire");
  const apiToken = requireEnv("SIGNALWIRE_API_TOKEN", "SignalWire");
  const spaceUrl = requireEnv("SIGNALWIRE_SPACE_URL", "SignalWire");
  if (!cachedClient) {
    cachedClient = new RestClient(projectId, apiToken, {
      signalwireSpaceUrl: spaceUrl,
    });
  }
  return cachedClient;
}

function getConfiguredPhoneNumber(): string {
  return requireEnv("SIGNALWIRE_PHONE_NUMBER", "SignalWire");
}

/**
 * Lists available (not-yet-purchased) US local phone numbers, optionally
 * filtered by area code, that can be bought via `buyPhoneNumber`.
 */
export async function listAvailableNumbers(areaCode?: string) {
  const client = getClient();
  const numbers = await client
    .availablePhoneNumbers("US")
    .local.list({ areaCode: areaCode ? Number(areaCode) : undefined, limit: 20 });

  return numbers.map((n) => ({
    phoneNumber: n.phoneNumber,
    friendlyName: n.friendlyName,
    locality: n.locality,
    region: n.region,
    capabilities: n.capabilities,
  }));
}

/**
 * Purchases a phone number from SignalWire (optionally within a given area
 * code) and configures its voice webhook to point at this app's inbound
 * call route, so future calls to it hit `/api/calls/webhook`.
 */
export async function buyPhoneNumber(areaCode?: string) {
  const client = getClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let phoneNumber: string | undefined;
  if (!areaCode) {
    const candidates = await client.availablePhoneNumbers("US").local.list({
      limit: 1,
    });
    phoneNumber = candidates[0]?.phoneNumber;
    if (!phoneNumber) {
      throw new Error("No available SignalWire phone numbers found to purchase.");
    }
  }

  const purchased = await client.incomingPhoneNumbers.create({
    ...(phoneNumber ? { phoneNumber } : { areaCode }),
    voiceUrl: `${appUrl}/api/calls/webhook`,
    voiceMethod: "POST",
    statusCallback: `${appUrl}/api/calls/webhook/status`,
    statusCallbackMethod: "POST",
  });

  return {
    sid: purchased.sid,
    phoneNumber: purchased.phoneNumber,
    friendlyName: purchased.friendlyName,
  };
}

/**
 * Builds the LaML (TwiML-compatible) response for a single turn of the
 * inbound-call webhook. Identical XML shape to the Twilio builder.
 */
export function buildTwimlResponse(
  spokenText: string,
  gatherNext: boolean,
  actionUrl: string = "/api/calls/webhook",
): string {
  const VoiceResponse = RestClient.LaML.VoiceResponse;
  const response = new VoiceResponse();
  const VOICE = "Polly.Joanna";

  if (gatherNext) {
    const gather = response.gather({
      input: ["speech"],
      action: actionUrl,
      method: "POST",
      speechTimeout: "auto",
    });
    gather.say({ voice: VOICE }, spokenText);
    response.say(
      { voice: VOICE },
      "I didn't catch that. Thanks for calling, goodbye.",
    );
    response.hangup();
  } else {
    response.say({ voice: VOICE }, spokenText);
    response.hangup();
  }

  return response.toString();
}

/** Convenience accessor for the org's configured SignalWire number. */
export function getSignalWirePhoneNumber(): string {
  return getConfiguredPhoneNumber();
}
