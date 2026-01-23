import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/content/[id] - Get single content item
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid content ID format' },
        { status: 400 }
      );
    }

    const [item] = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.id, id))
      .limit(1);

    if (!item) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Failed to fetch content item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content item' },
      { status: 500 }
    );
  }
}
