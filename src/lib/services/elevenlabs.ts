import "server-only";
import { requireEnv } from "@/lib/services/errors";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io";

/**
 * Synthesizes speech for `text` using ElevenLabs' text-to-speech REST API,
 * returning raw MP3 audio bytes.
 *
 * Implemented via `fetch` directly (rather than the `elevenlabs` npm SDK)
 * per the task brief — this is a single POST endpoint, so a dependency
 * isn't worth the extra install for what it saves.
 */
export async function synthesizeSpeech(
  text: string,
  voiceId: string,
): Promise<Buffer> {
  const apiKey = requireEnv("ELEVENLABS_API_KEY", "ElevenLabs");

  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs text-to-speech request failed (${response.status}): ${errorBody}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
