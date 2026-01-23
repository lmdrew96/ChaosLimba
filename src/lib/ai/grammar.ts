// src/lib/ai/grammar.ts

const HF_API = "https://router.huggingface.co";
const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const MODEL_NAME = "lmdrew96/ro-grammar-mt5-small";

interface GrammarError {
  type: string;
  learner_production: string;
  correct_form: string;
  confidence: number;
  category?: string;
}

interface GrammarResult {
  correctedText: string;
  errors: GrammarError[];
  grammarScore: number;
}

export async function analyzeGrammar(text: string): Promise<GrammarResult> {
  if (!HF_TOKEN) {
    throw new Error('HUGGINGFACE_API_TOKEN not found in .env.local');
  }

  try {
    console.log(`Analyzing: "${text}"`);
    
    const response = await fetch(`${HF_API}/models/${MODEL_NAME}`, {
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: text,
        parameters: {
          max_length: 512,
          num_beams: 5,
          early_stopping: true,
        },
        options: {
          wait_for_model: true,
          use_cache: false,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Raw HF response:', result);
    
    const correctedText = result[0]?.generated_text || text;
    const errors = extractErrors(text, correctedText);
    const grammarScore = calculateGrammarScore(text, correctedText);

    return {
      correctedText,
      errors,
      grammarScore,
    };
  } catch (error: any) {
    console.error("Grammar analysis failed:", error);
    throw error;
  }
}

function extractErrors(original: string, corrected: string): GrammarError[] {
  if (original === corrected) return [];

  const origWords = original.split(/\s+/);
  const corrWords = corrected.split(/\s+/);
  const errors: GrammarError[] = [];
  
  for (let i = 0; i < Math.max(origWords.length, corrWords.length); i++) {
    if (origWords[i] !== corrWords[i]) {
      errors.push({
        type: 'grammar_correction',
        learner_production: origWords[i] || '[missing]',
        correct_form: corrWords[i] || '[removed]',
        confidence: 0.85,
        category: 'grammar',
      });
    }
  }

  return errors;
}

function calculateGrammarScore(original: string, corrected: string): number {
  if (original === corrected) return 100;
  
  const origWords = original.split(/\s+/);
  const corrWords = corrected.split(/\s+/);
  const errors = origWords.filter((word, i) => word !== corrWords[i]).length;
  
  const accuracy = 1 - (errors / Math.max(origWords.length, corrWords.length));
  return Math.round(accuracy * 100);
}
