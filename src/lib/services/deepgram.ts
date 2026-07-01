import "server-only";
import { DeepgramClient } from "@deepgram/sdk";
import { requireEnv } from "@/lib/services/errors";

let cachedClient: DeepgramClient | null = null;

function getClient(): DeepgramClient {
  const apiKey = requireEnv("DEEPGRAM_API_KEY", "Deepgram");
  if (!cachedClient) {
    cachedClient = new DeepgramClient({ apiKey });
  }
  return cachedClient;
}

/**
 * Transcribes a single chunk of recorded audio (e.g. a Twilio call
 * recording, or a buffered segment of a live call) using Deepgram's
 * prerecorded/batch REST endpoint.
 *
 * NOTE on "streaming/chunked STT during a live call": true low-latency
 * live transcription would use Deepgram's realtime WebSocket API
 * (`client.listen.v1.connect` / the `v2` streaming client) fed by a Twilio
 * Media Stream, so partial transcripts arrive while the caller is still
 * speaking. This repo's webhook currently uses Twilio's `<Gather
 * input="speech">`, which already does turn-level STT itself and hands us
 * finished text (`SpeechResult`) — so this function is deliberately the
 * simpler chunk-based REST call, exposed for any code path (e.g. a
 * recorded voicemail, or a future Media Streams upgrade) that needs to
 * transcribe a raw audio buffer directly via Deepgram instead of relying
 * on Twilio's built-in speech recognition.
 */
export async function transcribeAudioChunk(
  audioBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  const client = getClient();

  const result = await client.listen.v1.media.transcribeFile(
    { data: audioBuffer, contentType: mimeType },
    { model: "nova-3", smart_format: true, punctuate: true },
  );

  if (!("results" in result)) {
    // ListenV1AcceptedResponse: the request was accepted for async/callback
    // processing (only happens when a `callback` URL is supplied, which we
    // don't do here) and has no inline transcript yet.
    return "";
  }

  const transcript =
    result.results.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
  return transcript;
}
