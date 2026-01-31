import { db } from './index';
import { errorLogs, NewErrorLog, ErrorSource, ErrorType } from './schema';
import { ExtractedErrorPattern } from '@/types/aggregator';
import { eq, and } from 'drizzle-orm';

/**
 * Saves error patterns from the Feedback Aggregator to the Error Garden database
 *
 * Maps ExtractedErrorPattern[] to NewErrorLog[] and performs bulk insert.
 * Includes deduplication logic to prevent inserting the same error multiple times
 * within a single session.
 *
 * @param patterns - Array of error patterns from Feedback Aggregator
 * @param userId - Clerk user ID
 * @param sessionId - Session UUID
 * @param source - Source of the errors (e.g., 'chaos_window')
 * @returns Array of inserted ErrorLog records
 */
export async function saveErrorPatternsToGarden(
  patterns: ExtractedErrorPattern[],
  userId: string,
  sessionId: string,
  source: ErrorSource
): Promise<typeof errorLogs.$inferSelect[]> {
  if (patterns.length === 0) {
    console.log('[saveErrorPatternsToGarden] No error patterns to save');
    return [];
  }

  try {
    // Check for existing errors in this session (simple deduplication)
    const existingErrors = await db
      .select()
      .from(errorLogs)
      .where(
        and(
          eq(errorLogs.userId, userId),
          eq(errorLogs.sessionId, sessionId)
        )
      );

    // Create a Set of existing error fingerprints for quick lookup
    const existingFingerprints = new Set(
      existingErrors.map(err =>
        `${err.errorType}:${err.category}:${err.context}:${err.correction}`
      )
    );

    // Map patterns to NewErrorLog format, filtering duplicates
    const newErrors: NewErrorLog[] = patterns
      .filter(pattern => {
        // Create fingerprint for this pattern
        const fingerprint = `${pattern.type}:${pattern.category}:${pattern.learnerProduction}:${pattern.correctForm}`;

        // Skip if already logged in this session
        if (existingFingerprints.has(fingerprint)) {
          console.log(`[saveErrorPatternsToGarden] Skipping duplicate error: ${fingerprint}`);
          return false;
        }

        return true;
      })
      .map(pattern => ({
        userId,
        errorType: mapPatternTypeToErrorType(pattern.type),
        category: pattern.category,
        context: pattern.learnerProduction,
        correction: pattern.correctForm,
        source,
        modality: pattern.inputType, // Track text vs speech
        feedbackType: pattern.feedbackType || 'error', // Distinguish errors from suggestions (default to error)
        sessionId,
        contentId: null, // Can be added later if content tracking is needed
      }));

    if (newErrors.length === 0) {
      console.log('[saveErrorPatternsToGarden] All errors are duplicates, skipping insert');
      return [];
    }

    // Bulk insert using Drizzle transaction
    const insertedErrors = await db.transaction(async (tx) => {
      const results = await tx
        .insert(errorLogs)
        .values(newErrors)
        .returning();

      console.log(`[saveErrorPatternsToGarden] Inserted ${results.length} error patterns to Error Garden`);
      return results;
    });

    return insertedErrors;
  } catch (error) {
    console.error('[saveErrorPatternsToGarden] Failed to save error patterns:', error);
    throw new Error('Failed to save error patterns to Error Garden');
  }
}

/**
 * Maps ExtractedErrorPattern.type to ErrorType enum values
 *
 * ExtractedErrorPattern types: 'grammar' | 'pronunciation' | 'semantic' | 'intonation'
 * ErrorType enum: 'grammar' | 'pronunciation' | 'vocabulary' | 'word_order'
 */
function mapPatternTypeToErrorType(patternType: string): ErrorType {
  switch (patternType) {
    case 'grammar':
      return 'grammar';
    case 'pronunciation':
      return 'pronunciation';
    case 'semantic':
      // Semantic errors often relate to word choice/vocabulary
      return 'vocabulary';
    case 'intonation':
      // Intonation can affect meaning, map to pronunciation
      return 'pronunciation';
    default:
      console.warn(`[mapPatternTypeToErrorType] Unknown pattern type: ${patternType}, defaulting to 'grammar'`);
      return 'grammar';
  }
}
