import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSuggestedWordsWithPairs } from '@/lib/db/queries';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await getSuggestedWordsWithPairs();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch suggested words:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggested words' },
      { status: 500 }
    );
  }
}
