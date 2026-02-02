/**
 * Personalized content generator for ChaosLimbă
 * Takes error patterns → generates targeted Romanian text via Groq/Llama (FREE)
 * Output is fed to Google Cloud TTS for audio synthesis
 */

import { callGroq } from './groq';
import { createHash } from 'crypto';
import type { ContentErrorPattern } from '@/lib/db/queries';

export class ContentGeneratorError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ContentGeneratorError';
  }
}

// ── Input/Output types ─────────────────────────────────────

export interface ContentGenerationOptions {
  userLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  errorPatterns: ContentErrorPattern[];
  voice?: 'female' | 'male';
}

export interface GeneratedPracticeSentences {
  contentType: 'practice_sentences';
  sentences: Array<{
    romanian: string;
    english: string;
    targetFeature: string;
  }>;
  fullText: string;
}

export interface GeneratedMiniLesson {
  contentType: 'mini_lesson';
  title: string;
  romanianText: string;
  englishSummary: string;
  targetFeatures: string[];
}

export interface GeneratedCorrectedVersions {
  contentType: 'corrected_version';
  corrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  fullText: string;
}

export type GeneratedContentResult =
  | GeneratedPracticeSentences
  | GeneratedMiniLesson
  | GeneratedCorrectedVersions;

// ── Cache fingerprint ──────────────────────────────────────

export function computePatternFingerprint(patterns: ContentErrorPattern[]): string {
  const normalized = patterns
    .map(p => `${p.errorType}|${p.category}|${p.examples.map(e => e.incorrect).sort().join(',')}`)
    .sort()
    .join('::');
  return createHash('md5').update(normalized).digest('hex').slice(0, 16);
}

// ── System prompt ──────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Romanian language content creator for ChaosLimba, an app that helps learners master Romanian.
You create targeted practice content based on a learner's specific error patterns.
Your Romanian is natural and accurate. You adjust difficulty to CEFR levels.
You ALWAYS respond in valid JSON format. No markdown, no code fences.`;

// ── Helpers ────────────────────────────────────────────────

function formatPatternsForPrompt(patterns: ContentErrorPattern[]): string {
  return patterns.map(p =>
    `- ${p.errorType}/${p.category} (${p.isFossilizing ? 'FOSSILIZING' : `${p.frequency}% frequency`}): ${
      p.examples.slice(0, 3).map(e =>
        `"${e.incorrect}" → "${e.correct || '?'}"`
      ).join(', ')
    }`
  ).join('\n');
}

function cleanGroqJson(output: string): string {
  return output
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .trim();
}

// ── Practice Sentences ─────────────────────────────────────

export async function generatePracticeSentences(
  options: ContentGenerationOptions
): Promise<GeneratedPracticeSentences> {
  const { userLevel, errorPatterns } = options;

  if (errorPatterns.length === 0) {
    throw new ContentGeneratorError('At least one error pattern is required');
  }

  const prompt = `Generate 5 practice sentences in Romanian targeting these error patterns for a ${userLevel} learner:

${formatPatternsForPrompt(errorPatterns)}

Each sentence MUST:
1. Naturally use the grammatical structure the learner struggles with
2. Be at ${userLevel} CEFR difficulty
3. Demonstrate the CORRECT usage (not the error)
4. Be a complete, natural-sounding Romanian sentence

Return JSON:
{
  "sentences": [
    {
      "romanian": "Correct Romanian sentence",
      "english": "English translation",
      "targetFeature": "which error pattern this practices"
    }
  ]
}`;

  const output = await callGroq([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ]);

  const parsed = JSON.parse(cleanGroqJson(output));
  const fullText = parsed.sentences.map((s: { romanian: string }) => s.romanian).join('. \n');

  return {
    contentType: 'practice_sentences',
    sentences: parsed.sentences,
    fullText,
  };
}

// ── Mini Lesson ────────────────────────────────────────────

export async function generateMiniLesson(
  options: ContentGenerationOptions
): Promise<GeneratedMiniLesson> {
  const { userLevel, errorPatterns } = options;

  if (errorPatterns.length === 0) {
    throw new ContentGeneratorError('At least one error pattern is required');
  }

  const primary = errorPatterns[0];

  const prompt = `Create a short Romanian mini-lesson (spoken narration style) for a ${userLevel} learner.

Target error: ${primary.errorType}/${primary.category}
Learner's common mistakes: ${primary.examples.slice(0, 3).map(e =>
    `"${e.incorrect}" should be "${e.correct || '?'}"`).join(', ')}

The lesson should:
1. Be narrated IN ROMANIAN (this will be converted to audio)
2. Be 150-300 words (1-2 minutes of audio)
3. Explain the rule through examples, not abstract grammar terminology
4. Include 3-4 example sentences demonstrating correct usage
5. End with a brief encouraging prompt to practice
6. Adjust complexity to ${userLevel} level

Return JSON:
{
  "title": "Short descriptive title in Romanian",
  "romanianText": "The full lesson narration in Romanian",
  "englishSummary": "2-3 sentence summary in English of what the lesson covers",
  "targetFeatures": ["list", "of", "targeted", "features"]
}`;

  const output = await callGroq([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ], 0.7);

  const parsed = JSON.parse(cleanGroqJson(output));

  return {
    contentType: 'mini_lesson',
    title: parsed.title,
    romanianText: parsed.romanianText,
    englishSummary: parsed.englishSummary,
    targetFeatures: parsed.targetFeatures || [],
  };
}

// ── Corrected Versions ─────────────────────────────────────

export async function generateCorrectedVersions(
  options: ContentGenerationOptions
): Promise<GeneratedCorrectedVersions> {
  const { userLevel, errorPatterns } = options;

  const allExamples = errorPatterns.flatMap(p =>
    p.examples.filter(e => e.correct).map(e => ({
      incorrect: e.incorrect,
      correct: e.correct!,
      category: p.category,
    }))
  ).slice(0, 8);

  if (allExamples.length === 0) {
    throw new ContentGeneratorError('No correctable examples found in error patterns');
  }

  const prompt = `A ${userLevel} Romanian learner made these errors. For each one, provide:
1. The corrected Romanian sentence (natural-sounding, complete)
2. A brief English explanation of WHY it's correct

Errors:
${allExamples.map((e, i) => `${i + 1}. Error: "${e.incorrect}" → Correct: "${e.correct}" (${e.category})`).join('\n')}

Return JSON:
{
  "corrections": [
    {
      "original": "the incorrect version",
      "corrected": "the full corrected sentence in Romanian",
      "explanation": "brief English explanation of the correction"
    }
  ]
}`;

  const output = await callGroq([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ]);

  const parsed = JSON.parse(cleanGroqJson(output));
  const fullText = parsed.corrections
    .map((c: { corrected: string }) => c.corrected)
    .join('. \n');

  return {
    contentType: 'corrected_version',
    corrections: parsed.corrections,
    fullText,
  };
}
