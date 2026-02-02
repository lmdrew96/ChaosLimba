/**
 * PATCH /api/generated-content/[id]
 * Mark generated content as listened
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatedContent } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { id } = await params;

  try {
    const [updated] = await db
      .update(generatedContent)
      .set({
        isListened: true,
        listenedAt: new Date(),
      })
      .where(
        and(
          eq(generatedContent.id, id),
          eq(generatedContent.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[generated-content/[id]]', error);
    return new NextResponse('Failed to update content', { status: 500 });
  }
}
