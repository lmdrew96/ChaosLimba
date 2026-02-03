import { db } from './index';
import {
  errorLogs,
  NewErrorLog,
  ErrorSource,
  ErrorType,
  sessions,
  mysteryItems,
  stressMinimalPairs,
  suggestedQuestions,
  readingQuestions,
  tutorOpeningMessages,
} from './schema';
import { ExtractedErrorPattern } from '@/types/aggregator';
import { eq, and, asc, desc, gte, sql, count as drizzleCount } from 'drizzle-orm';

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
 * Lightweight error pattern aggregation for content generation.
 * Groups errors by (errorType, category) and returns top patterns
 * with examples. Simpler than the full clustering in /api/errors/patterns
 * (no Levenshtein distance, no weekly trends) but sufficient for
 * generating personalized practice content.
 */
export interface ContentErrorPattern {
  errorType: string;
  category: string;
  count: number;
  frequency: number; // 0-100
  isFossilizing: boolean;
  examples: Array<{
    incorrect: string;
    correct: string | null;
    context: string | null;
  }>;
  intervention: string;
}

export async function getUserErrorPatternsForContent(
  userId: string,
  limit: number = 5
): Promise<ContentErrorPattern[]> {
  const allLogs = await db
    .select()
    .from(errorLogs)
    .where(eq(errorLogs.userId, userId));

  if (allLogs.length === 0) return [];

  // Group by errorType + category
  const groups: Record<string, typeof allLogs> = {};
  for (const log of allLogs) {
    const key = `${log.errorType}|${log.category || 'general'}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  }

  // Build patterns, sorted by frequency
  const patterns: ContentErrorPattern[] = Object.entries(groups)
    .map(([key, logs]) => {
      const [errorType, category] = key.split('|');
      const count = logs.length;
      const frequency = Math.round((count / allLogs.length) * 100);

      // Get up to 5 most recent examples
      const sortedLogs = logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const examples = sortedLogs.slice(0, 5).map(log => ({
        incorrect: log.context || '',
        correct: log.correction,
        context: log.source === 'chaos_window' ? 'Chaos Window' : 'Content',
      }));

      // Simple intervention text based on error type
      let intervention = 'Focused practice recommended';
      if (errorType === 'grammar') intervention = 'Input flood with correct forms';
      else if (errorType === 'pronunciation') intervention = 'Minimal pair discrimination';
      else if (errorType === 'vocabulary') intervention = 'Contextual vocabulary practice';
      else if (errorType === 'word_order') intervention = 'Scrambled sentence reconstruction';

      return {
        errorType,
        category,
        count,
        frequency,
        isFossilizing: frequency >= 70,
        examples,
        intervention,
      };
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);

  return patterns;
}

/**
 * Fetches suggested pronunciation words and their stress minimal pairs.
 * Returns a list of suggested words and a record mapping each word to its stress variants.
 */
export async function getSuggestedWordsWithPairs(): Promise<{
  words: string[];
  pairs: Record<string, { stress: string; meaning: string; example: string }[]>;
}> {
  const rows = await db
    .select()
    .from(stressMinimalPairs);

  // Extract unique suggested words
  const suggestedSet = new Set<string>();
  const pairs: Record<string, { stress: string; meaning: string; example: string }[]> = {};

  for (const row of rows) {
    if (row.isSuggested) {
      suggestedSet.add(row.word);
    }
    if (!pairs[row.word]) {
      pairs[row.word] = [];
    }
    pairs[row.word].push({
      stress: row.stress,
      meaning: row.meaning,
      example: row.example,
    });
  }

  return {
    words: Array.from(suggestedSet),
    pairs,
  };
}

/**
 * Fetches active suggested questions for the Ask Tutor page.
 */
export async function getActiveSuggestedQuestions(): Promise<string[]> {
  const rows = await db
    .select({ question: suggestedQuestions.question })
    .from(suggestedQuestions)
    .where(eq(suggestedQuestions.isActive, true))
    .orderBy(asc(suggestedQuestions.sortOrder));

  return rows.map((r) => r.question);
}

/**
 * Fetches active reading comprehension questions for onboarding.
 */
export async function getActiveReadingQuestions() {
  const rows = await db
    .select()
    .from(readingQuestions)
    .where(eq(readingQuestions.isActive, true))
    .orderBy(asc(readingQuestions.sortOrder));

  return rows.map((r) => ({
    id: r.id,
    level: r.level,
    passage: r.passage,
    question: r.question,
    options: r.options,
    correctIndex: r.correctIndex,
  }));
}

/**
 * Fetches tutor opening messages keyed by self-assessment level.
 */
export async function getTutorOpeningMessages(): Promise<Record<string, string>> {
  const rows = await db
    .select({
      key: tutorOpeningMessages.selfAssessmentKey,
      message: tutorOpeningMessages.message,
    })
    .from(tutorOpeningMessages)
    .where(eq(tutorOpeningMessages.isActive, true));

  const messages: Record<string, string> = {};
  for (const row of rows) {
    messages[row.key] = row.message;
  }
  return messages;
}

// ─── Dashboard Stats Queries ───

export interface DashboardStats {
  wordsCollected: number;
  practiceStreak: number; // consecutive days with sessions
  errorPatterns: number;
  timeTodayMinutes: number;
}

export interface RecentActivityItem {
  action: string;
  item: string;
  context: string;
  time: string;
}

/**
 * Returns dashboard stats: words collected, practice streak, error patterns, time today.
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  // Run all queries in parallel
  const [wordsResult, errorPatternsResult, todaySessionsResult, streakDays] = await Promise.all([
    // Words collected = mystery shelf items count
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(mysteryItems)
      .where(eq(mysteryItems.userId, userId)),

    // Error patterns count (distinct errorType + category combos)
    db
      .select({ count: sql<number>`count(distinct concat(${errorLogs.errorType}, ':', coalesce(${errorLogs.category}, 'general')))::int` })
      .from(errorLogs)
      .where(eq(errorLogs.userId, userId)),

    // Time today = sum of durationSeconds for today's sessions
    db
      .select({ totalSeconds: sql<number>`coalesce(sum(${sessions.durationSeconds}), 0)::int` })
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          gte(sessions.startedAt, sql`current_date`)
        )
      ),

    // Practice streak: get distinct session dates descending, count consecutive from today
    calculatePracticeStreak(userId),
  ]);

  return {
    wordsCollected: wordsResult[0]?.count ?? 0,
    practiceStreak: streakDays,
    errorPatterns: errorPatternsResult[0]?.count ?? 0,
    timeTodayMinutes: Math.round((todaySessionsResult[0]?.totalSeconds ?? 0) / 60),
  };
}

/**
 * Calculate consecutive days with at least one session, counting back from today.
 */
async function calculatePracticeStreak(userId: string): Promise<number> {
  const rows = await db
    .select({ day: sql<string>`date(${sessions.startedAt})` })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .groupBy(sql`date(${sessions.startedAt})`)
    .orderBy(desc(sql`date(${sessions.startedAt})`));

  if (rows.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let expected = new Date(today);

  for (const row of rows) {
    const sessionDay = new Date(row.day);
    sessionDay.setHours(0, 0, 0, 0);

    // Allow today or yesterday as the first day
    if (streak === 0) {
      const diffFromToday = Math.floor((today.getTime() - sessionDay.getTime()) / (1000 * 60 * 60 * 24));
      if (diffFromToday > 1) break; // No session today or yesterday
      expected = new Date(sessionDay);
    }

    if (sessionDay.getTime() === expected.getTime()) {
      streak++;
      expected.setDate(expected.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get recent activity items for the dashboard.
 * Combines mystery shelf additions, sessions, and error logs.
 */
export async function getRecentActivity(userId: string, limit: number = 5): Promise<RecentActivityItem[]> {
  // Fetch recent items from each source in parallel
  const [recentWords, recentSessions, recentErrors] = await Promise.all([
    db
      .select()
      .from(mysteryItems)
      .where(eq(mysteryItems.userId, userId))
      .orderBy(desc(mysteryItems.createdAt))
      .limit(limit),

    db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.startedAt))
      .limit(limit),

    db
      .select()
      .from(errorLogs)
      .where(eq(errorLogs.userId, userId))
      .orderBy(desc(errorLogs.createdAt))
      .limit(limit),
  ]);

  const activities: (RecentActivityItem & { timestamp: Date })[] = [];

  for (const word of recentWords) {
    activities.push({
      action: 'Collected',
      item: word.word,
      context: word.source === 'deep_fog' ? 'from Deep Fog reading' : 'added manually',
      time: '',
      timestamp: word.createdAt,
    });
  }

  for (const session of recentSessions) {
    const typeLabel = session.sessionType === 'chaos_window' ? 'Chaos Window'
      : session.sessionType === 'deep_fog' ? 'Deep Fog'
      : session.sessionType === 'content' ? 'Content'
      : 'Mystery Shelf';
    const duration = session.durationSeconds
      ? `${Math.round(session.durationSeconds / 60)} min`
      : '';
    activities.push({
      action: 'Practiced',
      item: typeLabel,
      context: duration ? `${duration} session` : 'session started',
      time: '',
      timestamp: session.startedAt,
    });
  }

  for (const error of recentErrors) {
    activities.push({
      action: 'Logged error',
      item: error.context || error.errorType,
      context: `${error.errorType} in ${error.source === 'chaos_window' ? 'Chaos Window' : 'Content'}`,
      time: '',
      timestamp: error.createdAt,
    });
  }

  // Sort by timestamp descending
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Format relative time and take top N
  return activities.slice(0, limit).map(({ timestamp, ...rest }) => ({
    ...rest,
    time: formatRelativeTime(timestamp),
  }));
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
