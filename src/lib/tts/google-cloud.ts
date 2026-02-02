/**
 * Google Cloud Text-to-Speech for Romanian audio generation
 * Used for longer-form content (podcasts, lessons) — distinct from ElevenLabs (short pronunciation clips)
 * Pricing: $16 per 1M Wavenet characters ($0.000016/char)
 */

import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { uploadToR2 } from '@/lib/r2';

export class GoogleTTSError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'GoogleTTSError';
  }
}

const VOICES = {
  female: 'ro-RO-Wavenet-A',
  male: 'ro-RO-Wavenet-B',
} as const;

export type VoiceGender = keyof typeof VOICES;

const COST_PER_CHAR = 0.000016;
const MAX_TEXT_LENGTH = 5000;

export interface GoogleTTSOptions {
  voice?: VoiceGender;
  speakingRate?: number;  // 0.25–4.0, default 1.0
  pitch?: number;         // -20.0 to 20.0, default 0.0
  audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
}

export interface GoogleTTSResult {
  audioContent: Buffer;
  characterCount: number;
  estimatedCost: number;
  voiceUsed: string;
}

let client: TextToSpeechClient | null = null;

function getClient(): TextToSpeechClient {
  if (client) return client;

  // Support inline credentials JSON (for Vercel/serverless deployment)
  if (process.env.GOOGLE_TTS_CREDENTIALS_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_TTS_CREDENTIALS_JSON);
      client = new TextToSpeechClient({ credentials });
    } catch (error) {
      throw new GoogleTTSError('Failed to parse GOOGLE_TTS_CREDENTIALS_JSON', { cause: error });
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Local dev: uses credentials file path automatically
    client = new TextToSpeechClient();
  } else {
    throw new GoogleTTSError(
      'Google Cloud TTS credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS (file path) or GOOGLE_TTS_CREDENTIALS_JSON (inline JSON).'
    );
  }

  return client;
}

/**
 * Generate Romanian audio from text via Google Cloud TTS
 */
export async function generateRomanianAudio(
  text: string,
  options: GoogleTTSOptions = {}
): Promise<GoogleTTSResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new GoogleTTSError('Text cannot be empty');
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new GoogleTTSError(`Text too long (${trimmed.length} chars, max ${MAX_TEXT_LENGTH})`);
  }

  const voiceGender = options.voice ?? 'female';
  const voiceName = VOICES[voiceGender];
  const speakingRate = options.speakingRate ?? 1.0;
  const pitch = options.pitch ?? 0.0;
  const audioEncoding = options.audioEncoding ?? 'MP3';

  const ttsClient = getClient();

  const request = {
    input: { text: trimmed },
    voice: {
      languageCode: 'ro-RO',
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: audioEncoding as 'MP3' | 'LINEAR16' | 'OGG_OPUS',
      speakingRate,
      pitch,
    },
  };

  try {
    const [response] = await ttsClient.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new GoogleTTSError('Google Cloud TTS returned empty audio content');
    }

    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
    const characterCount = trimmed.length;
    const estimatedCost = characterCount * COST_PER_CHAR;

    console.log(
      `[Google TTS] ${characterCount} chars, voice=${voiceName}, cost=$${estimatedCost.toFixed(6)}, size=${audioBuffer.length} bytes`
    );

    return {
      audioContent: audioBuffer,
      characterCount,
      estimatedCost,
      voiceUsed: voiceName,
    };
  } catch (error) {
    if (error instanceof GoogleTTSError) throw error;
    throw new GoogleTTSError('Google Cloud TTS synthesis failed', { cause: error });
  }
}

/**
 * Generate Romanian audio and upload directly to R2
 */
export async function generateAndUploadToR2(
  text: string,
  r2Key: string,
  options: GoogleTTSOptions = {}
): Promise<{ url: string; metadata: GoogleTTSResult }> {
  const result = await generateRomanianAudio(text, options);

  const { url } = await uploadToR2({
    key: r2Key,
    body: result.audioContent,
    contentType: 'audio/mpeg',
  });

  return { url, metadata: result };
}
