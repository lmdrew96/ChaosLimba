/**
 * SPAM-B: Relevance Scorer
 *
 * Determines if user's response is on-topic relative to content context.
 * Checks semantic similarity between user input and context topics using embeddings.
 *
 * Model: Reuses sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 from SPAM-A
 * Cost: FREE (HF Inference)
 */

import { compareSemanticSimilarity } from './spamA';

// Relevance thresholds
const ON_TOPIC_THRESHOLD = 0.45; // Embeddings are stricter than Jaccard
const PARTIALLY_RELEVANT_THRESHOLD = 0.25;

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_TEXT_LENGTH = 512;

type RelevanceCache = {
  expiresAt: number;
  result: SpamBResult;
};

export interface ContentContext {
  title?: string;
  main_topics: string[];
  difficulty?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  full_content?: string;
}

export interface TopicAnalysis {
  content_topics: string[];
  user_topics: string[]; // Not available with embedding generic check, but kept for interface compat
  topic_overlap: number; // 0-1, max semantic similarity
  suggested_redirect?: string;
}

export interface SpamBResult {
  relevance_score: number; // 0-1, max semantic similarity
  interpretation: 'on_topic' | 'partially_relevant' | 'off_topic';
  topic_analysis: TopicAnalysis;
  fallbackUsed: boolean;
  processingTime?: number;
}

export class ValidationError extends Error { }

// Cache key: "userText|topics"
const relevanceCache = new Map<string, RelevanceCache>();

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

function getCacheKey(userText: string, topics: string[]): string {
  const sortedTopics = [...topics].sort().join(',');
  return `${normalizeText(userText)}|${sortedTopics}`;
}

function setCache(key: string, result: SpamBResult) {
  relevanceCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    result
  });
}

function getCache(key: string): SpamBResult | null {
  const hit = relevanceCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    relevanceCache.delete(key);
    return null;
  }
  return hit.result;
}

export function clearSpamBCache() {
  relevanceCache.clear();
}

/**
 * Generate helpful redirect message based on content topics
 */
function generateRedirect(contentTopics: string[], interpretation: string): string | undefined {
  if (interpretation === 'on_topic') {
    return undefined; // No redirect needed
  }

  const topicsStr = contentTopics.slice(0, 3).join(', ');

  if (interpretation === 'off_topic') {
    return `Să ne întoarcem la subiect: ${topicsStr}`;
  } else {
    // partially_relevant
    return `Încearcă să te concentrezi mai mult pe: ${topicsStr}`;
  }
}

// Dummy export for interface compatibility if needed, though we don't use it anymore
export async function extractTopicsFromText(text: string): Promise<string[]> {
  return text.split(/\s+/).slice(0, 5);
}

/**
 * Analyze relevance of user response to content context
 * Uses generic semantic similarity against context/topics
 */
export async function analyzeRelevance(
  userText: string,
  contentContext: ContentContext
): Promise<SpamBResult> {
  const start = Date.now();
  const normalizedUser = normalizeText(userText || "");

  // Validation
  if (!normalizedUser) {
    throw new ValidationError("User text cannot be empty");
  }

  if (normalizedUser.length > MAX_TEXT_LENGTH) {
    throw new ValidationError(`User text is too long (max ${MAX_TEXT_LENGTH} characters)`);
  }

  if ((!contentContext.main_topics || contentContext.main_topics.length === 0) && !contentContext.full_content) {
    throw new ValidationError("Content context must include main_topics or full_content");
  }

  // Derive effective topics to check against
  // If implicit full_content is provided, we treat it as one "topic" (the context text)
  // If explicit topics are provided, we check against them
  const topicsToCheck: string[] = [];

  if (contentContext.main_topics && contentContext.main_topics.length > 0) {
    contentContext.main_topics.forEach(t => topicsToCheck.push(t));
  }

  // If we have full content and few topics, add full content excerpt as a comparison target too?
  // Actually, comparing against full content paragraph might be GOOD for similarity.
  if (contentContext.full_content) {
    topicsToCheck.push(contentContext.full_content);
  }

  // Check cache
  const cacheKey = getCacheKey(normalizedUser, topicsToCheck);
  const cached = getCache(cacheKey);

  if (cached) {
    return {
      ...cached,
      processingTime: Date.now() - start
    };
  }

  try {
    let maxSimilarity = 0;

    // We check user text against EACH context topic/text and take the MAX similarity
    // This allows "Soup" to match "Food" highly, even if it doesn't match "Restaurant" as highly
    // Batching this would be better but spamA does 1 calls per comparison. 
    // However, HF inference is fast. 
    // Optimization: If topicsToCheck > 3, maybe join them? No, joining dilutes meaning.
    // Let's limit to checking top 3 items to avoid rate limits? 
    // Or just check against the joined string of topics?
    // "Food Restaurant Menu" vs "Soup". Embedding of "Food Restaurant Menu" might be close to "Soup".

    // Approach: Compare against the joined string of topics FIRST.
    // If that's low, maybe check individual?
    // Let's try comparing against the joined string of main_topics.

    const contextString = contentContext.main_topics.join(' ');
    const targets = [contextString];
    if (contentContext.full_content && contentContext.full_content !== contextString) {
      targets.push(contentContext.full_content);
    }

    // Run comparisons in parallel
    const promises = targets.filter(t => t.length > 0).map(target =>
      compareSemanticSimilarity(normalizedUser, target, 0.1) // Low threshold to just get the score
    );

    const results = await Promise.all(promises);

    // Get max score
    maxSimilarity = Math.max(...results.map(r => r.similarity));

    // Interpret relevance score
    let interpretation: 'on_topic' | 'partially_relevant' | 'off_topic';
    if (maxSimilarity >= ON_TOPIC_THRESHOLD) {
      interpretation = 'on_topic';
    } else if (maxSimilarity >= PARTIALLY_RELEVANT_THRESHOLD) {
      interpretation = 'partially_relevant';
    } else {
      interpretation = 'off_topic';
    }

    const result: SpamBResult = {
      relevance_score: maxSimilarity,
      interpretation,
      topic_analysis: {
        content_topics: contentContext.main_topics,
        user_topics: [], // Not extracted anymore
        topic_overlap: maxSimilarity,
        suggested_redirect: generateRedirect(contentContext.main_topics, interpretation)
      },
      fallbackUsed: results.some(r => r.fallbackUsed),
      processingTime: Date.now() - start
    };

    setCache(cacheKey, result);

    return result;

  } catch (error) {
    console.error("[SPAM-B] ❌ Error analyzing relevance:", error);

    // Fallback? spamA already has fallback (Levenshtein).
    // If spamA fails, it returns Levenshtein similarity.

    return {
      relevance_score: 0,
      interpretation: 'off_topic',
      topic_analysis: {
        content_topics: contentContext.main_topics,
        user_topics: [],
        topic_overlap: 0
      },
      fallbackUsed: true,
      processingTime: Date.now() - start
    };
  }
}
