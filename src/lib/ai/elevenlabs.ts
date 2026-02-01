/**
 * ElevenLabs TTS - Real-time text-to-speech for Romanian pronunciation
 * Model: eleven_multilingual_v2
 * Uses existing ELEVENLABS_API_KEY env var
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const MODEL_ID = "eleven_multilingual_v2";

// Default Romanian female voice (from existing voice pool)
const DEFAULT_VOICE_ID = "PoHUWWWMHFrA8z7Q88pu";

const MAX_TEXT_LENGTH = 200;

export class TTSValidationError extends Error {}

export interface TTSOptions {
  speed?: number; // 0.5-2.0, default 1.0
  voiceId?: string;
}

/**
 * Generate speech audio from Romanian text via ElevenLabs API
 * Returns raw audio bytes (MP3 format)
 */
export async function generateSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<ArrayBuffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new TTSValidationError("ELEVENLABS_API_KEY is not configured");
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new TTSValidationError("Text cannot be empty");
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new TTSValidationError(`Text too long (max ${MAX_TEXT_LENGTH} characters)`);
  }

  const voiceId = options.voiceId || DEFAULT_VOICE_ID;
  const speed = options.speed ?? 1.0;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: trimmed,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} ${err}`);
  }

  return response.arrayBuffer();
}
