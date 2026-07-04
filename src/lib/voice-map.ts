import type { VoiceAccent, VoiceGender } from "@/generated/prisma/client";

/**
 * Maps an agent's configured voice (gender + accent, set in the create-agent
 * wizard) to a standard Amazon Polly voice name supported by both Twilio's
 * `<Say>` verb and SignalWire's LaML equivalent. Every call previously
 * hardcoded "Polly.Joanna" regardless of this setting — this is what
 * actually makes the wizard's voice picker do something.
 *
 * These are the long-standing "classic" Polly voices (not the newer
 * neural-only ones), so they work without extra enablement on either
 * provider. Amazon Polly's classic set has only one Indian-English voice
 * (Aditi, female) — there's no classic male Indian-English voice, so MALE
 * falls back to Aditi too rather than silently switching to an American
 * voice the agent owner didn't choose.
 */
const VOICE_MAP: Record<VoiceAccent, Record<VoiceGender, string>> = {
  AMERICAN: { FEMALE: "Polly.Joanna", MALE: "Polly.Matthew" },
  BRITISH: { FEMALE: "Polly.Amy", MALE: "Polly.Brian" },
  INDIAN: { FEMALE: "Polly.Aditi", MALE: "Polly.Aditi" },
};

export function resolvePollyVoice(
  gender: VoiceGender | null | undefined,
  accent: VoiceAccent | null | undefined,
): string {
  const g = gender ?? "FEMALE";
  const a = accent ?? "AMERICAN";
  return VOICE_MAP[a]?.[g] ?? "Polly.Joanna";
}
