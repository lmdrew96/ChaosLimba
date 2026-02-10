import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { errorLogs, NewErrorLog, errorTypeEnum, errorSourceEnum, modalityEnum } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/errors - Fetch user's errors
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const errorType = searchParams.get('type') as (typeof errorTypeEnum)[number] | null;

    const conditions = [eq(errorLogs.userId, userId)];

    if (errorType && errorTypeEnum.includes(errorType)) {
      conditions.push(eq(errorLogs.errorType, errorType));
    }

    const errors = await db
      .select()
      .from(errorLogs)
      .where(conditions.length > 1
        ? conditions.reduce((acc, cond) => acc && cond)
        : conditions[0])
      .orderBy(desc(errorLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ errors, count: errors.length });
  } catch (error) {
    console.error('Failed to fetch errors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch errors' },
      { status: 500 }
    );
  }
}

// POST /api/errors - Log a new error
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.errorType || !body.source) {
      return NextResponse.json(
        { error: 'Missing required fields: errorType, source' },
        { status: 400 }
      );
    }

    // Validate errorType
    if (!errorTypeEnum.includes(body.errorType)) {
      return NextResponse.json(
        { error: `Invalid errorType. Must be one of: ${errorTypeEnum.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate source
    if (!errorSourceEnum.includes(body.source)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${errorSourceEnum.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate modality if provided
    const modality = body.modality && modalityEnum.includes(body.modality) ? body.modality : 'text';

    const newError: NewErrorLog = {
      userId,
      errorType: body.errorType,
      category: body.category || null,
      context: body.context || null,
      correction: body.correction || null,
      source: body.source,
      modality,
      contentId: body.contentId || null,
      sessionId: body.sessionId || null,
    };

    const [error] = await db.insert(errorLogs).values(newError).returning();

    return NextResponse.json({ error }, { status: 201 });
  } catch (error) {
    console.error('Failed to log error:', error);
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}
