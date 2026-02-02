/**
 * POST /api/generated-content/background
 * Background generation trigger — called after session completion
 * Generates practice_sentences + corrected_version (always),
 * mini_lesson only if fossilizing pattern exists
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatedContent, userPreferences } from '@/lib/db/schema';
import type { GeneratedContentType } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getUserErrorPatternsForContent } from '@/lib/db/queries';
import {
  generatePracticeSentences,
  generateMiniLesson,
  generateCorrectedVersions,
  computePatternFingerprint,
} from '@/lib/ai/content-generator';
import { generateAndUploadToR2 } from '@/lib/tts/google-cloud';

const BACKGROUND_EXPIRY_DAYS = 30;

async function generateAndStore(
  userId: string,
  contentType: GeneratedContentType,
  romanianText: string,
  englishText: string | null,
  fingerprint: string,
  userLevel: string,
  primaryErrorType: string,
  primaryCategory: string,
  sessionId?: string,
): Promise<'generated' | 'cached'> {
  const now = new Date();

  // Cache check
  const [cached] = await db
    .select({ id: generatedContent.id })
    .from(generatedContent)
    .where(
      and(
        eq(generatedContent.userId, userId),
        eq(generatedContent.contentType, contentType),
        eq(generatedContent.patternFingerprint, fingerprint),
        sql`${generatedContent.audioUrl} IS NOT NULL`,
        sql`(${generatedContent.expiresAt} IS NULL OR ${generatedContent.expiresAt} > ${now})`
      )
    )
    .limit(1);

  if (cached) return 'cached';

  // Generate audio
  const r2Key = `generated/${userId}/${contentType}/${Date.now()}-${fingerprint.slice(0, 8)}.mp3`;
  const { url, metadata } = await generateAndUploadToR2(romanianText, r2Key, {
    voice: 'female',
    speakingRate: 0.95,
  });

  // Store with expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + BACKGROUND_EXPIRY_DAYS);

  await db.insert(generatedContent).values({
    userId,
    contentType,
    trigger: 'background',
    romanianText,
    englishText,
    audioUrl: url,
    audioCharacterCount: metadata.characterCount,
    audioEstimatedCost: String(metadata.estimatedCost),
    targetErrorType: primaryErrorType as 'grammar' | 'pronunciation' | 'vocabulary' | 'word_order',
    targetCategory: primaryCategory,
    patternFingerprint: fingerprint,
    userLevel: userLevel as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
    sessionId,
    voiceGender: 'female',
    expiresAt,
  });

  return 'generated';
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { sessionId } = body;

    // Get user level
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    const userLevel = prefs?.languageLevel ?? 'A1';

    // Fetch error patterns
    const patterns = await getUserErrorPatternsForContent(userId, 5);
    if (patterns.length < 2) {
      return NextResponse.json({
        success: true,
        generated: 0,
        cached: 0,
        skipped: 1,
        reason: 'Not enough error patterns for background generation',
      });
    }

    const fingerprint = computePatternFingerprint(patterns);
    const options = { userLevel, errorPatterns: patterns };
    const primary = patterns[0];

    // Generate content types in parallel
    const tasks: Array<{ type: GeneratedContentType; promise: Promise<'generated' | 'cached'> }> = [];

    // Always generate practice sentences
    const practicePromise = generatePracticeSentences(options).then(result =>
      generateAndStore(
        userId, 'practice_sentences', result.fullText,
        result.sentences.map(s => s.english).join('\n'),
        fingerprint, userLevel, primary.errorType, primary.category, sessionId
      )
    );
    tasks.push({ type: 'practice_sentences', promise: practicePromise });

    // Always generate corrected versions (if examples exist)
    const hasCorrections = patterns.some(p => p.examples.some(e => e.correct));
    if (hasCorrections) {
      const correctPromise = generateCorrectedVersions(options).then(result =>
        generateAndStore(
          userId, 'corrected_version', result.fullText,
          result.corrections.map(c => c.explanation).join('\n'),
          fingerprint, userLevel, primary.errorType, primary.category, sessionId
        )
      );
      tasks.push({ type: 'corrected_version', promise: correctPromise });
    }

    // Generate mini lesson only if fossilizing pattern exists
    const hasFossilizing = patterns.some(p => p.isFossilizing);
    if (hasFossilizing) {
      const lessonPromise = generateMiniLesson(options).then(result =>
        generateAndStore(
          userId, 'mini_lesson', result.romanianText,
          result.englishSummary,
          fingerprint, userLevel, primary.errorType, primary.category, sessionId
        )
      );
      tasks.push({ type: 'mini_lesson', promise: lessonPromise });
    }

    // Run all in parallel, tolerate individual failures
    const results = await Promise.allSettled(tasks.map(t => t.promise));

    let generated = 0;
    let cached = 0;
    let skipped = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value === 'generated') generated++;
        else cached++;
      } else {
        console.error('[generated-content/background] Task failed:', result.reason);
        skipped++;
      }
    }

    return NextResponse.json({ success: true, generated, cached, skipped });
  } catch (error) {
    console.error('[generated-content/background]', error);
    return new NextResponse('Background generation failed', { status: 500 });
  }
}
