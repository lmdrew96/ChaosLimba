/**
 * Romanian Pronunciation Analysis using Wav2Vec2
 * Model: gigant/romanian-wav2vec2
 * Purpose: Transcribe Romanian speech and analyze pronunciation quality
 */

const MODEL_ID = "gigant/romanian-wav2vec2";
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

export function clearPronunciationCache() {
  pronunciationCache.clear();
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
 * @param audioData - Base64 encoded audio data or audio blob URL
 * @param expectedText - Optional expected Romanian text for scoring
 * @param threshold - Pronunciation accuracy threshold (default 0.70 = 70% match)
 */
export async function analyzePronunciation(
  audioData: string | Blob,
  expectedText?: string,
  threshold: number = 0.70
): Promise<PronunciationResult> {
  const start = Date.now();

  // Convert Blob to base64 if needed
  let audioBase64: string;
  if (audioData instanceof Blob) {
    if (audioData.size > MAX_AUDIO_SIZE_MB * 1024 * 1024) {
      throw new ValidationError(`Audio file too large (max ${MAX_AUDIO_SIZE_MB}MB)`);
    }
    audioBase64 = await blobToBase64(audioData);
  } else {
    audioBase64 = audioData;
  }

  if (!audioBase64) {
    throw new ValidationError("Audio data cannot be empty");
  }

  // Check cache
  const cacheKey = hashAudioData(audioBase64);
  const cachedResult = getCache(cacheKey);

  if (cachedResult) {
    // Recalculate pronunciation score if expectedText provided and different
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

  const token = process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN;

  if (!token) {
    throw new ValidationError("HuggingFace API token not configured");
  }

  try {
    // Wav2Vec2 expects raw audio data
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: audioBase64,
          options: {
            wait_for_model: true,
            use_cache: true
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HF API error: ${response.status} ${err}`);
    }

    // Wav2Vec2 output format: { text: "transcribed text" }
    const output = await response.json();

    let transcribedText = "";
    let confidence = 0;

    if (output && typeof output.text === 'string') {
      transcribedText = output.text;
      // Some models return confidence, default to 0.8 if not provided
      confidence = output.confidence ?? 0.8;
    } else {
      console.warn("Unexpected Wav2Vec2 output format:", output);
      throw new Error("Invalid model output format");
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
      modelUsed: MODEL_ID,
      processingTimeMs: Date.now() - start
    };

    setCache(cacheKey, result);

    console.log(
      `Pronunciation analysis completed in ${result.processingTimeMs}ms`
    );

    if (pronunciationScore !== undefined) {
      console.log(
        `Pronunciation score: ${(pronunciationScore * 100).toFixed(1)}%`
      );
    }

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
 * Convert Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data:audio/...;base64, prefix if present
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
  const base64Audio = audioBuffer.toString('base64');

  return analyzePronunciation(base64Audio, expectedText, threshold);
}
