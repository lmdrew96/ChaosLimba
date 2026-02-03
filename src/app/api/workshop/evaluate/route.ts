import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { saveErrorPatternsToGarden, getWorkshopFeatureTarget } from '@/lib/db/queries';
import { evaluateWorkshopResponse, generateWorkshopChallenge } from '@/lib/ai/workshop';
import { trackFeatureExposure } from '@/lib/ai/exposure-tracker';
import type { WorkshopChallenge } from '@/lib/ai/workshop';
import type { CEFRLevelEnum } from '@/lib/db/schema';
import type { ExtractedErrorPattern } from '@/types/aggregator';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { challenge, response, sessionId } = body as {
      challenge: WorkshopChallenge;
      response: string;
      sessionId: string;
    };

    if (!challenge || !response?.trim() || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: challenge, response, sessionId' },
        { status: 400 }
      );
    }

    // Get user level
    const prefs = await db
      .select({ languageLevel: userPreferences.languageLevel })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    const userLevel = (prefs[0]?.languageLevel || 'A1') as CEFRLevelEnum;

    // Evaluate response
    const evaluation = await evaluateWorkshopResponse(challenge, response.trim(), userLevel);

    // Track errors to Error Garden (fire-and-forget)
    {
      const errorPatterns: ExtractedErrorPattern[] = evaluation.grammarErrors.map(err => ({
        type: (err.type || 'grammar') as ExtractedErrorPattern['type'],
        category: err.category || 'general',
        pattern: `${err.learner_production} → ${err.correct_form}`,
        learnerProduction: err.learner_production,
        correctForm: err.correct_form,
        confidence: err.confidence,
        severity: err.confidence >= 0.8 ? 'high' as const : err.confidence >= 0.5 ? 'medium' as const : 'low' as const,
        inputType: 'text' as const,
        feedbackType: err.feedbackType || 'error',
      }));

      // Also capture the Groq evaluation's correction when the answer is wrong,
      // so errors reach the Error Garden even if analyzeGrammar() missed them
      if (!evaluation.isCorrect && evaluation.correction) {
        const alreadyCovered = errorPatterns.some(
          p => p.correctForm === evaluation.correction
        );
        if (!alreadyCovered) {
          errorPatterns.push({
            type: 'grammar',
            category: challenge.featureKey || 'general',
            pattern: `${response.trim()} → ${evaluation.correction}`,
            learnerProduction: response.trim(),
            correctForm: evaluation.correction,
            confidence: 0.75,
            severity: 'medium',
            inputType: 'text',
            feedbackType: 'error',
          });
        }
      }

      if (errorPatterns.length > 0) {
        saveErrorPatternsToGarden(errorPatterns, userId, sessionId, 'workshop').catch(err => {
          console.error('[Workshop Evaluate] Failed to save errors:', err);
        });
      }
    }

    // Track feature exposure
    if (evaluation.usedTargetStructure || evaluation.isCorrect) {
      trackFeatureExposure({
        userId,
        sessionId,
        contentFeatures: [],
        producedFeatures: [challenge.featureKey],
        correctedFeatures: [],
      }).catch(() => {});
    } else {
      trackFeatureExposure({
        userId,
        sessionId,
        contentFeatures: [],
        producedFeatures: [],
        correctedFeatures: [challenge.featureKey],
      }).catch(() => {});
    }

    // Pre-fetch next challenge to reduce latency
    let nextChallenge = null;
    try {
      const target = await getWorkshopFeatureTarget(userId, userLevel);
      if (target) {
        nextChallenge = await generateWorkshopChallenge(target.feature, userLevel);
      }
    } catch (err) {
      console.error('[Workshop Evaluate] Failed to pre-fetch next challenge:', err);
    }

    return NextResponse.json({
      evaluation,
      nextChallenge,
    });
  } catch (error) {
    console.error('[Workshop Evaluate API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate workshop response' },
      { status: 500 }
    );
  }
}
