// src/lib/ai/workshop.ts
// Workshop challenge generation and evaluation using Groq (FREE)

import { callGroq, type ChatMessage } from './groq';
import { analyzeGrammar, type GrammarResult, type GrammarError } from './grammar';
import type { GrammarFeature, CEFRLevelEnum } from '@/lib/db/schema';

// ─── Types ───

export type GrammarChallengeType = 'transform' | 'complete' | 'fix' | 'rewrite';
export type VocabChallengeType = 'use_it' | 'which_one' | 'spot_the_trap';
export type WorkshopChallengeType = GrammarChallengeType | VocabChallengeType;

export interface WorkshopChallenge {
  type: WorkshopChallengeType;
  prompt: string;
  targetSentence?: string;
  expectedAnswers: string[];
  hint: string;
  grammarRule: string;
  featureKey: string;
  featureName: string;
}

export interface WorkshopEvaluation {
  isCorrect: boolean;
  score: number; // 0-100
  feedback: string;
  correction?: string;
  ruleExplanation: string;
  grammarErrors: GrammarError[];
  usedTargetStructure: boolean;
}

// ─── Challenge Type Selection ───

const GRAMMAR_CHALLENGE_TYPES: GrammarChallengeType[] = ['transform', 'complete', 'fix', 'rewrite'];
const VOCAB_CHALLENGE_TYPES: VocabChallengeType[] = ['use_it', 'which_one', 'spot_the_trap'];

function pickRandomChallengeType(feature: GrammarFeature): WorkshopChallengeType {
  if (feature.category === 'vocabulary_domain') {
    return VOCAB_CHALLENGE_TYPES[Math.floor(Math.random() * VOCAB_CHALLENGE_TYPES.length)];
  }
  return GRAMMAR_CHALLENGE_TYPES[Math.floor(Math.random() * GRAMMAR_CHALLENGE_TYPES.length)];
}

// ─── JSON Cleaning (same pattern as content-generator.ts) ───

function cleanGroqJson(output: string): string {
  return output
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .trim();
}

// ─── Challenge Generation ───

const CHALLENGE_SYSTEM_PROMPT = `You are a Romanian language teaching assistant creating micro-challenges for learners.
You MUST respond with valid JSON only. No markdown, no explanation outside JSON.

IMPORTANT RULES:
- All Romanian text must use proper diacritics (ă, â, î, ș, ț)
- Keep challenges concise (1-2 sentences max)
- Match the CEFR level strictly — don't exceed the learner's level
- For A1-A2: use simple vocabulary, present tense, basic structures
- For B1+: can use past tense, more complex structures
- Provide 2-4 acceptable answers (accounting for valid variations)
- The hint should nudge without giving away the answer`;

function buildChallengePrompt(
  feature: GrammarFeature,
  userLevel: CEFRLevelEnum,
  challengeType: WorkshopChallengeType
): string {
  const typeInstructions: Record<WorkshopChallengeType, string> = {
    transform: `TRANSFORM challenge: Give a Romanian sentence, ask the learner to transform it (e.g., change tense, make negative, change subject). The learner must rewrite the sentence.`,
    complete: `COMPLETE challenge: Give a Romanian sentence with a blank (___), ask the learner to fill in the correct form. The blank should test the target grammar feature.`,
    fix: `FIX challenge: Give a Romanian sentence with a deliberate grammar error in it. The learner must identify and correct the error. Mark the error clearly.`,
    rewrite: `REWRITE challenge: Give a simple idea in English, ask the learner to write it in Romanian using the target grammar structure.`,
    use_it: `USE IT challenge: Give a Romanian word/phrase and ask the learner to write a complete sentence using it correctly in context.`,
    which_one: `WHICH ONE challenge: Give 3-4 Romanian sentences, only one uses the target vocabulary/structure correctly. The learner picks the correct one and explains why. Return the options as part of the prompt text.`,
    spot_the_trap: `SPOT THE TRAP challenge: Give a Romanian sentence that looks correct but has a subtle vocabulary/usage error (false friend, wrong context, etc). The learner must identify what's wrong.`,
  };

  return `Create a ${challengeType.toUpperCase()} challenge for a ${userLevel} Romanian learner.

Target feature: "${feature.featureName}" (key: ${feature.featureKey})
${feature.description ? `Description: ${feature.description}` : ''}
Category: ${feature.category}
CEFR Level: ${userLevel}

Challenge type instructions:
${typeInstructions[challengeType]}

Respond with this exact JSON structure:
{
  "type": "${challengeType}",
  "prompt": "The challenge instruction and content shown to the learner",
  "targetSentence": "The base sentence if applicable (null for rewrite/use_it)",
  "expectedAnswers": ["correct answer 1", "correct answer variation 2"],
  "hint": "A helpful hint that doesn't give away the answer",
  "grammarRule": "Brief explanation of the grammar rule being tested"
}`;
}

