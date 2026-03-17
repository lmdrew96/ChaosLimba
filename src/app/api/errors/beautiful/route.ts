import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { beautifulMistakes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/errors/beautiful - Fetch user's beautiful mistakes
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const mistakes = await db
      .select()
      .from(beautifulMistakes)
      .where(eq(beautifulMistakes.userId, userId))
      .orderBy(desc(beautifulMistakes.createdAt))
      .limit(limit);

    return NextResponse.json({ mistakes, count: mistakes.length });
  } catch (error) {
    console.error('Failed to fetch beautiful mistakes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beautiful mistakes' },
      { status: 500 }
    );
  }
}
