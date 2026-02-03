import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { sessions, userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getWorkshopFeatureTarget } from '@/lib/db/queries';
import { generateWorkshopChallenge } from '@/lib/ai/workshop';
import type { CEFRLevelEnum } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId: existingSessionId } = body;

    // Get user's CEFR level
    const prefs = await db
      .select({ languageLevel: userPreferences.languageLevel })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    const userLevel = (prefs[0]?.languageLevel || 'A1') as CEFRLevelEnum;

    // Select target feature
    const target = await getWorkshopFeatureTarget(userId, userLevel);
    if (!target) {
      return NextResponse.json(
        { error: 'No features available for your level. Try updating your CEFR level.' },
        { status: 404 }
      );
    }

    // Generate challenge
    const challenge = await generateWorkshopChallenge(target.feature, userLevel);

    // Create session if none provided
    let sessionId = existingSessionId;
    if (!sessionId) {
      const [session] = await db
        .insert(sessions)
        .values({
          userId,
          sessionType: 'workshop',
        })
        .returning();
      sessionId = session.id;
    }

    return NextResponse.json({
      challenge,
      sessionId,
      selectionReason: target.selectionReason,
      feature: {
        key: target.feature.featureKey,
        name: target.feature.featureName,
        category: target.feature.category,
        level: target.feature.cefrLevel,
      },
    });
  } catch (error) {
    console.error('[Workshop Challenge API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate workshop challenge' },
      { status: 500 }
    );
  }
}
