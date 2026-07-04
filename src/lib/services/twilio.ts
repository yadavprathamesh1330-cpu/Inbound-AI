import "server-only";
import twilio from "twilio";
import { requireEnv } from "@/lib/services/errors";

let cachedClient: ReturnType<typeof twilio> | null = null;

function getClient() {
  const accountSid = requireEnv("TWILIO_ACCOUNT_SID", "Twilio");
  const authToken = requireEnv("TWILIO_AUTH_TOKEN", "Twilio");
  if (!cachedClient) {
    cachedClient = twilio(accountSid, authToken);
  }
  return cachedClient;
}

function getConfiguredPhoneNumber(): string {
  return requireEnv("TWILIO_PHONE_NUMBER", "Twilio");
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
 * Purchases a phone number from Twilio (optionally within a given area
 * code) and configures its voice webhook to point at this app's inbound
 * call route, so future calls to it hit `/api/calls/webhook`.
 */
export async function buyPhoneNumber(areaCode?: string) {
  const client = getClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Twilio requires either a specific `phoneNumber` or an `areaCode` to
  // provision from. When no area code is given, fall back to searching for
  // any available number first (Twilio's `create` doesn't support buying
  // "any number" without at least an area code or phone number).
  let phoneNumber: string | undefined;
  if (!areaCode) {
    const candidates = await client.availablePhoneNumbers("US").local.list({
      limit: 1,
    });
    phoneNumber = candidates[0]?.phoneNumber;
    if (!phoneNumber) {
      throw new Error("No available Twilio phone numbers found to purchase.");
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
 * Builds the TwiML response for a single turn of the inbound-call webhook:
 * speaks `spokenText` and, if `gatherNext` is true, gathers the caller's
 * next spoken utterance back to the same webhook URL.
 *
 * SIMPLIFICATION: this uses `<Say>` (Twilio's built-in TTS) as the actual
 * voice output rather than ElevenLabs. `synthesizeSpeech` in
 * `elevenlabs.ts` already produces real MP3 bytes from a real API call —
 * but playing them back over a Twilio call requires a `<Play>` verb with a
 * *publicly reachable URL*, which means hosting the generated audio
 * somewhere (e.g. object storage, or a short-lived route that streams the
 * buffer) before this TwiML is rendered. That hosting piece doesn't exist
 * yet in this codebase, so `<Say>` is the honest, working fallback today.
 * The natural upgrade once audio hosting exists: generate the buffer with
 * `synthesizeSpeech`, upload/serve it at a URL, and swap the `<Say>` below
 * for `gather.play(audioUrl)` / `response.play(audioUrl)`.
 */
export function buildTwimlResponse(
  spokenText: string,
  gatherNext: boolean,
  actionUrl: string = "/api/calls/webhook",
): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  if (gatherNext) {
    const gather = response.gather({
      input: ["speech"],
      action: actionUrl,
      method: "POST",
      speechTimeout: "auto",
    });
    gather.say({ voice: "Polly.Joanna" }, spokenText);
    // If the caller says nothing, Twilio falls through here — repeat/end
    // the call gracefully instead of hanging silently.
    response.say(
      { voice: "Polly.Joanna" },
      "I didn't catch that. Thanks for calling, goodbye.",
    );
    response.hangup();
  } else {
    response.say({ voice: "Polly.Joanna" }, spokenText);
    response.hangup();
  }

  return response.toString();
}

/** Convenience accessor for the org's configured Twilio outbound number. */
export function getTwilioPhoneNumber(): string {
  return getConfiguredPhoneNumber();
}
