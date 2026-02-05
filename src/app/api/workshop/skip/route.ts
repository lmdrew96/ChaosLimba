import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getWorkshopFeatureTarget } from '@/lib/db/queries';
import { generateWorkshopChallenge } from '@/lib/ai/workshop';
import type { WorkshopChallengeType } from '@/lib/ai/workshop';
import { trackFeatureExposure } from '@/lib/ai/exposure-tracker';
import type { CEFRLevelEnum } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, featureKey, recentTypes } = body as {
      sessionId: string;
      featureKey: string;
      recentTypes?: string[];
    };

    if (!sessionId || !featureKey) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, featureKey' },
        { status: 400 }
      );
    }

    // Log skip as encountered exposure (no guilt — they saw the feature)
    trackFeatureExposure({
      userId,
      sessionId,
      contentFeatures: [featureKey],
      producedFeatures: [],
      correctedFeatures: [],
    }).catch(() => {});

    // Get user level and fetch next challenge
    const prefs = await db
      .select({ languageLevel: userPreferences.languageLevel })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    const userLevel = (prefs[0]?.languageLevel || 'A1') as CEFRLevelEnum;

    let nextChallenge = null;
    const target = await getWorkshopFeatureTarget(userId, userLevel);
    if (target) {
      nextChallenge = await generateWorkshopChallenge(
        target.feature,
        userLevel,
        undefined,
        target.destabilizationTier,
        recentTypes as WorkshopChallengeType[] | undefined
      );
    }

    return NextResponse.json({ nextChallenge });
  } catch (error) {
    console.error('[Workshop Skip API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to skip and fetch next challenge' },
      { status: 500 }
    );
  }
}
