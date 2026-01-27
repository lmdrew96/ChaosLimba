// src/lib/grammarChecker.ts
// Provider-agnostic Romanian grammar checker
// Supports multiple AI providers (Claude, OpenAI, etc.)

export interface GrammarCheckError {
  type: string;
  original: string;
  correction: string;
  explanation: string;
  category?: string;
}

export interface GrammarCheckResult {
  originalText: string;
  correctedText: string;
  errors: GrammarCheckError[];
}

type GrammarProvider = 'claude' | 'openai';

const GRAMMAR_PROVIDER = (process.env.GRAMMAR_PROVIDER as GrammarProvider) || 'claude';

/**
 * Main grammar checking function
 * Routes to appropriate provider based on environment variable
 */
export async function checkGrammar(text: string): Promise<GrammarCheckResult> {
  if (!text || !text.trim()) {
    throw new Error('Text cannot be empty');
  }

  switch (GRAMMAR_PROVIDER) {
    case 'claude':
      return await checkWithClaude(text);
    case 'openai':
      return await checkWithOpenAI(text);
    default:
      throw new Error(`Unknown grammar provider: ${GRAMMAR_PROVIDER}`);
  }
}

/**
 * Check grammar using Claude Haiku 4.5
 */
async function checkWithClaude(text: string): Promise<GrammarCheckResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const prompt = `You are a Romanian grammar checker. Analyze this text and return a JSON object with: original text, corrected text, and an array of errors (each with: type, original, correction, explanation). Text to check: ${text}`;

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
        max_tokens: 500,
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
    return {
      originalText: parsed.originalText || parsed.original_text || parsed.original,
      correctedText: parsed.correctedText || parsed.corrected_text || parsed.corrected,
      errors: (parsed.errors || []).map((error: any) => ({
        type: error.type || 'grammar_correction',
        original: error.original || error.learner_production,
        correction: error.correction || error.correct_form,
        explanation: error.explanation || error.message || '',
        category: error.category,
      })),
    };
  } catch (error) {
    console.error('Failed to parse Claude response:', text);
    throw new Error('Failed to parse grammar check response');
  }
}

/**
 * Check grammar using OpenAI (stub for future implementation)
 */
async function checkWithOpenAI(text: string): Promise<GrammarCheckResult> {
  // TODO: Implement OpenAI grammar checking
  // Will use GPT-4o-mini or similar model
  throw new Error('OpenAI provider not yet implemented');
}
