import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { proficiencyHistory } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/proficiency/history
 * Returns proficiency timeline for graphs
 * 
 * Query params:
 * - period: 'daily' | 'weekly' | 'monthly' (default: 'weekly')
 * - limit: number of records to return (default: 12)
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get('limit') || '12', 10);

        // Fetch history from database
        const history = await db.select()
            .from(proficiencyHistory)
            .where(eq(proficiencyHistory.userId, userId))
            .orderBy(desc(proficiencyHistory.recordedAt))
            .limit(limit);

        // Return in chronological order (oldest first) for chart display
        const chronologicalHistory = history.reverse().map(record => ({
            date: record.recordedAt,
            overall: parseFloat(record.overallScore),
            listening: record.listeningScore ? parseFloat(record.listeningScore) : null,
            reading: record.readingScore ? parseFloat(record.readingScore) : null,
            speaking: record.speakingScore ? parseFloat(record.speakingScore) : null,
            writing: record.writingScore ? parseFloat(record.writingScore) : null,
        }));

        return NextResponse.json({
            history: chronologicalHistory,
            hasData: chronologicalHistory.length > 0,
        });
    } catch (error) {
        console.error('Failed to fetch proficiency history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch proficiency history' },
            { status: 500 }
        );
    }
}
