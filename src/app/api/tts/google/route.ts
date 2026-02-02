/**
 * Google Cloud TTS API endpoint
 * POST /api/tts/google — Generate Romanian audio, upload to R2, return URL
 * Separate from /api/tts (ElevenLabs) which streams short pronunciation clips
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import {
  generateRomanianAudio,
  GoogleTTSError,
  type VoiceGender,
} from '@/lib/tts/google-cloud';
import { uploadToR2, R2UploadError } from '@/lib/r2';

const MAX_TEXT_LENGTH = 5000;
const VALID_VOICES: VoiceGender[] = ['female', 'male'];

function shortHash(text: string): string {
  return createHash('md5').update(text).digest('hex').slice(0, 8);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { text, voice, speakingRate } = body;

    // Validate text
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const trimmed = text.trim();
    if (trimmed.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text too long (${trimmed.length} chars, max ${MAX_TEXT_LENGTH})` },
        { status: 400 }
      );
    }

    // Validate voice
    if (voice !== undefined && !VALID_VOICES.includes(voice)) {
      return NextResponse.json(
        { error: `Invalid voice. Must be one of: ${VALID_VOICES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate speaking rate
    const rate =
      typeof speakingRate === 'number'
        ? Math.max(0.25, Math.min(4.0, speakingRate))
        : 1.0;

    // Generate audio
    const result = await generateRomanianAudio(trimmed, {
      voice: voice ?? 'female',
      speakingRate: rate,
    });

    // Upload to R2
    const r2Key = `tts/${userId}/${Date.now()}-${shortHash(trimmed)}.mp3`;
    const { url } = await uploadToR2({
      key: r2Key,
      body: result.audioContent,
      contentType: 'audio/mpeg',
    });

    return NextResponse.json({
      success: true,
      audioUrl: url,
      metadata: {
        characters: result.characterCount,
        estimatedCost: result.estimatedCost,
        voice: result.voiceUsed,
      },
    });
  } catch (error) {
    if (error instanceof GoogleTTSError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof R2UploadError) {
      console.error('[TTS/Google] R2 upload failed:', error);
      return NextResponse.json({ error: 'Audio upload failed' }, { status: 500 });
    }
    console.error('[TTS/Google]', error);
    return new NextResponse('TTS generation failed', { status: 500 });
  }
}
