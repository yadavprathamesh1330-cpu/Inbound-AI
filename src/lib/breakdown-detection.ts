/**
 * Fast, zero-latency breakdown/emergency detection for live calls.
 *
 * Deliberately keyword-based rather than an extra LLM classification call:
 * this runs on every caller turn, and a second OpenAI round-trip per turn
 * would noticeably slow down (and add cost to) every single call just to
 * catch the rare emergency one. Trucking breakdown/emergency language is
 * fairly distinctive, so a keyword match is a reasonable trade of some
 * recall for zero added latency on the hot path.
 */
const BREAKDOWN_KEYWORDS = [
  "break down",
  "broke down",
  "broken down",
  "breakdown",
  "accident",
  "crash",
  "wreck",
  "wrecked",
  "collision",
  "blew a tire",
  "blown tire",
  "blowout",
  "flat tire",
  "tire blew",
  "engine trouble",
  "engine died",
  "overheating",
  "overheated",
  "smoke",
  "on fire",
  "stuck",
  "stranded",
  "pulled over",
  "shoulder of the road",
  "emergency",
  "help me",
  "need help",
  "hurt",
  "injured",
  "ambulance",
  "need a tow",
  "tow truck",
];

export function isBreakdownMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return BREAKDOWN_KEYWORDS.some((keyword) => lower.includes(keyword));
}
