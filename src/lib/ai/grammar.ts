// src/lib/ai/grammar.ts
// Grammar correction using HuggingFace Inference API
// Model: lmdrew96/ro-grammar-mt5-small (your custom trained model)

export interface GrammarError {
  type: string;
  learner_production: string;
  correct_form: string;
  confidence: number;
  category?: string;
}

export interface GrammarResult {
  correctedText: string;
  errors: GrammarError[];
  grammarScore: number;
}

const MODEL_ID = 'lmdrew96/ro-grammar-mt5-small';
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

export function clearGrammarCache(): void {
  grammarCache.clear();
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
    console.log(`Grammar cache hit for: "${normalizedText}"`);
    return cached;
  }

  const token = process.env.HUGGINGFACE_API_TOKEN || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

  if (!token) {
    throw new Error('HuggingFace API token not configured');
  }

  try {
    console.log(`Analyzing: "${normalizedText}"`);

    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: `correct: ${normalizedText}`,
          parameters: {
            max_length: 512,
            num_beams: 5,
          },
          options: {
            wait_for_model: true,
            use_cache: true,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF API error: ${response.status} ${errorText}`);
    }

    const output = await response.json();

    // HF Inference API returns array: [{ generated_text: "..." }]
    let correctedText = normalizedText;

    if (Array.isArray(output) && output[0]?.generated_text) {
      correctedText = output[0].generated_text.trim();
    } else if (typeof output === 'object' && output.generated_text) {
      correctedText = output.generated_text.trim();
    } else if (Array.isArray(output) && typeof output[0] === 'string') {
      correctedText = output[0].trim();
    } else {
      console.warn('Unexpected grammar model output format:', output);
    }

    console.log(`Corrected: "${correctedText}"`);

    const errors = extractErrors(normalizedText, correctedText);
    const grammarScore = calculateGrammarScore(normalizedText, correctedText);

    const result: GrammarResult = {
      correctedText,
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

function extractErrors(original: string, corrected: string): GrammarError[] {
  if (original === corrected) return [];

  const origWords = original.split(/\s+/);
  const corrWords = corrected.split(/\s+/);
  const errors: GrammarError[] = [];

  // Simple word-by-word comparison
  const maxLen = Math.max(origWords.length, corrWords.length);

  for (let i = 0; i < maxLen; i++) {
    const origWord = origWords[i] || '';
    const corrWord = corrWords[i] || '';

    if (origWord !== corrWord) {
      errors.push({
        type: 'grammar_correction',
        learner_production: origWord || '[missing]',
        correct_form: corrWord || '[removed]',
        confidence: 0.85,
        category: categorizeError(origWord, corrWord),
      });
    }
  }

  return errors;
}

function categorizeError(original: string, corrected: string): string {
  // Simple heuristics for error categorization
  const origLower = original.toLowerCase();
  const corrLower = corrected.toLowerCase();

  // Check for diacritics
  if (origLower.replace(/[ăâîșț]/g, '') === corrLower.replace(/[ăâîșț]/g, '')) {
    return 'diacritics';
  }

  // Check for verb endings (common conjugation errors)
  const verbEndings = ['esc', 'ez', 'ează', 'ăm', 'ați', 'esc'];
  if (verbEndings.some(e => corrLower.endsWith(e) || origLower.endsWith(e))) {
    return 'verb_conjugation';
  }

  // Check for article issues
  if (['-ul', '-a', '-le', '-ilor'].some(e => corrLower.endsWith(e) !== origLower.endsWith(e))) {
    return 'article';
  }

  // Check for agreement
  if (corrLower.endsWith('ă') !== origLower.endsWith('ă') ||
    corrLower.endsWith('i') !== origLower.endsWith('i') ||
    corrLower.endsWith('e') !== origLower.endsWith('e')) {
    return 'agreement';
  }

  return 'grammar';
}

function calculateGrammarScore(original: string, corrected: string): number {
  if (original === corrected) return 100;

  const origWords = original.split(/\s+/);
  const corrWords = corrected.split(/\s+/);

  let matches = 0;
  const maxLen = Math.max(origWords.length, corrWords.length);

  for (let i = 0; i < maxLen; i++) {
    if (origWords[i] === corrWords[i]) {
      matches++;
    }
  }

  const accuracy = matches / maxLen;
  return Math.round(accuracy * 100);
}