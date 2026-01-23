import { HfInference } from "@huggingface/inference";

const MODEL_ID = "dumitrescustefan/bert-base-romanian-cased-v1";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_TEXT_LENGTH = 5000;

type CacheEntry = {
  expiresAt: number;
  result: SpamAResult;
};

export interface SpamAResult {
  label: string;
  score: number;
  raw: unknown;
  fallbackUsed: boolean;
}

export class ValidationError extends Error {}

const cache = new Map<string, CacheEntry>();
let client: HfInference | null = null;

function getClient(): HfInference {
  const token = process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN;
  if (!token) {
    throw new Error("HUGGINGFACE_API_KEY (or HUGGINGFACE_API_TOKEN) is not set");
  }
  if (!client) {
    client = new HfInference(token);
  }
  return client;
}

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function setCache(key: string, result: SpamAResult) {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result });
}

function getCache(key: string): SpamAResult | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.result;
}

export function clearSpamACache() {
  cache.clear();
}

export async function analyzeSpamA(text: string): Promise<SpamAResult> {
  const normalized = normalizeText(text || "");

  if (!normalized) {
    throw new ValidationError("Text cannot be empty");
  }

  if (normalized.length > MAX_TEXT_LENGTH) {
    throw new ValidationError(`Text is too long (max ${MAX_TEXT_LENGTH} characters)`);
  }

  const cached = getCache(normalized);
  if (cached) {
    return cached;
  }

  const hf = getClient();
  const token = process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN;
  const start = Date.now();

  try {
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: normalized }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HF API error: ${response.status} ${err}`);
    }

    const data = await response.json();

    // HF returns either an array of predictions or an array of arrays depending on task
    const predictions = Array.isArray(data) ? data : [];
    const primary = Array.isArray(predictions[0]) ? predictions[0][0] : predictions[0];

    const label = typeof primary?.label === "string" ? primary.label : "unknown";
    const score = typeof primary?.score === "number" ? primary.score : 0;

    const result: SpamAResult = {
      label,
      score,
      raw: data,
      fallbackUsed: false,
    };

    setCache(normalized, result);
    console.log(
      `HF SPAM-A call (${MODEL_ID}) took ${Date.now() - start}ms, label=${label}, score=${score}`
    );

    return result;
  } catch (error) {
    console.error("SPAM-A inference failed:", error);
    const fallback: SpamAResult = {
      label: "unknown",
      score: 0,
      raw: null,
      fallbackUsed: true,
    };
    setCache(normalized, fallback);
    return fallback;
  }
}
