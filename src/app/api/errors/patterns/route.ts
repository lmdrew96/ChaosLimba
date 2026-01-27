import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { errorLogs, ErrorLog } from '@/lib/db/schema';
import { eq, sql, desc, and, gte } from 'drizzle-orm';

export type ErrorExample = {
  id: string;
  incorrect: string;
  correct: string | null;
  context: string | null;
  timestamp: string;
};

export type ErrorPattern = {
  id: string; // unique key for UI
  errorType: string;
  category: string;
  count: number;
  frequency: number; // 0-100
  recentContext: string | null;
  lastOccurred: Date;
  isFossilizing: boolean; // frequency >= 70%
  // Detailed fields
  trend: (number | null)[]; // last 5 weeks frequency (0-1), null = no data
  trendLabels: string[];
  examples: ErrorExample[];
  interlanguageRule: string;
  transferSource: string;
  intervention: string;
  theoreticalBasis: string;
  incorrectUsage: number;
  correctUsage: number;
};

/**
 * Normalize context string for similarity clustering.
 * This creates a "fingerprint" that groups similar errors together.
 * 
 * Future upgrade: Replace with embedding model + cosine similarity for ML clustering.
 */
function normalizeContext(context: string): string {
  if (!context) return '';

  // Normalize: lowercase, remove punctuation, take first 40 chars
  return context
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .slice(0, 40);
}

/**
 * Calculate Levenshtein distance between two strings.
 * Used for fuzzy matching similar error contexts.
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Find a similar existing cluster key or return null.
 * Uses Levenshtein distance with a similarity threshold.
 * 
 * Future upgrade: Replace with cosine similarity on embeddings.
 */
function findSimilarCluster(
  clusters: Record<string, any[]>,
  newKey: string,
  threshold: number = 0.3 // 30% character difference allowed
): string | null {
  const [newType, newCategory, newFingerprint] = newKey.split('|');

  for (const existingKey of Object.keys(clusters)) {
    const [existingType, existingCategory, existingFingerprint] = existingKey.split('|');

    // Must match on type and category
    if (newType !== existingType || newCategory !== existingCategory) {
      continue;
    }

    // Check fingerprint similarity
    if (!existingFingerprint || !newFingerprint) continue;

    const maxLen = Math.max(existingFingerprint.length, newFingerprint.length);
    if (maxLen === 0) continue;

    const distance = levenshteinDistance(existingFingerprint, newFingerprint);
    const similarity = 1 - (distance / maxLen);

    if (similarity >= (1 - threshold)) {
      return existingKey;
    }
  }

  return null;
}

/**
 * Cluster errors by type + category + context similarity.
 * This groups similar errors together for pattern detection.
 */
function clusterErrors(errors: typeof errorLogs.$inferSelect[]): Record<string, typeof errors> {
  const clusters: Record<string, typeof errors> = {};

  errors.forEach(error => {
    const contextFingerprint = normalizeContext(error.context || '');
    const key = `${error.errorType}|${error.category || 'general'}|${contextFingerprint}`;

    // Check if a similar cluster already exists
    const existingKey = findSimilarCluster(clusters, key);

    if (existingKey) {
      clusters[existingKey].push(error);
    } else {
      clusters[key] = [error];
    }
  });

  return clusters;
}

/**
 * Get the start of a week for a given date (Monday-based).
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate real weekly trend from historical error data.
 * Returns frequency values for the last 5 weeks.
 */
function calculateWeeklyTrend(
  patternLogs: typeof errorLogs.$inferSelect[],
  allLogs: typeof errorLogs.$inferSelect[]
): { trend: (number | null)[]; labels: string[] } {
  const now = new Date();
  const weeks: { start: Date; label: string }[] = [];

  // Generate last 5 weeks
  for (let i = 4; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    weeks.push({
      start: weekStart,
      label: i === 0 ? 'This week' : i === 1 ? 'Last week' : `${i} weeks ago`
    });
  }

  // Count errors per week
  const trend: (number | null)[] = weeks.map(({ start }) => {
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Count pattern errors in this week
    const patternCount = patternLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      return logDate >= start && logDate < weekEnd;
    }).length;

    // Count total errors in this week
    const totalCount = allLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      return logDate >= start && logDate < weekEnd;
    }).length;

    // Return frequency or null if no data
    if (totalCount === 0) return null;
    return patternCount / totalCount;
  });

  const labels = weeks.map(w => w.label);

  return { trend, labels };
}

