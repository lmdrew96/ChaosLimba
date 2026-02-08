import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { mysteryItems } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';

// GET /api/deep-fog/stats - Count words collected from Deep Fog
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [result] = await db
      .select({ wordsCollected: count() })
      .from(mysteryItems)
      .where(
        and(
          eq(mysteryItems.userId, userId),
          eq(mysteryItems.source, 'deep_fog')
        )
      );

    return NextResponse.json({ wordsCollected: result?.wordsCollected ?? 0 });
  } catch (error) {
    console.error('Failed to fetch deep fog stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
