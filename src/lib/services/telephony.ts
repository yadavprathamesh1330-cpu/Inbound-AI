import "server-only";
import * as twilioSvc from "@/lib/services/twilio";
import * as signalwireSvc from "@/lib/services/signalwire";

/**
 * Provider-agnostic telephony facade.
 *
 * Omni AI supports two interchangeable telephony backends so each customer
 * can bring whichever account they already have — Twilio or SignalWire. Both
 * expose the same surface (their LaML/TwiML is byte-identical and their REST
 * clients mirror each other), so callers depend only on this facade and never
 * import a provider directly.
 *
 * Selection is via the `TELEPHONY_PROVIDER` env var ("twilio" | "signalwire"),
 * defaulting to Twilio. (A future enhancement is a per-organization provider
 * column so different tenants can use different providers on one deployment.)
 */
export type TelephonyProvider = "twilio" | "signalwire";

export function getTelephonyProvider(): TelephonyProvider {
  return (process.env.TELEPHONY_PROVIDER ?? "twilio").toLowerCase() ===
    "signalwire"
    ? "signalwire"
    : "twilio";
}

function activeService() {
  return getTelephonyProvider() === "signalwire" ? signalwireSvc : twilioSvc;
}

/** Builds one turn of inbound-call TwiML/LaML (identical output either way). */
export function buildTwimlResponse(
  spokenText: string,
  gatherNext: boolean,
): string {
  return activeService().buildTwimlResponse(spokenText, gatherNext);
}

/** Lists purchasable US local numbers from the active provider. */
export function listAvailableNumbers(areaCode?: string) {
  return activeService().listAvailableNumbers(areaCode);
}

/** Buys a number from the active provider and wires its voice webhook. */
export function buyPhoneNumber(areaCode?: string) {
  return activeService().buyPhoneNumber(areaCode);
}

/** The org's configured outbound number for the active provider. */
export function getConfiguredPhoneNumber(): string {
  return getTelephonyProvider() === "signalwire"
    ? signalwireSvc.getSignalWirePhoneNumber()
    : twilioSvc.getTwilioPhoneNumber();
}