export async function generateWorkshopChallenge(
  feature: GrammarFeature,
  userLevel: CEFRLevelEnum,
  challengeType?: WorkshopChallengeType
): Promise<WorkshopChallenge> {
  const type = challengeType || pickRandomChallengeType(feature);

  const messages: ChatMessage[] = [
    { role: 'system', content: CHALLENGE_SYSTEM_PROMPT },
    { role: 'user', content: buildChallengePrompt(feature, userLevel, type) },
  ];

  const output = await callGroq(messages, 0.8);
  const parsed = JSON.parse(cleanGroqJson(output));

  return {
    type: parsed.type || type,
    prompt: parsed.prompt,
    targetSentence: parsed.targetSentence || undefined,
    expectedAnswers: Array.isArray(parsed.expectedAnswers) ? parsed.expectedAnswers : [],
    hint: parsed.hint || '',
    grammarRule: parsed.grammarRule || '',
    featureKey: feature.featureKey,
    featureName: feature.featureName,
  };
}

// ─── Response Evaluation ───

const EVALUATION_SYSTEM_PROMPT = `You are a Romanian language evaluator. Assess a learner's response to a grammar/vocabulary challenge.
You MUST respond with valid JSON only.

Evaluation criteria:
1. Did they use the target grammar structure correctly?
2. Is the answer semantically correct?
3. Are there any additional grammar errors?
4. Be encouraging — errors are learning opportunities, not failures.

IMPORTANT:
- Be lenient with minor spelling differences (e.g., missing diacritics is a warning, not an error)
- Accept valid alternative phrasings
- Score 80-100 for correct with minor issues, 50-79 for partially correct, 0-49 for incorrect`;

function buildEvaluationPrompt(
  challenge: WorkshopChallenge,
  response: string,
  userLevel: CEFRLevelEnum
): string {
  return `Evaluate this ${userLevel} learner's response to a Romanian ${challenge.type} challenge.

Challenge prompt: "${challenge.prompt}"
${challenge.targetSentence ? `Target sentence: "${challenge.targetSentence}"` : ''}
Expected answers: ${JSON.stringify(challenge.expectedAnswers)}
Grammar rule being tested: "${challenge.grammarRule}"
Feature: "${challenge.featureName}" (${challenge.featureKey})

Learner's response: "${response}"

Respond with this exact JSON:
{
  "isCorrect": true/false,
  "score": 0-100,
  "feedback": "Encouraging feedback about their answer",
  "correction": "The correct form if wrong (null if correct)",
  "ruleExplanation": "Brief explanation of the grammar rule and how it applies",
  "usedTargetStructure": true/false
}`;
}

export async function evaluateWorkshopResponse(
  challenge: WorkshopChallenge,
  response: string,
  userLevel: CEFRLevelEnum
): Promise<WorkshopEvaluation> {
  // Step 1: Grammar analysis via existing Claude Haiku (cached)
  let grammarResult: GrammarResult | null = null;
  try {
    grammarResult = await analyzeGrammar(response);
  } catch (error) {
    console.error('[Workshop] Grammar analysis failed, continuing with Groq eval:', error);
  }

  // Step 2: Semantic evaluation via Groq
  const messages: ChatMessage[] = [
    { role: 'system', content: EVALUATION_SYSTEM_PROMPT },
    { role: 'user', content: buildEvaluationPrompt(challenge, response, userLevel) },
  ];

  const output = await callGroq(messages, 0.3); // Low temperature for consistent evaluation
  const parsed = JSON.parse(cleanGroqJson(output));

  return {
    isCorrect: parsed.isCorrect ?? false,
    score: typeof parsed.score === 'number' ? parsed.score : 0,
    feedback: parsed.feedback || 'Keep practicing!',
    correction: parsed.correction || undefined,
    ruleExplanation: parsed.ruleExplanation || challenge.grammarRule,
    grammarErrors: grammarResult?.errors || [],
    usedTargetStructure: parsed.usedTargetStructure ?? false,
  };
}
