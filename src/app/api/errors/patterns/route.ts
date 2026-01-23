import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { errorLogs } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

export type ErrorPattern = {
  errorType: string;
  category: string | null;
  count: number;
  frequency: number;
  recentContext: string | null;
  lastOccurred: Date;
  isFossilizing: boolean;
};

// GET /api/errors/patterns - Get aggregated error patterns for Error Garden
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total error count for frequency calculation
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(errorLogs)
      .where(eq(errorLogs.userId, userId));

    const totalErrors = totalResult?.count || 0;

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

    // Aggregate errors by type and category
    const rawPatterns = await db
      .select({
        errorType: errorLogs.errorType,
        category: errorLogs.category,
        count: sql<number>`count(*)::int`,
        recentContext: sql<string>`(array_agg(${errorLogs.context} ORDER BY ${errorLogs.createdAt} DESC))[1]`,
        lastOccurred: sql<Date>`max(${errorLogs.createdAt})`,
      })
      .from(errorLogs)
      .where(eq(errorLogs.userId, userId))
      .groupBy(errorLogs.errorType, errorLogs.category)
      .orderBy(desc(sql`count(*)`));

    // Calculate frequencies and fossilization risk
    const patterns: ErrorPattern[] = rawPatterns.map((p) => {
      const frequency = Math.round((p.count / totalErrors) * 100);
      return {
        errorType: p.errorType,
        category: p.category,
        count: p.count,
        frequency,
        recentContext: p.recentContext,
        lastOccurred: p.lastOccurred,
        isFossilizing: frequency >= 70, // 70% threshold for fossilization risk
      };
    });

    const fossilizingCount = patterns.filter((p) => p.isFossilizing).length;

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
