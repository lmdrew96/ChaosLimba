import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { contentItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { fetchYouTubeTranscript, getYouTubeTranscriptSource } from '@/lib/utils/youtube-transcript';
import { transcribeAudioUrl } from '@/lib/utils/audio-transcript';
import { extractYouTubeAudioAndTranscribe } from '@/lib/utils/youtube-audio';

/**
 * GET /api/content/transcript/[contentId]
 *
 * Fetches transcript for content item:
 * 1. Return cached transcript if exists
 * 2. Fetch from YouTube if video
 * 3. Transcribe with Groq Whisper if audio
 * 4. Cache result in database for future sessions
 *
 * This enables on-demand transcript fetching without blocking content curation workflow
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentId } = await params;

    console.log(`[Transcript API] Fetching transcript for content ${contentId}`);

    // Fetch content item
    const content = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.id, contentId))
      .limit(1);

    if (content.length === 0) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const item = content[0];

    // If transcript already exists, return it (cached)
    if (item.transcript) {
      console.log(`[Transcript API] Using cached transcript (${item.transcript.length} chars)`);
      return NextResponse.json({
        transcript: item.transcript,
        source: item.transcriptSource,
        cached: true
      });
    }

    console.log(`[Transcript API] No cached transcript, fetching on-demand for ${item.type} content`);

    // Generate transcript based on content type
    let transcript: string | null = null;
    let transcriptSource: string | null = null;

    if (item.type === 'video' && item.youtubeId) {
      console.log(`[Transcript API] Fetching YouTube captions for video ${item.youtubeId}`);
      transcript = await fetchYouTubeTranscript(item.youtubeId);
      transcriptSource = getYouTubeTranscriptSource();

      // FALLBACK: If captions unavailable, try audio extraction + Whisper
      if (!transcript) {
        console.log(`[Transcript API] Captions unavailable, attempting audio extraction...`);
        const audioResult = await extractYouTubeAudioAndTranscribe(item.youtubeId);

        if (audioResult) {
          transcript = audioResult.transcript;
          transcriptSource = 'whisper_youtube_fallback';
          console.log(`[Transcript API] Successfully transcribed via audio extraction (${transcript.length} chars)`);
        } else {
          console.warn(`[Transcript API] Audio extraction failed for ${item.youtubeId}`);
        }
      }
    } else if (item.type === 'audio' && item.audioUrl) {
      console.log(`[Transcript API] Transcribing audio with Groq Whisper: ${item.audioUrl}`);
      transcript = await transcribeAudioUrl(item.audioUrl);
      transcriptSource = 'whisper';
    } else if (item.type === 'text') {
      // Text content doesn't need transcript - use textContent directly
      return NextResponse.json({
        error: 'Text content does not require transcript',
        fallback: item.textContent || `Content: "${item.title}"`
      }, { status: 400 });
    }

    if (!transcript) {
      console.warn(`[Transcript API] Failed to fetch transcript for ${item.type} content ${contentId}`);
      return NextResponse.json({
        error: 'No transcript available',
        fallback: `Content: "${item.title}"`
      }, { status: 404 });
    }

    console.log(`[Transcript API] Successfully fetched transcript (${transcript.length} chars), caching to database`);

    // Cache transcript in database for future use
    await db
      .update(contentItems)
      .set({
        transcript,
        transcriptSource,
        transcriptLanguage: 'ro',
        updatedAt: new Date()
      })
      .where(eq(contentItems.id, contentId));

    return NextResponse.json({
      transcript,
      source: transcriptSource,
      cached: false
    });

  } catch (error) {
    console.error('[Transcript API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}
