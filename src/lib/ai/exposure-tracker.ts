import { db } from '@/lib/db';
import { userFeatureExposure, grammarFeatureMap } from '@/lib/db/schema';
import type { NewUserFeatureExposure, GrammarFeature } from '@/lib/db/schema';
import { mapErrorCategoryToFeatureKey } from '@/lib/db/queries';
import type { ErrorType } from '@/lib/db/schema';

interface TrackExposureParams {
  userId: string;
  sessionId: string;
  contentId?: string;
  contentFeatures: string[];     // featureKeys from content's languageFeatures.grammar
  producedFeatures: string[];    // featureKeys user attempted (from tutor feedback)
  correctedFeatures: string[];   // featureKeys user was corrected on
}

/**
 * Track which grammar/vocab features a user has been exposed to in a session.
 * Fire-and-forget: errors are logged but don't block the response.
 */
export async function trackFeatureExposure(params: TrackExposureParams): Promise<void> {
  try {
    const records: NewUserFeatureExposure[] = [];

    // Content features the user was exposed to (encountered)
    for (const featureKey of params.contentFeatures) {
      records.push({
        userId: params.userId,
        featureKey,
        exposureType: 'encountered',
        contentId: params.contentId || null,
        sessionId: params.sessionId,
        isCorrect: null,
      });
    }

    // Features the user produced (attempted in response)
    for (const featureKey of params.producedFeatures) {
      records.push({
        userId: params.userId,
        featureKey,
        exposureType: 'produced',
        contentId: params.contentId || null,
        sessionId: params.sessionId,
        isCorrect: true,
      });
    }

    // Features the user was corrected on
    for (const featureKey of params.correctedFeatures) {
      records.push({
        userId: params.userId,
        featureKey,
        exposureType: 'corrected',
        contentId: params.contentId || null,
        sessionId: params.sessionId,
        isCorrect: false,
      });
    }

    if (records.length > 0) {
      await db.insert(userFeatureExposure).values(records);
      console.log(`[ExposureTracker] Tracked ${records.length} feature exposures for user ${params.userId}`);
    }
  } catch (error) {
    // Fire-and-forget: log but don't throw
    console.error('[ExposureTracker] Failed to track exposure:', error);
  }
}

/**
 * Extract produced/corrected feature keys from tutor feedback error patterns.
 * Maps error types and categories to grammar feature keys.
 */
export function extractFeaturesFromErrors(
  errorPatterns: Array<{ type: string; category?: string }>,
): { produced: string[]; corrected: string[] } {
  const corrected: string[] = [];

  for (const pattern of errorPatterns) {
    const featureKey = mapErrorCategoryToFeatureKey(
      pattern.type as ErrorType,
      pattern.category || null
    );
    if (featureKey) {
      corrected.push(featureKey);
    }
  }

  return { produced: [], corrected: [...new Set(corrected)] };
}
