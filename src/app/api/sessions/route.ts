import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { sessions, NewSession, sessionTypeEnum } from '@/lib/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

// GET /api/sessions - Fetch user's sessions
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sessionType = searchParams.get('type') as (typeof sessionTypeEnum)[number] | null;

    const conditions = [eq(sessions.userId, userId)];

    if (sessionType && sessionTypeEnum.includes(sessionType)) {
      conditions.push(eq(sessions.sessionType, sessionType));
    }

    const userSessions = await db
      .select()
      .from(sessions)
      .where(conditions.length > 1
        ? and(...conditions)
        : conditions[0])
      .orderBy(desc(sessions.startedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ sessions: userSessions, count: userSessions.length });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Start a new session
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.sessionType) {
      return NextResponse.json(
        { error: 'Missing required field: sessionType' },
        { status: 400 }
      );
    }

    // Validate sessionType
    if (!sessionTypeEnum.includes(body.sessionType)) {
      return NextResponse.json(
        { error: `Invalid sessionType. Must be one of: ${sessionTypeEnum.join(', ')}` },
        { status: 400 }
      );
    }

    const newSession: NewSession = {
      userId,
      sessionType: body.sessionType,
      contentId: body.contentId || null,
    };

    const [session] = await db.insert(sessions).values(newSession).returning();

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Failed to start session:', error);
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    );
  }
}

// PATCH /api/sessions - End an active session
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400 }
      );
    }

    // Find the session and verify ownership
    const [existingSession] = await db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.id, body.sessionId),
        eq(sessions.userId, userId),
        isNull(sessions.endedAt)
      ));

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found or already ended' },
        { status: 404 }
      );
    }

    // Calculate duration
    const endedAt = new Date();
    let durationSeconds = body.durationSeconds;

    if (durationSeconds === undefined) {
      durationSeconds = Math.floor(
        (endedAt.getTime() - existingSession.startedAt.getTime()) / 1000
      );
    }

    // Update the session
    const [updatedSession] = await db
      .update(sessions)
      .set({
        endedAt,
        durationSeconds,
      })
      .where(eq(sessions.id, body.sessionId))
      .returning();

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Failed to end session:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}
