/**
 * YouTube Audio Extraction Utility
 *
 * Extracts audio from YouTube videos when captions are unavailable,
 * then transcribes with Groq Whisper v3 (FREE).
 *
 * Flow:
 * 1. Check if yt-dlp is installed (graceful degradation if not)
 * 2. Extract first 10 minutes of audio from YouTube video (mono, 16kHz, 48kbps MP3)
 * 3. Transcribe audio with Groq Whisper API
 * 4. Clean up temp file
 * 5. Return transcript or null on failure
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const TEMP_DIR = path.join(process.cwd(), '.temp-yt-audio');
const MAX_AUDIO_SIZE_MB = 20; // Conservative limit (Groq likely ~25MB like OpenAI)

/**
 * Check if yt-dlp is installed on the system
 * @returns true if yt-dlp is available, false otherwise
 */
function checkYtDlpInstalled(): boolean {
  try {
    execSync('which yt-dlp', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract audio from YouTube video and transcribe with Groq Whisper
 *
 * Extracts first 10 minutes only to keep file size small (~3.6MB).
 * Audio format: MP3, mono, 16kHz, 48kbps (optimized for speech recognition).
 *
 * @param videoId - YouTube video ID (e.g., 'dQw4w9WgXcQ')
 * @returns Object with transcript string, or null if extraction/transcription fails
 *
 * @example
 * const result = await extractYouTubeAudioAndTranscribe('dQw4w9WgXcQ');
 * if (result) {
 *   console.log('Transcript:', result.transcript);
 * }
 */
export async function extractYouTubeAudioAndTranscribe(
  videoId: string
): Promise<{ transcript: string } | null> {
  // Check if yt-dlp is installed
  if (!checkYtDlpInstalled()) {
    console.warn('[YouTube Audio] yt-dlp not installed, skipping audio extraction');
    console.warn('[YouTube Audio] Install with: brew install yt-dlp (macOS) or pip install yt-dlp');
    return null;
  }

  // Ensure temp directory exists
  try {
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
      console.log(`[YouTube Audio] Created temp directory: ${TEMP_DIR}`);
    }
  } catch (error) {
    console.error('[YouTube Audio] Failed to create temp directory:', error);
    return null;
  }

  const tempPath = path.join(TEMP_DIR, `${videoId}.mp3`);

  try {
    console.log(`[YouTube Audio] Extracting audio for video ${videoId}...`);

    // Extract first 10 minutes of audio: mono, 16kHz, 48kbps MP3
    // Timeout after 60 seconds to prevent hanging
    const ytdlpCommand = `yt-dlp --extract-audio --audio-format mp3 --audio-quality 48k --postprocessor-args "ffmpeg:-ar 16000 -ac 1 -t 600" --output "${tempPath}" "https://youtube.com/watch?v=${videoId}"`;

    execSync(ytdlpCommand, {
      stdio: 'pipe', // Suppress stdout/stderr
      timeout: 60000 // 60 second timeout
    });

    console.log(`[YouTube Audio] Audio extracted to ${tempPath}`);

    // Check if file exists and get size
    if (!fs.existsSync(tempPath)) {
      console.error('[YouTube Audio] Extraction completed but file not found');
      return null;
    }

    const stats = fs.statSync(tempPath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > MAX_AUDIO_SIZE_MB) {
      console.warn(`[YouTube Audio] File too large: ${fileSizeMB.toFixed(2)}MB (max: ${MAX_AUDIO_SIZE_MB}MB)`);
      fs.unlinkSync(tempPath);
      return null;
    }

    console.log(`[YouTube Audio] File size: ${fileSizeMB.toFixed(2)}MB, transcribing with Groq Whisper...`);

    // Read audio file and create blob for Groq API
    const audioBuffer = fs.readFileSync(tempPath);
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

    // Prepare FormData for Groq Whisper API
    const formData = new FormData();
    formData.append('file', audioBlob, `${videoId}.mp3`);
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'ro'); // Romanian
    formData.append('response_format', 'json');

    // Call Groq Whisper API
    const transcriptionResponse = await fetch(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: formData
      }
    );

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('[YouTube Audio] Groq Whisper transcription failed:', errorText);
      return null;
    }

    const result = await transcriptionResponse.json();
    const transcript = result.text;

    if (!transcript || transcript.length === 0) {
      console.error('[YouTube Audio] Transcription returned empty result');
      return null;
    }

    console.log(`[YouTube Audio] Successfully transcribed ${transcript.length} characters`);

    return { transcript };

  } catch (error: any) {
    // Check for specific error types
    if (error.message?.includes('ffmpeg')) {
      console.error('[YouTube Audio] FFmpeg not found. Install with: brew install ffmpeg (macOS)');
    } else if (error.code === 'ETIMEDOUT') {
      console.error(`[YouTube Audio] Extraction timed out for video ${videoId}`);
    } else {
      console.error(`[YouTube Audio] Extraction failed for ${videoId}:`, error.message);
    }
    return null;
  } finally {
    // Clean up temp file (even if transcription failed)
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
        console.log(`[YouTube Audio] Cleaned up temp file: ${tempPath}`);
      }
    } catch (cleanupError) {
      console.warn(`[YouTube Audio] Failed to clean up temp file: ${tempPath}`, cleanupError);
    }
  }
}
