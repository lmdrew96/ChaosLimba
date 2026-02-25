import { db } from '@/lib/db';
import { contentItems } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { generateAndUploadToR2 } from '@/lib/tts/google-cloud';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SPEAKING_RATE = 0.92;
const DELAY_MS = 300;

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function gen() {
  console.log('🎙️  Generating TTS for P5+P6 items (4.5-9.0 without audio)\n');

  const items = await db.select({
    id: contentItems.id,
    title: contentItems.title,
    difficultyLevel: contentItems.difficultyLevel,
    textContent: contentItems.textContent,
  }).from(contentItems).where(
    and(
      gte(contentItems.difficultyLevel, '4.5'),
      lte(contentItems.difficultyLevel, '9.5'),
      eq(contentItems.type, 'text'),
      isNull(contentItems.audioUrl),
    )
  );

  console.log(`Found ${items.length} items without audio\n`);
  if (items.length === 0) { console.log('Nothing to generate!'); process.exit(0); }

  let generated = 0, failed = 0, totalCost = 0;

  for (const item of items) {
    const text = item.textContent?.trim();
    if (!text) continue;

    const voiceChoice = generated % 2 === 0 ? 'female' : 'male';
    const r2Key = `gap-content/${item.id}.mp3`;

    try {
      console.log(`  🎙️  [${item.difficultyLevel}] "${item.title}" (${text.length} chars, ${voiceChoice})...`);
      const { url, metadata } = await generateAndUploadToR2(text, r2Key, {
        voice: voiceChoice as 'female' | 'male',
        speakingRate: SPEAKING_RATE,
      });
      const dur = Math.ceil(text.length / 9);
      await db.update(contentItems).set({ audioUrl: url, durationSeconds: dur }).where(eq(contentItems.id, item.id));
      totalCost += metadata.estimatedCost;
      generated++;
      console.log(`    ✅ ~${dur}s, $${metadata.estimatedCost.toFixed(5)}`);
      await sleep(DELAY_MS);
    } catch (error) {
      failed++;
      console.error(`    ❌ ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Generated: ${generated}, Failed: ${failed}, Cost: $${totalCost.toFixed(4)}`);
  process.exit(0);
}

gen();
