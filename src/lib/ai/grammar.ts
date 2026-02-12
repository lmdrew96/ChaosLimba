// src/lib/ai/grammar.ts
// Grammar correction using Claude Haiku 4.5 API
// Provider-agnostic wrapper supports multiple AI providers

export interface GrammarError {
  type: string;
  learner_production: string;
  correct_form: string;
  confidence: number;
  category?: string;
  feedbackType: 'error' | 'suggestion'; // Distinguishes objective errors from contextual suggestions
}

export interface GrammarResult {
  correctedText: string;
  errors: GrammarError[];
  grammarScore: number;
}

import { checkGrammar as checkGrammarWithProvider, GrammarCheckError, GrammarCheckResult } from '@/lib/grammarChecker';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

type GrammarCache = {
  expiresAt: number;
  result: GrammarResult;
};

const grammarCache = new Map<string, GrammarCache>();

function getCacheKey(text: string): string {
  return text.trim().toLowerCase();
}

function getCache(key: string): GrammarResult | null {
  const hit = grammarCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    grammarCache.delete(key);
    return null;
  }
  return hit.result;
}

function setCache(key: string, result: GrammarResult): void {
  grammarCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    result
  });
}


export async function analyzeGrammar(text: string): Promise<GrammarResult> {
  if (!text || !text.trim()) {
    throw new Error('Text cannot be empty');
  }

  const normalizedText = text.trim();

  // Check cache first
  const cacheKey = getCacheKey(normalizedText);
  const cached = getCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Use the provider-agnostic grammar checker
    const providerResult = await checkGrammarWithProvider(normalizedText);

    // Transform to our existing format
    const errors = transformToGrammarErrors(providerResult.errors);
    const grammarScore = calculateGrammarScore(normalizedText, providerResult.correctedText, errors.length);

    const result: GrammarResult = {
      correctedText: providerResult.correctedText,
      errors,
      grammarScore,
    };

    setCache(cacheKey, result);

    return result;
  } catch (error: any) {
    console.error('Grammar analysis failed:', error);
    throw error;
  }
}

/**
 * Transform GrammarCheckError (from provider) to GrammarError (our existing format)
 */
function transformToGrammarErrors(providerErrors: GrammarCheckError[]): GrammarError[] {
  return providerErrors.map((error) => {
    const feedbackType = error.feedbackType || 'error'; // Default to error if not specified
    let confidence = 0.85; // Default confidence

    // Adjust confidence based on feedbackType and category
    if (feedbackType === 'error') {
      // Errors get higher confidence
      if (error.category === 'spelling' || error.category === 'diacritics') {
        confidence = 0.95; // Claude is very accurate with diacritics
      } else if (error.category === 'grammar' || error.type === 'grammar_correction') {
        confidence = 0.90;
      } else {
        confidence = 0.85;
      }
    } else if (feedbackType === 'suggestion') {
      // Suggestions get lower confidence (ensures they rank below errors in Error Garden)
      confidence = 0.60;
    }

    return {
      type: 'grammar_correction',
      learner_production: error.original,
      correct_form: error.correction,
      confidence,
      category: error.category || categorizeError(error.original, error.correction),
      feedbackType,
    };
  });
}

/**
 * Categorize errors based on the original and corrected text
 * Fallback for when provider doesn't specify category
 */
function categorizeError(original: string, corrected: string): string {
  const origLower = original.toLowerCase();
  const corrLower = corrected.toLowerCase();

  // Check for diacritics
  if (origLower.replace(/[ăâîșț]/g, '') === corrLower.replace(/[ăâîșț]/g, '')) {
    return 'diacritics';
  }

  // Check for verb endings (conjugation)
  const verbEndings = ['esc', 'ez', 'ează', 'ăm', 'ați', 'esc'];
  if (verbEndings.some(e => corrLower.endsWith(e) || origLower.endsWith(e))) {
    return 'verb_conjugation';
  }

  // Check for articles
  if (['-ul', '-a', '-le', '-ilor'].some(e => corrLower.endsWith(e) !== origLower.endsWith(e))) {
    return 'article';
  }

  // Check for agreement (gender/number)
  if (
    corrLower.endsWith('ă') !== origLower.endsWith('ă') ||
    corrLower.endsWith('i') !== origLower.endsWith('i') ||
    corrLower.endsWith('e') !== origLower.endsWith('e')
  ) {
    return 'agreement';
  }

  return 'grammar';
}


function calculateGrammarScore(original: string, corrected: string, errorCount: number): number {
  if (original === corrected || errorCount === 0) return 100;

  // Calculate score based on error density
  // Fewer errors relative to text length = higher score
  const words = original.split(/\s+/).length;
  const errorRate = errorCount / words;

  // Convert error rate to score (0 errors = 100, high error rate = lower score)
  // Scale: 0-10% error rate → 90-100 score
  //        10-20% error rate → 80-90 score
  //        20-30% error rate → 70-80 score
  //        30%+ error rate → below 70
  const score = Math.max(50, Math.round(100 - errorRate * 200));

  return score;
}