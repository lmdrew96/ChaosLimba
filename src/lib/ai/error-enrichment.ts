// src/lib/ai/error-enrichment.ts
// Groq-powered error category enrichment for smarter Error Garden clustering.
//
// When errors are logged, Groq normalizes the raw category into a specific
// sub-category from a fixed taxonomy. This makes simple errorType+category
// clustering much more precise without any query-time ML.

import { callGroq } from './groq';

// Fixed taxonomy per error type. Groq picks the best match.
const GRAMMAR_CATEGORIES = [
  'verb_conjugation_present',
  'verb_conjugation_past',
  'verb_conjugation_subjunctive',
  'verb_conjugation_infinitive',
  'verb_conjugation_other',
  'gender_agreement_adjective',
  'gender_agreement_article',
  'gender_agreement_pronoun',
  'case_genitive',
  'case_dative',
  'case_vocative',
  'case_accusative',
  'definite_article_enclitic',
  'indefinite_article',
  'preposition_case_governance',
  'preposition_choice',
  'clitic_placement',
  'clitic_doubling',
  'negation_double',
  'word_order_adjective',
  'word_order_adverb',
  'subjunctive_sa_construction',
  'tense_selection',
  'aspect_perfective_imperfective',
  'diacritics_missing',
  'diacritics_wrong',
  'spelling',
  'general_grammar',
] as const;

const PRONUNCIATION_CATEGORIES = [
  'vowel_quality',
  'vowel_reduction',
  'consonant_devoicing',
  'consonant_palatalization',
  'stress_placement',
  'intonation_pattern',
  'diphthong',
  'general_pronunciation',
] as const;

const VOCABULARY_CATEGORIES = [
  'false_friend',
  'collocation',
  'register_formality',
  'semantic_range',
  'lexical_choice',
  'general_vocabulary',
] as const;

const WORD_ORDER_CATEGORIES = [
  'adjective_position',
  'clitic_order',
  'topic_fronting',
  'adverb_placement',
  'general_word_order',
] as const;

const TAXONOMY: Record<string, readonly string[]> = {
  grammar: GRAMMAR_CATEGORIES,
  pronunciation: PRONUNCIATION_CATEGORIES,
  vocabulary: VOCABULARY_CATEGORIES,
  word_order: WORD_ORDER_CATEGORIES,
};

interface ErrorForEnrichment {
  errorType: string;
  rawCategory: string;
  context: string | null | undefined;
  correction: string | null | undefined;
}

interface EnrichmentResult {
  error?: number;
  index?: number;
  category: string;
}

/**
 * Enrich error categories using Groq (Llama 3.3 70B).
 *
 * Takes a batch of errors and returns normalized categories from the fixed taxonomy.
 * Falls back to the raw category if Groq fails or returns invalid data.
 */
export async function enrichErrorCategories(
  errors: ErrorForEnrichment[]
): Promise<string[]> {
  if (errors.length === 0) return [];

  // Skip enrichment for errors that already match the taxonomy exactly
  const needsEnrichment: { index: number; error: ErrorForEnrichment }[] = [];
  const results: string[] = errors.map(e => e.rawCategory);

  for (let i = 0; i < errors.length; i++) {
    const error = errors[i];
    const validCategories = TAXONOMY[error.errorType];
    if (validCategories && !validCategories.includes(error.rawCategory)) {
      needsEnrichment.push({ index: i, error });
    }
  }

  if (needsEnrichment.length === 0) {
    return results; // All categories already in taxonomy
  }

  try {
    const errorDescriptions = needsEnrichment.map(({ index, error }, i) => {
      const parts = [`Error ${i + 1} (${error.errorType}):`];
      if (error.context) parts.push(`  Learner wrote: "${error.context}"`);
      if (error.correction) parts.push(`  Correct form: "${error.correction}"`);
      parts.push(`  Raw category: "${error.rawCategory}"`);
      parts.push(`  Valid categories: ${TAXONOMY[error.errorType]!.join(', ')}`);
      return parts.join('\n');
    }).join('\n\n');

    const response = await callGroq([
      {
        role: 'system',
        content: `You are a Romanian language error classifier. For each error below, pick the single best matching category from the valid categories list. Respond with JSON: {"results": [{"error": 1, "category": "..."}]}. Only use categories from the valid list provided for each error.`,
      },
      {
        role: 'user',
        content: errorDescriptions,
      },
    ], 0.1, true);

    const parsed = JSON.parse(response);

    if (parsed.results && Array.isArray(parsed.results)) {
      for (const result of parsed.results as EnrichmentResult[]) {
        const errorNum = ((result.error ?? result.index) ?? 0) - 1;
        if (errorNum >= 0 && errorNum < needsEnrichment.length) {
          const { index, error } = needsEnrichment[errorNum];
          const validCategories = TAXONOMY[error.errorType];
          // Only accept if the returned category is actually in our taxonomy
          if (validCategories && validCategories.includes(result.category)) {
            results[index] = result.category;
          }
        }
      }
    }

    console.log(`[Error Enrichment] Enriched ${needsEnrichment.length} categories via Groq`);
  } catch (err) {
    console.error('[Error Enrichment] Groq enrichment failed, using raw categories:', err);
    // Fall back silently — raw categories are still usable
  }

  return results;
}
