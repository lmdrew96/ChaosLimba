/**
 * YouTube Audio Extraction & Transcription Utility
 *
 * Uses Python script with yt-dlp + Groq SDK for reliable transcription.
 * This replaces the previous TypeScript implementation which had issues
 * with FormData/Blob handling and Groq API calls.
 *
 * Flow:
 * 1. Call Python script (transcribe-youtube.py)
 * 2. Python downloads audio using yt-dlp (64k bitrate, first 10 min)
 * 3. Python transcribes with Groq Whisper v3 Turbo
 * 4. Returns transcript via stdout
 */

import { execSync } from 'child_process';
import * as path from 'path';

/**
 * Check if required Python dependencies are installed
 * @returns true if Python, yt-dlp, and groq are available
 */
function checkPythonDepsInstalled(): boolean {
  try {
    execSync('python3 -c "import yt_dlp; import groq"', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract audio from YouTube video and transcribe with Groq Whisper
 *
 * Uses Python script with yt-dlp + Groq SDK for reliability.
 * Python handles audio extraction (64k bitrate, first 10min) and
 * Groq Whisper v3 Turbo transcription.
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

  // Check if GROQ_API_KEY is set
  if (!process.env.GROQ_API_KEY) {
    console.error('[YouTube Audio] GROQ_API_KEY not set in environment');
    return null;
  }

  // Check if Python dependencies are installed
  if (!checkPythonDepsInstalled()) {
    console.warn('[YouTube Audio] Python dependencies not installed');
    console.warn('[YouTube Audio] Install with: pip3 install yt-dlp groq');
    return null;
  }

  try {
    console.log(`[YouTube Audio] Transcribing ${videoId} via Python script...`);

    const scriptPath = path.join(process.cwd(), 'scripts', 'transcribe-youtube.py');

    // Call Python script, capture stdout (transcript)
    // stderr is inherited so we see progress logs
    const transcript = execSync(
      `python3 "${scriptPath}" ${videoId} ${process.env.GROQ_API_KEY}`,
      {
        encoding: 'utf-8',
        timeout: 120000, // 2 minutes max
        stdio: ['pipe', 'pipe', 'inherit'] // stderr goes to console for debugging
      }
    ).trim();

    if (!transcript || transcript.length === 0) {
      console.error('[YouTube Audio] Empty transcript returned');
      return null;
    }

    console.log(`[YouTube Audio] Successfully transcribed ${transcript.length} characters`);
    return { transcript };

  } catch (error: any) {
    if (error.code === 'ETIMEDOUT') {
      console.error(`[YouTube Audio] Transcription timed out for ${videoId}`);
    } else {
      console.error(`[YouTube Audio] Failed for ${videoId}:`, error.message);
    }
    return null;
  }
}
