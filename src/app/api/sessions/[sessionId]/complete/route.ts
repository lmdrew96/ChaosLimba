import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { errorLogs, proficiencyHistory, sessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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

    // Verify session belongs to user
    const session = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .limit(1);

    if (!session || session.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = session[0];

    // Fetch all errors for this session
    const sessionErrors = await db
      .select()
      .from(errorLogs)
      .where(eq(errorLogs.sessionId, sessionId));

    console.log(`[Session Complete] Processing ${sessionErrors.length} errors for session ${sessionId}`);

    // Calculate component scores
    // Logic: Start at 10.0, deduct points based on errors
    // Minor errors: -0.2, Major errors: -0.5, Critical errors: -1.0
    // Minimum score: 1.0

    const calculateScore = (errors: typeof sessionErrors, errorType: string): number => {
      const relevantErrors = errors.filter(e => e.errorType === errorType);
      let score = 10.0;

      // Note: We don't have severity in error_logs yet, so treat all errors equally
      // For MVP, deduct 0.5 per error
      score -= relevantErrors.length * 0.5;

      return Math.max(1.0, Math.min(10.0, score));
    };

    // Calculate scores by component
    const grammarScore = calculateScore(sessionErrors, 'grammar');
    const pronunciationScore = calculateScore(sessionErrors, 'pronunciation');
    const vocabularyScore = calculateScore(sessionErrors, 'vocabulary');
    const wordOrderScore = calculateScore(sessionErrors, 'word_order');

    // Map to proficiency categories
    // Grammar → Writing score
    // Pronunciation → Speaking score
    // Vocabulary + Word Order → Reading score
    // Use session modality to inform listening vs speaking

    const writingScore = grammarScore;
    const speakingScore = pronunciationScore;
    const readingScore = (vocabularyScore + wordOrderScore) / 2;

    // Listening score: Default to 7.0 for chaos_window (passive comprehension assumed good if they responded)
    const listeningScore = sessionData.sessionType === 'chaos_window' ? 7.0 : null;

    // Overall score: weighted average
    const overallScore = (
      (writingScore * 0.3) +
      (speakingScore * 0.3) +
      (readingScore * 0.2) +
      ((listeningScore || 0) * 0.2)
    );

    // Insert proficiency record
    const proficiencyRecord = await db.insert(proficiencyHistory).values({
      userId,
      overallScore: overallScore.toFixed(1),
      listeningScore: listeningScore?.toFixed(1) || null,
      readingScore: readingScore.toFixed(1),
      speakingScore: speakingScore.toFixed(1),
      writingScore: writingScore.toFixed(1),
      period: 'daily',
    }).returning();

    console.log(`[Session Complete] Proficiency updated: Overall ${overallScore.toFixed(1)}`);

    return NextResponse.json({
      success: true,
      proficiency: {
        overall: overallScore.toFixed(1),
        listening: listeningScore?.toFixed(1),
        reading: readingScore.toFixed(1),
        speaking: speakingScore.toFixed(1),
        writing: writingScore.toFixed(1),
      },
      errorsProcessed: sessionErrors.length,
    });
  } catch (error) {
    console.error('[Session Complete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to complete session' },
      { status: 500 }
    );
  }
}
