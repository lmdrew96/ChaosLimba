import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getActiveReadingQuestions } from '@/lib/db/queries';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const questions = await getActiveReadingQuestions();

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('[API] Failed to fetch reading questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reading questions' },
      { status: 500 }
    );
  }
}
