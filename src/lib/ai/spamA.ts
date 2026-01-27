import { HfInference } from "@huggingface/inference";

/**
 * Using a robust multilingual sentence transformer model
 * This model supports Romanian and is reliable on HF Inference API
 */
const MODEL_ID = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_TEXT_LENGTH = 512;

type SimilarityCache = {
  expiresAt: number;
  similarity: number;
};

export interface SpamAResult {
  similarity: number; // 0-1
  semanticMatch: boolean; // true if similarity >= threshold
  threshold: number;
  fallbackUsed: boolean;
  fallbackMethod?: 'api' | 'levenshtein' | 'none'; // Which method computed similarity
  modelUsed?: string;
}

export class ValidationError extends Error { }

// Cache key: "userText|expectedText"
const similarityCache = new Map<string, SimilarityCache>();

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function getCacheKey(userText: string, expectedText: string): string {
  // Sort to ensure "A vs B" is same as "B vs A" for caching efficiency
  const parts = [userText, expectedText].sort();
  return `${parts[0]}|${parts[1]}`;
}

function setCache(key: string, similarity: number) {
  similarityCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, similarity });
}

function getCache(key: string): number | null {
  const hit = similarityCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    similarityCache.delete(key);
    return null;
  }
  return hit.similarity;
}

export function clearSpamACache() {
  similarityCache.clear();
}

/**
 * Calculate Levenshtein distance between two strings
 * Used as fallback when HF API is unavailable
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score using Levenshtein distance
 * Returns 0-1 similarity (1 = identical, 0 = completely different)
 */
function levenshteinSimilarity(text1: string, text2: string): number {
  const distance = levenshteinDistance(text1.toLowerCase(), text2.toLowerCase());
  const maxLen = Math.max(text1.length, text2.length);

  if (maxLen === 0) return 1.0; // Both empty strings

  return (maxLen - distance) / maxLen;
}

/**
 * Call HuggingFace API with retry logic and exponential backoff
 * @param maxRetries - Maximum number of retry attempts (default 3)
 */
async function callHFWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Success - return immediately
      if (response.ok) {
        if (attempt > 0) {
          console.log(`[SPAM-A] ✅ Request succeeded on attempt ${attempt + 1}`);
        }
        return response;
      }

      // Only retry on 500-level errors (server-side issues)
      if (response.status >= 500 && response.status < 600) {
        const errorText = await response.text();
        lastError = new Error(`HF API ${response.status}: ${errorText}`);

        // Don't retry on last attempt
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.warn(
            `[SPAM-A] ⚠️  Attempt ${attempt + 1}/${maxRetries} failed with ${response.status}, retrying in ${delay}ms...`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // Client errors (4xx) should not be retried
        const errorText = await response.text();
        throw new Error(`HF API ${response.status}: ${errorText}`);
      }
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(
          `[SPAM-A] ⚠️  Attempt ${attempt + 1}/${maxRetries} failed with error, retrying in ${delay}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // All retries exhausted
  console.error(`[SPAM-A] ❌ All ${maxRetries} attempts failed. Last error:`, lastError);
  throw lastError || new Error('HF API request failed after all retries');
}

/**
 * Analyze semantic similarity between user input and expected answer
 * Uses HF Inference API via Sentence Similarity task with retry logic
 * Falls back to Levenshtein distance if API is unavailable
 * @param userText - The user's Romanian text
 * @param expectedText - The expected Romanian text
 * @param threshold - Similarity threshold (default 0.75 = 75% match)
 */
export async function compareSemanticSimilarity(
  userText: string,
  expectedText: string,
  threshold: number = 0.75
): Promise<SpamAResult> {
  const normalizedUser = normalizeText(userText || "");
  const normalizedExpected = normalizeText(expectedText || "");

  if (!normalizedUser) {
    throw new ValidationError("User text cannot be empty");
  }

  if (!normalizedExpected) {
    throw new ValidationError("Expected text cannot be empty");
  }

  if (normalizedUser.length > MAX_TEXT_LENGTH) {
    throw new ValidationError(`User text is too long (max ${MAX_TEXT_LENGTH} characters)`);
  }

  if (normalizedExpected.length > MAX_TEXT_LENGTH) {
    throw new ValidationError(`Expected text is too long (max ${MAX_TEXT_LENGTH} characters)`);
  }

  // Check cache
  const cacheKey = getCacheKey(normalizedUser, normalizedExpected);
  const cachedScore = getCache(cacheKey);

  if (cachedScore !== null) {
    return {
      similarity: cachedScore,
      semanticMatch: cachedScore >= threshold,
      threshold,
      fallbackUsed: false,
      fallbackMethod: 'none'
    };
  }

  const start = Date.now();
  const token = process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN;

  try {
    // The model is loaded as a SentenceSimilarityPipeline
    // We must send inputs in the format: { source_sentence: "...", sentences: ["..."] }
    const response = await callHFWithRetry(
      `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            source_sentence: normalizedUser,
            sentences: [normalizedExpected]
          },
          options: { wait_for_model: true },
        }),
      },
      3 // maxRetries
    );

    // Output is a list of scores, e.g. [0.985]
    const output = await response.json();

    let similarity = 0;
    if (Array.isArray(output) && typeof output[0] === 'number') {
      similarity = output[0];
    } else {
      // Sometimes it might return object with 'score' key?
      // But usually sentence-similarity returns a list of scores corresponding to 'sentences' list
      console.warn("[SPAM-A] ⚠️  Unexpected HF output format:", output);
      // Safety fallback for unknown formats if any
      similarity = 0;
    }

    setCache(cacheKey, similarity);

    console.log(
      `[SPAM-A] ✅ Similarity computed in ${Date.now() - start}ms: ${(similarity * 100).toFixed(1)}% (API)`
    );

    return {
      similarity,
      semanticMatch: similarity >= threshold,
      threshold,
      fallbackUsed: false,
      fallbackMethod: 'api',
      modelUsed: MODEL_ID
    };

  } catch (error) {
    // All API retries failed - use Levenshtein distance as fallback
    console.warn("[SPAM-A] ⚠️  HF API unavailable after retries, using Levenshtein fallback");
    console.error("[SPAM-A] Error details:", error);

    const similarity = levenshteinSimilarity(normalizedUser, normalizedExpected);
    setCache(cacheKey, similarity);

    console.log(
      `[SPAM-A] ✅ Similarity computed in ${Date.now() - start}ms: ${(similarity * 100).toFixed(1)}% (Levenshtein fallback)`
    );

    return {
      similarity,
      semanticMatch: similarity >= threshold,
      threshold,
      fallbackUsed: true,
      fallbackMethod: 'levenshtein',
      modelUsed: 'levenshtein-distance'
    };
  }
}
