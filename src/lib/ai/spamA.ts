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
 * Analyze semantic similarity between user input and expected answer
 * Uses HF Inference API via Sentence Similarity task
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
      fallbackUsed: false
    };
  }

  const start = Date.now();
  const token = process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN;

  try {
    // The model is loaded as a SentenceSimilarityPipeline
    // We must send inputs in the format: { source_sentence: "...", sentences: ["..."] }
    const response = await fetch(
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
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HF API error: ${response.status} ${err}`);
    }

    // Output is a list of scores, e.g. [0.985]
    const output = await response.json();

    let similarity = 0;
    if (Array.isArray(output) && typeof output[0] === 'number') {
      similarity = output[0];
    } else {
      // Sometimes it might return object with 'score' key?
      // But usually sentence-similarity returns a list of scores corresponding to 'sentences' list
      console.warn("Unexpected HF output format:", output);
      // Safety fallback for unknown formats if any
      similarity = 0;
    }

    setCache(cacheKey, similarity);

    console.log(
      `SPAM-A similarity computed in ${Date.now() - start}ms: ${(similarity * 100).toFixed(1)}%`
    );

    return {
      similarity,
      semanticMatch: similarity >= threshold,
      threshold,
      fallbackUsed: false,
      modelUsed: MODEL_ID
    };

  } catch (error) {
    console.error("SPAM-A semantic similarity failed:", error);
    return {
      similarity: 0,
      semanticMatch: false,
      threshold,
      fallbackUsed: true,
    };
  }
}
