import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { contentItems, NewContentItem, contentTypeEnum } from '@/lib/db/schema';
import { and, gte, lte, eq, desc } from 'drizzle-orm';

// GET /api/content - List content with optional filters
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as (typeof contentTypeEnum)[number] | null;
    const minDifficulty = searchParams.get('minDifficulty');
    const maxDifficulty = searchParams.get('maxDifficulty');
    const topic = searchParams.get('topic');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build conditions array
    const conditions = [];

    if (type && contentTypeEnum.includes(type)) {
      conditions.push(eq(contentItems.type, type));
    }
    if (minDifficulty) {
      conditions.push(gte(contentItems.difficultyLevel, minDifficulty));
    }
    if (maxDifficulty) {
      conditions.push(lte(contentItems.difficultyLevel, maxDifficulty));
    }
    if (topic) {
      conditions.push(eq(contentItems.topic, topic));
    }

    const items = await db
      .select()
      .from(contentItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(contentItems.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    console.error('Failed to fetch content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// POST /api/content - Create new content item
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: NewContentItem = await req.json();

    // Validate required fields
    if (!body.type || !body.title || !body.difficultyLevel || !body.topic || !body.sourceAttribution) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, difficultyLevel, topic, sourceAttribution' },
        { status: 400 }
      );
    }

    // Validate type
    if (!contentTypeEnum.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${contentTypeEnum.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate difficulty level
    const difficulty = parseFloat(body.difficultyLevel as string);
    if (isNaN(difficulty) || difficulty < 1.0 || difficulty > 10.0) {
      return NextResponse.json(
        { error: 'difficultyLevel must be between 1.0 and 10.0' },
        { status: 400 }
      );
    }

    // Type-specific validation
    if (body.type === 'video' && !body.youtubeId) {
      return NextResponse.json(
        { error: 'Video content requires youtubeId' },
        { status: 400 }
      );
    }
    if (body.type === 'audio' && !body.audioUrl) {
      return NextResponse.json(
        { error: 'Audio content requires audioUrl' },
        { status: 400 }
      );
    }
    if (body.type === 'text' && !body.textContent && !body.textUrl) {
      return NextResponse.json(
        { error: 'Text content requires either textContent or textUrl' },
        { status: 400 }
      );
    }

    const [newItem] = await db.insert(contentItems).values(body).returning();

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error('Failed to create content:', error);
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }
}
