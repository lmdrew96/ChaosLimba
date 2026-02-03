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
  grammarFeatureMap,
  userFeatureExposure,
  contentItems,
  type CEFRLevelEnum,
  type ContentItem,
  type GrammarFeature,
} from './schema';
import { ExtractedErrorPattern } from '@/types/aggregator';
import { eq, and, asc, desc, gte, lte, sql, count as drizzleCount, inArray } from 'drizzle-orm';

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

    // Map patterns to NewErrorLog format, filtering duplicates and non-errors
    const newErrors: NewErrorLog[] = patterns
      .filter(pattern => {
        // Only save actual errors, not suggestions/style recommendations
        if (pattern.feedbackType === 'suggestion') {
          console.log(`[saveErrorPatternsToGarden] Skipping suggestion (not an error): ${pattern.learnerProduction}`);
          return false;
        }

        // Skip false positives where the "correction" says the original was correct
        if (pattern.correctForm && /actually correct|is correct|not an error|no error/i.test(pattern.correctForm)) {
          console.log(`[saveErrorPatternsToGarden] Skipping false positive: "${pattern.correctForm}"`);
          return false;
        }

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

    // Bulk insert (neon-http driver does not support transactions)
    const insertedErrors = await db
      .insert(errorLogs)
      .values(newErrors)
      .returning();

    console.log(`[saveErrorPatternsToGarden] Inserted ${insertedErrors.length} error patterns to Error Garden`);

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
      : session.sessionType === 'workshop' ? 'Workshop'
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

// ─── Smart Chaos: Feature Exposure & Content Selection ───

export interface FeatureExposureSummary {
  encountered: Set<string>;
  produced: Set<string>;
  corrected: Set<string>;
  totalExposures: number;
}

/**
 * Get a summary of which grammar/vocab features a user has been exposed to.
 */
export async function getUserFeatureExposureSummary(userId: string): Promise<FeatureExposureSummary> {
  const rows = await db
    .select({
      featureKey: userFeatureExposure.featureKey,
      exposureType: userFeatureExposure.exposureType,
    })
    .from(userFeatureExposure)
    .where(eq(userFeatureExposure.userId, userId));

  const encountered = new Set<string>();
  const produced = new Set<string>();
  const corrected = new Set<string>();

  for (const row of rows) {
    if (row.exposureType === 'encountered') encountered.add(row.featureKey);
    else if (row.exposureType === 'produced') produced.add(row.featureKey);
    else if (row.exposureType === 'corrected') corrected.add(row.featureKey);
  }

  return { encountered, produced, corrected, totalExposures: rows.length };
}

/**
 * Get grammar features for a given CEFR level.
 */
export async function getFeaturesForLevel(cefrLevel: CEFRLevelEnum): Promise<GrammarFeature[]> {
  return db
    .select()
    .from(grammarFeatureMap)
    .where(eq(grammarFeatureMap.cefrLevel, cefrLevel))
    .orderBy(asc(grammarFeatureMap.sortOrder));
}

/**
 * Map an Error Garden error category to a grammar feature key.
 * Returns null if no mapping exists.
 */
export function mapErrorCategoryToFeatureKey(errorType: ErrorType, category: string | null): string | null {
  if (!category) return null;

  // Direct mapping: many error categories already match feature keys
  const directMappings: Record<string, string> = {
    'verb_conjugation': 'present_tense_regular_group1',
    'definite_article': 'definite_article',
    'indefinite_article': 'indefinite_article',
    'gender_agreement': 'gender_agreement',
    'negation': 'basic_negation',
    'preposition': 'basic_prepositions',
    'past_tense': 'past_tense_perfect_compus',
    'reflexive': 'reflexive_verbs',
    'accusative': 'accusative_pronouns',
    'dative': 'dative_pronouns',
    'comparative': 'comparative_adjectives',
    'future': 'future_informal_o_sa',
    'imperative': 'imperative_basic',
    'possession': 'possession_al_a',
    'plural': 'plural_nouns',
    'word_order': 'basic_questions',
  };

  // Try direct match first
  const normalized = category.toLowerCase().replace(/\s+/g, '_');
  if (directMappings[normalized]) return directMappings[normalized];

  // Try partial match
  for (const [key, featureKey] of Object.entries(directMappings)) {
    if (normalized.includes(key)) return featureKey;
  }

  return null;
}

// CEFR level to difficulty range mapping (shared with /api/content/random)
const cefrToDifficulty: Record<string, { min: number; max: number }> = {
  'A1': { min: 1.0, max: 2.5 },
  'A2': { min: 2.0, max: 4.0 },
  'B1': { min: 3.5, max: 5.5 },
  'B2': { min: 5.0, max: 7.0 },
  'C1': { min: 6.5, max: 8.5 },
  'C2': { min: 8.0, max: 10.0 },
};

export type SelectionReason = 'unseen_feature' | 'weak_feature' | 'random';

export interface SmartContentResult {
  content: ContentItem;
  selectionReason: SelectionReason;
  targetFeatures: GrammarFeature[];
  isFirstSession: boolean;
}

/**
 * Smart content selection: replaces pure random with weighted selection.
 *
 * Algorithm:
 * 1. Get user's feature exposure and error patterns
 * 2. Roll weighted random: 50% unseen features, 30% weak features, 20% pure random
 * 3. Query content tagged with target features at user's CEFR level
 * 4. Fallback to pure random if no tagged content matches
 */
export async function getSmartContentForUser(
  userId: string,
  userLevel: CEFRLevelEnum,
  excludeId?: string
): Promise<SmartContentResult | null> {
  const difficulty = cefrToDifficulty[userLevel] || cefrToDifficulty['B1'];

  // Parallel: get exposure summary, level features, and error patterns
  const [exposure, levelFeatures, errorPatterns] = await Promise.all([
    getUserFeatureExposureSummary(userId),
    getFeaturesForLevel(userLevel),
    getUserErrorPatternsForContent(userId, 5),
  ]);

  const isFirstSession = exposure.totalExposures === 0;

  // Identify unseen features (never encountered)
  const unseenFeatures = levelFeatures.filter(f => !exposure.encountered.has(f.featureKey));

  // Identify weak features (from Error Garden)
  const weakFeatureKeys = new Set<string>();
  for (const pattern of errorPatterns) {
    const featureKey = mapErrorCategoryToFeatureKey(
      pattern.errorType as ErrorType,
      pattern.category
    );
    if (featureKey) weakFeatureKeys.add(featureKey);
  }
  const weakFeatures = levelFeatures.filter(f => weakFeatureKeys.has(f.featureKey));

  // Weighted random roll: 50% unseen, 30% weak, 20% pure random
  const roll = Math.random();
  let targetFeatures: GrammarFeature[] = [];
  let selectionReason: SelectionReason = 'random';

  if (roll < 0.5 && unseenFeatures.length > 0) {
    // Target unseen features
    selectionReason = 'unseen_feature';
    // For first session A1: prioritize foundational features
    if (isFirstSession && userLevel === 'A1') {
      const foundational = unseenFeatures.filter(f =>
        ['present_tense_a_fi', 'basic_questions', 'vocab_greetings'].includes(f.featureKey)
      );
      targetFeatures = foundational.length > 0 ? foundational : unseenFeatures.slice(0, 3);
    } else {
      // Pick 1-3 random unseen features, respecting rough sort order
      const shuffled = [...unseenFeatures].sort(() => Math.random() - 0.5);
      targetFeatures = shuffled.slice(0, Math.min(3, shuffled.length));
    }
  } else if (roll < 0.8 && weakFeatures.length > 0) {
    // Target weak features from Error Garden
    selectionReason = 'weak_feature';
    targetFeatures = weakFeatures.slice(0, 3);
  }
  // else: pure random (20% or fallback when no unseen/weak features)

  // Try to find content matching target features
  if (targetFeatures.length > 0) {
    const targetKeys = targetFeatures.map(f => f.featureKey);
    const content = await findContentByFeatures(targetKeys, difficulty, excludeId);
    if (content) {
      return { content, selectionReason, targetFeatures, isFirstSession };
    }
    // Fall through to random if no tagged content matches
  }

  // Pure random fallback (same as original behavior)
  const content = await getRandomContent(difficulty, excludeId);
  if (!content) return null;

  // Even for random selection, determine what features the content contains
  const contentFeatureKeys = (content.languageFeatures as { grammar?: string[] })?.grammar || [];
  const contentFeatures = levelFeatures.filter(f => contentFeatureKeys.includes(f.featureKey));

  return {
    content,
    selectionReason: 'random',
    targetFeatures: contentFeatures,
    isFirstSession,
  };
}

/**
 * Find content tagged with specific grammar feature keys.
 * Uses JSONB containment to check if content's languageFeatures.grammar array
 * overlaps with the target feature keys.
 */
async function findContentByFeatures(
  featureKeys: string[],
  difficulty: { min: number; max: number },
  excludeId?: string
): Promise<ContentItem | null> {
  // Build a condition that checks if ANY of the feature keys are in the grammar array
  // Using jsonb @> operator for each key with OR
  const featureConditions = featureKeys.map(key =>
    sql`${contentItems.languageFeatures}->'grammar' @> ${JSON.stringify([key])}::jsonb`
  );

  const conditions = [
    gte(contentItems.difficultyLevel, difficulty.min.toString()),
    lte(contentItems.difficultyLevel, difficulty.max.toString()),
    sql`(${sql.join(featureConditions, sql` OR `)})`,
  ];

  if (excludeId) {
    conditions.push(sql`${contentItems.id} != ${excludeId}`);
  }

  const items = await db
    .select()
    .from(contentItems)
    .where(and(...conditions))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  return items[0] || null;
}

/**
 * Get a random content item within a difficulty range (original behavior).
 */
async function getRandomContent(
  difficulty: { min: number; max: number },
  excludeId?: string
): Promise<ContentItem | null> {
  const conditions = [
    gte(contentItems.difficultyLevel, difficulty.min.toString()),
    lte(contentItems.difficultyLevel, difficulty.max.toString()),
  ];

  if (excludeId) {
    conditions.push(sql`${contentItems.id} != ${excludeId}`);
  }

  let items = await db
    .select()
    .from(contentItems)
    .where(and(...conditions))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  // Fallback: any content
  if (items.length === 0) {
    items = await db
      .select()
      .from(contentItems)
      .where(excludeId ? sql`${contentItems.id} != ${excludeId}` : undefined)
      .orderBy(sql`RANDOM()`)
      .limit(1);
  }

  return items[0] || null;
}

/**
 * Get the count of distinct features a user has encountered.
 */
export async function getFeaturesDiscoveredCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(distinct ${userFeatureExposure.featureKey})::int` })
    .from(userFeatureExposure)
    .where(
      and(
        eq(userFeatureExposure.userId, userId),
        eq(userFeatureExposure.exposureType, 'encountered')
      )
    );

  return result[0]?.count ?? 0;
}

// ─── Workshop: Feature Target Selection ───

export type WorkshopSelectionReason = 'noticing_gap' | 'error_reinforcement' | 'level_random';

export interface WorkshopFeatureTarget {
  feature: GrammarFeature;
  selectionReason: WorkshopSelectionReason;
}

/**
 * Select the next grammar/vocab feature to challenge the user on in Workshop.
 *
 * Weighted selection:
 * - 50%: Features `encountered` but never `produced` (noticing gap)
 * - 30%: Features the user has been `corrected` on or from Error Garden
 * - 20%: Random feature at the user's CEFR level
 */
export async function getWorkshopFeatureTarget(
  userId: string,
  userLevel: CEFRLevelEnum
): Promise<WorkshopFeatureTarget | null> {
  const [exposure, levelFeatures, errorPatterns] = await Promise.all([
    getUserFeatureExposureSummary(userId),
    getFeaturesForLevel(userLevel),
    getUserErrorPatternsForContent(userId, 10),
  ]);

  if (levelFeatures.length === 0) return null;

  // Noticing gap: encountered but never produced
  const noticingGapFeatures = levelFeatures.filter(
    f => exposure.encountered.has(f.featureKey) && !exposure.produced.has(f.featureKey)
  );

  // Error reinforcement: corrected or mapped from Error Garden patterns
  const errorFeatureKeys = new Set<string>();
  for (const featureKey of exposure.corrected) {
    errorFeatureKeys.add(featureKey);
  }
  for (const pattern of errorPatterns) {
    const featureKey = mapErrorCategoryToFeatureKey(
      pattern.errorType as ErrorType,
      pattern.category
    );
    if (featureKey) errorFeatureKeys.add(featureKey);
  }
  const errorFeatures = levelFeatures.filter(f => errorFeatureKeys.has(f.featureKey));

  // Weighted random roll
  const roll = Math.random();
  let selected: GrammarFeature | null = null;
  let reason: WorkshopSelectionReason = 'level_random';

  if (roll < 0.5 && noticingGapFeatures.length > 0) {
    // 50%: noticing gap
    selected = noticingGapFeatures[Math.floor(Math.random() * noticingGapFeatures.length)];
    reason = 'noticing_gap';
  } else if (roll < 0.8 && errorFeatures.length > 0) {
    // 30%: error reinforcement
    selected = errorFeatures[Math.floor(Math.random() * errorFeatures.length)];
    reason = 'error_reinforcement';
  } else {
    // 20%: random from level (or fallback)
    const pool = levelFeatures.length > 0 ? levelFeatures : [];
    if (pool.length > 0) {
      selected = pool[Math.floor(Math.random() * pool.length)];
      reason = 'level_random';
    }
  }

  // Fallback if weighted roll hit an empty bucket
  if (!selected) {
    selected = levelFeatures[Math.floor(Math.random() * levelFeatures.length)];
    reason = 'level_random';
  }

  return { feature: selected, selectionReason: reason };
}
