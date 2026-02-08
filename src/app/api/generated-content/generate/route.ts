/**
 * POST /api/generated-content/generate
 * On-demand personalized audio content generation
 * Takes user's error patterns → generates Romanian text → synthesizes audio → uploads to R2
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatedContent, userPreferences, generatedContentTypeEnum } from '@/lib/db/schema';
import type { GeneratedContentType } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getUserErrorPatternsForContent } from '@/lib/db/queries';
import {
  generatePracticeSentences,
  generateMiniLesson,
  generateCorrectedVersions,
  computePatternFingerprint,
  ContentGeneratorError,
} from '@/lib/ai/content-generator';
import { generateAndUploadToR2 } from '@/lib/tts/google-cloud';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { contentType, voice, contentTitle, contentTranscript, contentTopic, contentId, patternContext } = body;

    // Validate content type
    if (!contentType || !generatedContentTypeEnum.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid contentType. Must be one of: ${generatedContentTypeEnum.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user's language level
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    const userLevel = prefs?.languageLevel ?? 'A1';

    // Build patterns: use patternContext for targeted generation, or fall back to generic top-5
    let patterns: Awaited<ReturnType<typeof getUserErrorPatternsForContent>>;

    if (patternContext?.errorType && patternContext?.category) {
      // Construct a single targeted pattern from the Error Garden modal context
      patterns = [{
        errorType: patternContext.errorType,
        category: patternContext.category,
        count: 1,
        frequency: 50,
        isFossilizing: false,
        examples: (patternContext.examples || []).map((ex: { incorrect?: string; correct?: string }) => ({
          incorrect: ex.incorrect || '',
          correct: ex.correct || null,
          context: 'Error Garden',
        })),
        intervention: patternContext.interlanguageRule || 'Targeted practice',
      }];
    } else {
      patterns = await getUserErrorPatternsForContent(userId, 5);
      if (patterns.length === 0) {
        return NextResponse.json(
          { error: 'No error patterns found. Use ChaosLimbă more to build your error profile.' },
          { status: 404 }
        );
      }
    }

    // Compute fingerprint for cache dedup (include contentId so different content = different sentences)
    const fingerprint = computePatternFingerprint(patterns, contentId);

    // Cache check: look for existing content with same fingerprint
    const now = new Date();
    const [cached] = await db
      .select()
      .from(generatedContent)
      .where(
        and(
          eq(generatedContent.userId, userId),
          eq(generatedContent.contentType, contentType as GeneratedContentType),
          eq(generatedContent.patternFingerprint, fingerprint),
          sql`${generatedContent.audioUrl} IS NOT NULL`,
          sql`(${generatedContent.expiresAt} IS NULL OR ${generatedContent.expiresAt} > ${now})`
        )
      )
      .limit(1);

    if (cached) {
      return NextResponse.json({
        success: true,
        content: {
          id: cached.id,
          contentType: cached.contentType,
          audioUrl: cached.audioUrl,
          romanianText: cached.romanianText,
          englishText: cached.englishText,
          targetErrorType: cached.targetErrorType,
          targetCategory: cached.targetCategory,
          cached: true,
        },
      });
    }

    // Build content context if available
    const contentContext = contentTitle
      ? { title: contentTitle as string, transcript: contentTranscript as string | undefined, topic: contentTopic as string | undefined }
      : undefined;

    // Generate content based on type
    // Practice sentences: generate 1 sentence for pronunciation practice (saves TTS cost + only 1 is used)
    const options = { userLevel, errorPatterns: patterns, voice, contentContext, sentenceCount: 1 };
    let romanianText: string;
    let englishText: string | null = null;
    const primaryPattern = patterns[0];

    if (contentType === 'practice_sentences') {
      const result = await generatePracticeSentences(options);
      romanianText = result.fullText;
      englishText = result.sentences.map(s => s.english).join('\n');
    } else if (contentType === 'mini_lesson') {
      const result = await generateMiniLesson(options);
      romanianText = result.romanianText;
      englishText = result.englishSummary;
    } else {
      const result = await generateCorrectedVersions(options);
      romanianText = result.fullText;
      englishText = result.corrections.map(c => c.explanation).join('\n');
    }

    // Synthesize audio and upload to R2
    const r2Key = `generated/${userId}/${contentType}/${Date.now()}-${fingerprint.slice(0, 8)}.mp3`;
    const voiceGender = voice ?? 'female';
    const { url, metadata } = await generateAndUploadToR2(romanianText, r2Key, {
      voice: voiceGender,
      speakingRate: 0.95,
    });

    // Save to database
    const [saved] = await db
      .insert(generatedContent)
      .values({
        userId,
        contentType: contentType as GeneratedContentType,
        trigger: 'on_demand',
        romanianText,
        englishText,
        audioUrl: url,
        audioCharacterCount: metadata.characterCount,
        audioEstimatedCost: String(metadata.estimatedCost),
        targetErrorType: primaryPattern.errorType as 'grammar' | 'pronunciation' | 'vocabulary' | 'word_order',
        targetCategory: primaryPattern.category,
        patternFingerprint: fingerprint,
        userLevel,
        voiceGender,
      })
      .returning();

    return NextResponse.json({
      success: true,
      content: {
        id: saved.id,
        contentType: saved.contentType,
        audioUrl: saved.audioUrl,
        romanianText: saved.romanianText,
        englishText: saved.englishText,
        targetErrorType: saved.targetErrorType,
        targetCategory: saved.targetCategory,
        cached: false,
      },
    });
  } catch (error) {
    if (error instanceof ContentGeneratorError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generated-content/generate]', message, error);
    return NextResponse.json(
      { error: `Content generation failed: ${message}` },
      { status: 500 }
    );
  }
}
