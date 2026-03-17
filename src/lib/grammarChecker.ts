// src/lib/grammarChecker.ts
// Provider-agnostic Romanian grammar checker
// Romanian grammar checker using Claude Haiku

export interface GrammarCheckError {
  type: string;
  original: string;
  correction: string;
  explanation: string;
  category?: string;
  feedbackType?: 'error' | 'suggestion'; // Distinguishes objective errors from contextual suggestions
}

export interface GrammarCheckResult {
  originalText: string;
  correctedText: string;
  errors: GrammarCheckError[];
  beautifulMistake?: {
    isBeautiful: boolean;
    note: string;
  };
}

/**
 * Main grammar checking function
 */
export async function checkGrammar(text: string): Promise<GrammarCheckResult> {
  if (!text || !text.trim()) {
    throw new Error('Text cannot be empty');
  }

  return await checkWithClaude(text);
}

/**
 * Check grammar using Claude Haiku 4.5
 */
async function checkWithClaude(text: string): Promise<GrammarCheckResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const prompt = `You are a Romanian grammar checker. Analyze this text and categorize issues into TWO categories:

1. ERRORS (feedbackType: "error") - Objective grammatical violations:
   - Wrong verb conjugation (lucreză → lucrează)
   - Missing/incorrect diacritics (fara → fără)
   - Incorrect case/gender agreement (la o proiect → la un proiect)
   - Word order violations that change meaning

2. SUGGESTIONS (feedbackType: "suggestion") - Grammatically valid but contextually suboptimal:
   - "la un proiect" vs "într-un proiect" (both correct, latter more natural)
   - Register mismatches (overly formal vs colloquial)
   - Awkward phrasing that doesn't violate grammar rules

Also check for a "Beautiful Mistake" — a rare flag for attempts that are wrong but reveal creativity, genuine engagement, or a uniquely human attempt at Romanian. Examples:
- Inventing a word using correct Romanian morphology (e.g., a nonexistent but perfectly formed derivation)
- An accidentally poetic or vivid phrasing that misses the mark linguistically
- A charming literal L1 transfer that shows the learner was truly thinking in Romanian
- A mistake that reveals deep structural understanding even if wrong

Be SELECTIVE. Most attempts will NOT qualify. Set isBeautiful to false unless genuinely struck. The note should be warm and specific — 1–2 sentences max.

Return JSON with:
{
  "originalText": "...",
  "correctedText": "...",
  "errors": [
    {
      "type": "error_type_name",
      "original": "incorrect_text",
      "correction": "correct_text",
      "explanation": "why this is an error/suggestion",
      "category": "specific_category",
      "feedbackType": "error" | "suggestion"
    }
  ],
  "beautifulMistake": {
    "isBeautiful": false,
    "note": ""
  }
}

If no issues, return empty errors array.

Text to check: ${text}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    // Extract text content from Claude's response
    const textContent = result.content?.[0]?.text;
    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    // Parse the JSON response from Claude
    const parsed = parseClaudeResponse(textContent);

    return {
      originalText: parsed.originalText || text,
      correctedText: parsed.correctedText || text,
      errors: parsed.errors || [],
    };
  } catch (error: any) {
    console.error('Claude grammar check failed:', error);
    throw error;
  }
}

/**
 * Parse Claude's response text into structured format
 * Handles both clean JSON and JSON wrapped in markdown code blocks
 */
function parseClaudeResponse(text: string): Partial<GrammarCheckResult> {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;

    const parsed = JSON.parse(jsonText.trim());

    // Normalize the structure to match our interface
    const bm = parsed.beautifulMistake;
    const beautifulMistake = bm?.isBeautiful === true && bm?.note
      ? { isBeautiful: true, note: bm.note }
      : { isBeautiful: false, note: '' };

    return {
      originalText: parsed.originalText || parsed.original_text || parsed.original,
      correctedText: parsed.correctedText || parsed.corrected_text || parsed.corrected,
      errors: (parsed.errors || []).map((error: any) => ({
        type: error.type || 'grammar_correction',
        original: error.original || error.learner_production,
        correction: error.correction || error.correct_form,
        explanation: error.explanation || error.message || '',
        category: error.category,
        feedbackType: error.feedbackType || 'error',
      })),
      beautifulMistake,
    };
  } catch (error) {
    console.error('Failed to parse Claude response:', text);
    throw new Error('Failed to parse grammar check response');
  }
}

