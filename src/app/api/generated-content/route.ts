/**
 * GET /api/generated-content
 * List user's personalized generated audio content
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatedContent, generatedContentTypeEnum } from '@/lib/db/schema';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import type { GeneratedContentType } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const limitParam = parseInt(searchParams.get('limit') ?? '10');
  const offsetParam = parseInt(searchParams.get('offset') ?? '0');
  const contentTypeFilter = searchParams.get('contentType');
  const limit = Math.min(Math.max(1, limitParam), 50);
  const offset = Math.max(0, offsetParam);

  try {
    const now = new Date();

    // Build where conditions
    const conditions = [
      eq(generatedContent.userId, userId),
      sql`${generatedContent.audioUrl} IS NOT NULL`,
      sql`(${generatedContent.expiresAt} IS NULL OR ${generatedContent.expiresAt} > ${now})`,
    ];

    if (contentTypeFilter && generatedContentTypeEnum.includes(contentTypeFilter as GeneratedContentType)) {
      conditions.push(eq(generatedContent.contentType, contentTypeFilter as GeneratedContentType));
    }

    const whereClause = and(...conditions);

    // Fetch items + total count
    const [items, [{ total }]] = await Promise.all([
      db
        .select()
        .from(generatedContent)
        .where(whereClause)
        .orderBy(desc(generatedContent.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(generatedContent)
        .where(whereClause),
    ]);

    return NextResponse.json({
      items,
      total: Number(total),
      hasMore: offset + limit < Number(total),
    });
  } catch (error) {
    console.error('[generated-content]', error);
    return new NextResponse('Failed to fetch generated content', { status: 500 });
  }
}
