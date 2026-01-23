// src/lib/ai/grammar.ts
import { pipeline, env } from '@xenova/transformers';

// Set HF token for authentication (even though model is public)
if (process.env.HUGGINGFACE_API_TOKEN) {
  (env as any).HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
}

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

let grammarPipeline: any = null;

async function getGrammarPipeline() {
  if (!grammarPipeline) {
    console.log('Loading grammar model (first time only)...');
    grammarPipeline = await pipeline(
      'text2text-generation',
      'lmdrew96/ro-grammar-mt5-small',
      {
        // Force it to use your token
        revision: 'main',
      }
    );
  }
  return grammarPipeline;
}

// ... rest of the code stays the same
export async function analyzeGrammar(text: string): Promise<GrammarResult> {
  try {
    console.log(`Analyzing: "${text}"`);
    
    const pipe = await getGrammarPipeline();
    
    const result = await pipe(`correct: ${text}`, {
      max_length: 512,
      num_beams: 5,
    });
    
    const correctedText = result[0]?.generated_text || text;
    console.log(`Corrected: "${correctedText}"`);
    
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