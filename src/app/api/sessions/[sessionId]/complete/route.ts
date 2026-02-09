import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { recordSessionProficiency } from '@/lib/proficiency';

/**
 * POST /api/sessions/[sessionId]/complete
 * Calculates proficiency updates based on session performance and logs to proficiency_history
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    const proficiency = await recordSessionProficiency(userId, sessionId);

    return NextResponse.json({
      success: true,
      proficiency: {
        overall: proficiency.overall,
        listening: proficiency.listening,
        reading: proficiency.reading,
        speaking: proficiency.speaking,
        writing: proficiency.writing,
      },
      errorsProcessed: proficiency.errorsProcessed,
    });
  } catch (error) {
    console.error('[Session Complete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to complete session' },
      { status: 500 }
    );
  }
}
