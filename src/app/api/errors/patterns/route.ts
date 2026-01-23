import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { errorLogs } from '@/lib/db/schema';
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
  // New detailed fields
  trend: number[]; // last 5 weeks frequency (0-1)
  trendLabels: string[];
  examples: ErrorExample[];
  interlanguageRule: string; // mocked for now
  transferSource: string; // mocked for now
  intervention: string; // mocked for now
  theoreticalBasis: string; // mocked for now
  incorrectUsage: number;
  correctUsage: number;
};

// GET /api/errors/patterns - Get aggregated error patterns for Error Garden
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all error logs for this user to perform advanced aggregation
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

    // Group logs by errorType + category
    const groupedErrors: Record<string, typeof allLogs> = {};

    allLogs.forEach(log => {
      // Create a unique key for grouping
      const key = `${log.errorType}|${log.category || 'general'}`;
      if (!groupedErrors[key]) {
        groupedErrors[key] = [];
      }
      groupedErrors[key].push(log);
    });

    const patterns: ErrorPattern[] = Object.keys(groupedErrors).map((key, index) => {
      const logs = groupedErrors[key];
      const count = logs.length;
      const frequency = Math.round((count / totalErrors) * 100);
      const isFossilizing = frequency >= 70;

      const latestLog = logs[0];
      const errorType = latestLog.errorType;
      const category = latestLog.category || 'General';

      // Calculate Trend (mocked for now based on recent activity, 
      // but structured to accept real weekly aggregations later)
      // Logic: Random noise around the current frequency for realism if historical data missing
      const effectiveFrequency = count / totalErrors;
      const trend = Array(5).fill(0).map((_, i) => {
        // Mock some variation
        const variation = (Math.random() * 0.1) - 0.05;
        return Math.max(0, Math.min(1, effectiveFrequency + variation));
      });
      // Ensure the last point matches current reality closely
      trend[4] = effectiveFrequency;

      const trendLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];

      // Extract examples
      const examples: ErrorExample[] = logs.slice(0, 5).map(log => ({
        id: log.id,
        incorrect: log.context || 'Unknown context', // In real app, context might be full sentence, incorrect part needs extraction
        correct: log.correction,
        context: log.source === 'chaos_window' ? 'Chaos Window Practice' : 'Content Interaction',
        timestamp: log.createdAt.toISOString().split('T')[0],
      }));

      // Mock theoretical content based on error type
      // In full version, this comes from the AI analysis
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
        correctUsage: Math.round(count * (1.5 + Math.random())), // Mock correct usage (assuming ~60% error rate on this pattern)
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
