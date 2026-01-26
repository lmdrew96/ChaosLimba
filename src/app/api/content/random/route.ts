import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { contentItems, userPreferences } from '@/lib/db/schema';
import { and, gte, lte, sql, eq } from 'drizzle-orm';

// CEFR level to difficulty mapping
const cefrToDifficulty: Record<string, { min: number; max: number }> = {
    'A1': { min: 1.0, max: 2.5 },
    'A2': { min: 2.0, max: 4.0 },
    'B1': { min: 3.5, max: 5.5 },
    'B2': { min: 5.0, max: 7.0 },
    'C1': { min: 6.5, max: 8.5 },
    'C2': { min: 8.0, max: 10.0 },
};

// GET /api/content/random - Get a random content item for Chaos Window
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const excludeId = searchParams.get('excludeId'); // Exclude current content
        const type = searchParams.get('type'); // Optional: filter by type

        // Get user's CEFR level
        const prefs = await db
            .select({ languageLevel: userPreferences.languageLevel })
            .from(userPreferences)
            .where(eq(userPreferences.userId, userId))
            .limit(1);

        const userLevel = prefs[0]?.languageLevel || 'B1'; // Default to B1
        const difficulty = cefrToDifficulty[userLevel] || cefrToDifficulty['B1'];

        // Build query conditions
        const conditions = [
            gte(contentItems.difficultyLevel, difficulty.min.toString()),
            lte(contentItems.difficultyLevel, difficulty.max.toString()),
        ];

        if (excludeId) {
            conditions.push(sql`${contentItems.id} != ${excludeId}`);
        }

        if (type && ['video', 'audio', 'text'].includes(type)) {
            conditions.push(eq(contentItems.type, type as 'video' | 'audio' | 'text'));
        }

        // Get random content using SQL RANDOM()
        const items = await db
            .select()
            .from(contentItems)
            .where(and(...conditions))
            .orderBy(sql`RANDOM()`)
            .limit(1);

        if (items.length === 0) {
            // Fallback: get any random content if none at user's level
            const fallbackItems = await db
                .select()
                .from(contentItems)
                .where(excludeId ? sql`${contentItems.id} != ${excludeId}` : undefined)
                .orderBy(sql`RANDOM()`)
                .limit(1);

            if (fallbackItems.length === 0) {
                return NextResponse.json(
                    { error: 'No content available' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                content: fallbackItems[0],
                userLevel,
                matchedLevel: false,
            });
        }

        return NextResponse.json({
            content: items[0],
            userLevel,
            matchedLevel: true,
        });
    } catch (error) {
        console.error('[Random Content] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch random content' },
            { status: 500 }
        );
    }
}
