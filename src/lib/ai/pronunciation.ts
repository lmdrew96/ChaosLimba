/**
 * Romanian Pronunciation Analysis using Groq Whisper
 * Transcribes Romanian speech via Groq (FREE) and scores against expected text
 */

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_AUDIO_SIZE_MB = 10; // 10MB limit for audio files

type PronunciationCache = {
  expiresAt: number;
  result: PronunciationResult;
};

export interface PronunciationResult {
  transcribedText: string;
  confidence: number; // 0-1, model's confidence in transcription
  pronunciationScore?: number; // 0-1, how well it matches expected text
  isAccurate: boolean; // true if pronunciationScore >= threshold
  threshold: number;
  fallbackUsed: boolean;
  modelUsed?: string;
  processingTimeMs?: number;
}

export class ValidationError extends Error { }

// Cache key: base64 hash of audio
const pronunciationCache = new Map<string, PronunciationCache>();

/**
 * Simple hash function for audio data caching
 */
function hashAudioData(audioData: string): string {
  let hash = 0;
  for (let i = 0; i < audioData.length; i++) {
    const char = audioData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

function setCache(key: string, result: PronunciationResult) {
  pronunciationCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    result
  });
}

function getCache(key: string): PronunciationResult | null {
  const hit = pronunciationCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    pronunciationCache.delete(key);
    return null;
  }
  return hit.result;
}


/**
 * Calculate pronunciation accuracy by comparing transcribed text with expected text
 * Simple Levenshtein-based similarity for now
 */
function calculatePronunciationScore(
  transcribed: string,
  expected: string
): number {
  if (!transcribed || !expected) return 0;

  const t = transcribed.toLowerCase().trim();
  const e = expected.toLowerCase().trim();

  // Exact match
  if (t === e) return 1.0;

  // Simple Levenshtein distance
  const distance = levenshteinDistance(t, e);
  const maxLen = Math.max(t.length, e.length);

  return Math.max(0, 1 - (distance / maxLen));
}

/**
 * Levenshtein distance for pronunciation similarity
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Analyze Romanian pronunciation from audio input
 * Uses Groq Whisper (FREE) for transcription, then Levenshtein scoring
 * @param audioData - Audio Blob or base64 string
 * @param expectedText - Optional expected Romanian text for scoring
 * @param threshold - Pronunciation accuracy threshold (default 0.70 = 70% match)
 */
export async function analyzePronunciation(
  audioData: string | Blob,
  expectedText?: string,
  threshold: number = 0.70
): Promise<PronunciationResult> {
  const start = Date.now();

  // Validate size if Blob
  if (audioData instanceof Blob) {
    if (audioData.size > MAX_AUDIO_SIZE_MB * 1024 * 1024) {
      throw new ValidationError(`Audio file too large (max ${MAX_AUDIO_SIZE_MB}MB)`);
    }
  }

  // Build a cache key from the audio data
  let cacheKey: string;
  if (audioData instanceof Blob) {
    const arrayBuffer = await audioData.arrayBuffer();
    cacheKey = hashAudioData(Buffer.from(arrayBuffer).toString('base64').slice(0, 500));
  } else {
    cacheKey = hashAudioData(audioData.slice(0, 500));
  }

  // Check cache
  const cachedResult = getCache(cacheKey);
  if (cachedResult) {
    if (expectedText && cachedResult.transcribedText) {
      const pronunciationScore = calculatePronunciationScore(
        cachedResult.transcribedText,
        expectedText
      );
      return {
        ...cachedResult,
        pronunciationScore,
        isAccurate: pronunciationScore >= threshold,
        threshold
      };
    }
    return cachedResult;
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new ValidationError("GROQ_API_KEY not configured");
  }

  try {
    // Build FormData for Groq Whisper API
    const formData = new FormData();

    if (audioData instanceof Blob) {
      formData.append('file', audioData, 'recording.webm');
    } else {
      // base64 string — convert to Blob
      const buffer = Buffer.from(audioData, 'base64');
      const blob = new Blob([buffer], { type: 'audio/webm' });
      formData.append('file', blob, 'recording.webm');
    }

    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'ro');
    formData.append('response_format', 'verbose_json');

    const response = await fetch(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq Whisper error: ${response.status} ${err}`);
    }

    const output = await response.json();
    const transcribedText = (output.text || '').trim();

    // Groq verbose_json includes segment-level info; derive confidence from segments
    let confidence = 0.85; // Whisper large-v3 is generally high confidence
    if (output.segments && output.segments.length > 0) {
      const avgNoSpeechProb = output.segments.reduce(
        (sum: number, s: { no_speech_prob?: number }) => sum + (s.no_speech_prob ?? 0), 0
      ) / output.segments.length;
      confidence = Math.max(0, 1 - avgNoSpeechProb);
    }

    // Calculate pronunciation score if expected text provided
    let pronunciationScore: number | undefined;
    if (expectedText) {
      pronunciationScore = calculatePronunciationScore(transcribedText, expectedText);
    }

    const result: PronunciationResult = {
      transcribedText,
      confidence,
      pronunciationScore,
      isAccurate: pronunciationScore ? pronunciationScore >= threshold : false,
      threshold,
      fallbackUsed: false,
      modelUsed: 'whisper-large-v3',
      processingTimeMs: Date.now() - start
    };

    setCache(cacheKey, result);

    return result;

  } catch (error) {
    console.error("Pronunciation analysis failed:", error);
    return {
      transcribedText: "",
      confidence: 0,
      pronunciationScore: 0,
      isAccurate: false,
      threshold,
      fallbackUsed: true,
      processingTimeMs: Date.now() - start
    };
  }
}

/**
 * Analyze pronunciation from audio file path (for server-side usage)
 */
export async function analyzePronunciationFromFile(
  audioFilePath: string,
  expectedText?: string,
  threshold?: number
): Promise<PronunciationResult> {
  const fs = await import('fs/promises');
  const audioBuffer = await fs.readFile(audioFilePath);
  const blob = new Blob([audioBuffer], { type: 'audio/webm' });

  return analyzePronunciation(blob, expectedText, threshold);
}
