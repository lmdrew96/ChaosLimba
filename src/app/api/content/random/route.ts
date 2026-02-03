import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSmartContentForUser } from '@/lib/db/queries';
import type { CEFRLevelEnum } from '@/lib/db/schema';

// GET /api/content/random - Smart content selection for Chaos Window
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const excludeId = searchParams.get('excludeId') || undefined;

        // Get user's CEFR level
        const prefs = await db
            .select({ languageLevel: userPreferences.languageLevel })
            .from(userPreferences)
            .where(eq(userPreferences.userId, userId))
            .limit(1);

        const userLevel = (prefs[0]?.languageLevel || 'B1') as CEFRLevelEnum;

        // Smart content selection: weighted random biased toward unseen/weak features
        const result = await getSmartContentForUser(userId, userLevel, excludeId);

        if (!result) {
            return NextResponse.json(
                { error: 'No content available' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            content: result.content,
            userLevel,
            matchedLevel: true,
            // Smart Chaos metadata
            selectionReason: result.selectionReason,
            targetFeatures: result.targetFeatures.map(f => ({
                featureKey: f.featureKey,
                featureName: f.featureName,
                description: f.description,
            })),
            isFirstSession: result.isFirstSession,
        });
    } catch (error) {
        console.error('[Random Content] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch random content' },
            { status: 500 }
        );
    }
}
