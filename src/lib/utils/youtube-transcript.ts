import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Fetches transcript/captions for a YouTube video
 * Uses youtube-transcript package (free, no API key required)
 *
 * @param videoId - YouTube video ID (e.g., 'dQw4w9WgXcQ')
 * @param lang - Language code (default: 'ro' for Romanian)
 * @returns Full transcript text or null if unavailable
 */
export async function fetchYouTubeTranscript(
  videoId: string,
  lang: string = 'ro'
): Promise<string | null> {
  try {
    console.log(`[YouTube Transcript] Fetching transcript for ${videoId} (language: ${lang})`);

    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang
    });

    if (!transcript || transcript.length === 0) {
      console.log(`[YouTube Transcript] No transcript found for ${videoId}`);
      return null;
    }

    // Combine transcript segments into full text
    // Each segment has: { text: string, duration: number, offset: number }
    const fullText = transcript.map(segment => segment.text).join(' ');

    console.log(`[YouTube Transcript] Successfully fetched ${fullText.length} characters`);
    return fullText;
  } catch (error) {
    console.error(`[YouTube Transcript] Failed for ${videoId}:`, error);
    return null;
  }
}

/**
 * Gets the transcript source type
 * Note: YouTube API doesn't expose whether captions are auto-generated or manual
 * Defaults to 'youtube_auto' - curator can update manually if verified
 *
 * @returns Transcript source identifier
 */
export function getYouTubeTranscriptSource(): 'youtube_auto' {
  return 'youtube_auto';
}