// GET /api/errors/patterns - Get aggregated error patterns for Error Garden
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all error logs for this user
    // Note: For MVP with limited data, fetching all logs is acceptable.
    // For scale, we would move this to a dedicated aggregation table or materialized view.
    const allLogs = await db
      .select()
      .from(errorLogs)
      .where(eq(errorLogs.userId, userId))
      .orderBy(desc(errorLogs.createdAt));

    const totalErrors = allLogs.length;

    if (totalErrors === 0) {
      return NextResponse.json({
        patterns: [],
        stats: {
          totalErrors: 0,
          patternCount: 0,
          fossilizingCount: 0,
        },
      });
    }

    // Cluster errors using text similarity (upgradeable to ML clustering)
    const clusteredErrors = clusterErrors(allLogs);

    const patterns: ErrorPattern[] = Object.keys(clusteredErrors).map((key, index) => {
      const logs = clusteredErrors[key];
      const count = logs.length;
      const frequency = Math.round((count / totalErrors) * 100);
      const isFossilizing = frequency >= 70;

      const latestLog = logs[0];
      const errorType = latestLog.errorType;
      const category = latestLog.category || 'General';

      // Calculate real weekly trend
      const { trend, labels: trendLabels } = calculateWeeklyTrend(logs, allLogs);

      // Extract examples
      const examples: ErrorExample[] = logs.slice(0, 5).map(log => ({
        id: log.id,
        incorrect: log.context || 'Unknown context',
        correct: log.correction,
        context: log.source === 'chaos_window' ? 'Chaos Window Practice' : 'Content Interaction',
        timestamp: log.createdAt.toISOString().split('T')[0],
      }));

      // Generate theoretical content based on error type
      // In full version, this would come from AI analysis
      let interlanguageRule = 'Systematic deviation in target structure';
      let transferSource = 'L1 Interference';
      let intervention = 'Focused practice recommended';
      let theoreticalBasis = 'Interlanguage Theory (Selinker, 1972)';

      if (errorType === 'grammar') {
        interlanguageRule = 'Overgeneralization of morphological rules';
        intervention = 'Input flood with correct forms';
      } else if (errorType === 'pronunciation') {
        interlanguageRule = 'Phonemic substitution';
        transferSource = 'L1 Phonology';
        intervention = 'Minimal pair discrimination';
      } else if (errorType === 'vocabulary') {
        interlanguageRule = 'Semantic overgeneralization';
        transferSource = 'L1 Lexical Transfer';
        intervention = 'Contextual vocabulary practice';
      } else if (errorType === 'word_order') {
        interlanguageRule = 'Syntax mapping from L1';
        theoreticalBasis = 'Processability Theory (Pienemann)';
        intervention = 'Scrambled sentence reconstruction';
      }

      return {
        id: `pattern-${index}`,
        errorType,
        category,
        count,
        frequency,
        recentContext: latestLog.context,
        lastOccurred: latestLog.createdAt,
        isFossilizing,
        trend,
        trendLabels,
        examples,
        interlanguageRule,
        transferSource,
        intervention,
        theoreticalBasis,
        incorrectUsage: count,
        // Estimate correct usage based on session data (would be more accurate with tracked successes)
        correctUsage: Math.max(1, Math.round(count * (1 / (frequency / 100) - 1))),
      };
    });

    const fossilizingCount = patterns.filter((p) => p.isFossilizing).length;

    // Sort by frequency by default
    patterns.sort((a, b) => b.frequency - a.frequency);

    return NextResponse.json({
      patterns,
      stats: {
        totalErrors,
        patternCount: patterns.length,
        fossilizingCount,
      },
    });
  } catch (error) {
    console.error('Failed to fetch error patterns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error patterns' },
      { status: 500 }
    );
  }
}
