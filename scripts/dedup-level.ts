/**
 * Generic dedup script — works on any difficulty level
 * Usage: npx tsx scripts/dedup-level.ts 2.5
 *        npx tsx scripts/dedup-level.ts 2.5 --dry-run
 */
import { db } from '@/lib/db';
import { contentItems, errorLogs, sessions, userFeatureExposure } from '@/lib/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const level = process.argv[2];
const DRY_RUN = process.argv.includes('--dry-run');

if (!level) {
  console.error('Usage: npx tsx scripts/dedup-level.ts <difficulty> [--dry-run]');
  process.exit(1);
}

async function dedup() {
  console.log(DRY_RUN ? `🔍 DRY RUN for level ${level}\n` : `🗑️  LIVE RUN for level ${level}\n`);

  const items = await db.select({
    id: contentItems.id,
    title: contentItems.title,
    topic: contentItems.topic,
    textContent: contentItems.textContent,
    transcript: contentItems.transcript,
  }).from(contentItems).where(eq(contentItems.difficultyLevel, level));

  console.log(`Total items at ${level}: ${items.length}`);

  // Group by identical content
  const contentMap: Record<string, typeof items> = {};
  for (const item of items) {
    const content = (item.textContent || item.transcript || '').trim();
    if (!content) continue;
    if (!contentMap[content]) contentMap[content] = [];
    contentMap[content].push(item);
  }

  const dupeGroups = Object.entries(contentMap).filter(([, g]) => g.length > 1);
  if (dupeGroups.length === 0) {
    console.log('No duplicates found!');
    process.exit(0);
  }

  const allDupeIds = dupeGroups.flatMap(([, g]) => g.map(i => i.id));

  // Check foreign key references
  const [errorRefs, sessionRefs, exposureRefs] = await Promise.all([
    db.select({ contentId: errorLogs.contentId }).from(errorLogs).where(inArray(errorLogs.contentId, allDupeIds)),
    db.select({ contentId: sessions.contentId }).from(sessions).where(inArray(sessions.contentId, allDupeIds)),
    db.select({ contentId: userFeatureExposure.contentId }).from(userFeatureExposure).where(inArray(userFeatureExposure.contentId, allDupeIds)),
  ]);

  const referencedIds = new Set([
    ...errorRefs.map(r => r.contentId).filter(Boolean),
    ...sessionRefs.map(r => r.contentId).filter(Boolean),
    ...exposureRefs.map(r => r.contentId).filter(Boolean),
  ]);

  // Build deletion list — prefer keeping referenced items
  const idsToDelete: string[] = [];
  for (const [, group] of dupeGroups) {
    const referenced = group.filter(i => referencedIds.has(i.id));
    const keepItem = referenced.length > 0 ? referenced[0] : group[0];
    for (const item of group) {
      if (item.id !== keepItem.id) idsToDelete.push(item.id);
    }
  }

  // Safety: never delete referenced items
  const deletingReferenced = idsToDelete.filter(id => referencedIds.has(id));
  if (deletingReferenced.length > 0) {
    console.log(`⚠️  ${deletingReferenced.length} items to delete have references — aborting.`);
    process.exit(1);
  }

  console.log(`Duplicate groups: ${dupeGroups.length}`);
  console.log(`Items to delete: ${idsToDelete.length}`);
  console.log(`Items remaining: ${items.length - idsToDelete.length}`);

  if (!DRY_RUN && idsToDelete.length > 0) {
    for (let i = 0; i < idsToDelete.length; i += 50) {
      const batch = idsToDelete.slice(i, i + 50);
      await db.delete(contentItems).where(inArray(contentItems.id, batch));
      console.log(`Deleted batch ${Math.floor(i / 50) + 1} (${batch.length} items)`);
    }

    const remaining = await db.select({ count: sql<number>`count(*)` })
      .from(contentItems).where(eq(contentItems.difficultyLevel, level));
    console.log(`\n✅ Removed ${idsToDelete.length} duplicates. Items now at ${level}: ${remaining[0].count}`);
  }

  process.exit(0);
}

dedup();
