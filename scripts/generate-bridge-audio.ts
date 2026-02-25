/**
 * Generate Google Cloud TTS audio for bridge content items (2.0–3.0)
 * and upload to R2. Updates DB records with audioUrl.
 *
 * Usage: npx tsx scripts/generate-bridge-audio.ts
 *        npx tsx scripts/generate-bridge-audio.ts --dry-run
 */
import { db } from '@/lib/db';
import { contentItems } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { generateAndUploadToR2 } from '@/lib/tts/google-cloud';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const DRY_RUN = process.argv.includes('--dry-run');
const DELAY_MS = 300; // Rate limiting between API calls
const SPEAKING_RATE = 0.92; // Slightly slower for learner comprehension

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateAudio() {
  console.log(DRY_RUN ? '🔍 DRY RUN\n' : '🎙️  Generating TTS audio for bridge content\n');

  // Find text items at 2.0-3.0 that don't have audio yet
  const items = await db.select({
    id: contentItems.id,
    title: contentItems.title,
    difficultyLevel: contentItems.difficultyLevel,
    textContent: contentItems.textContent,
    audioUrl: contentItems.audioUrl,
    topic: contentItems.topic,
  }).from(contentItems).where(
    and(
      gte(contentItems.difficultyLevel, '2.0'),
      lte(contentItems.difficultyLevel, '3.0'),
      eq(contentItems.type, 'text'),
      isNull(contentItems.audioUrl),
    )
  );

  console.log(`Found ${items.length} text items without audio at 2.0-3.0\n`);

  if (items.length === 0) {
    console.log('Nothing to generate!');
    process.exit(0);
  }

  let totalChars = 0;
  let totalCost = 0;
  let generated = 0;
  let failed = 0;

  for (const item of items) {
    const text = item.textContent?.trim();
    if (!text) {
      console.log(`  ⏭️  [${item.difficultyLevel}] "${item.title}" — no text content, skipping`);
      continue;
    }

    const charCount = text.length;
    totalChars += charCount;

    if (DRY_RUN) {
      const estCost = charCount * 0.000016;
      totalCost += estCost;
      console.log(`  📝 [${item.difficultyLevel}] "${item.title}" — ${charCount} chars ($${estCost.toFixed(5)})`);
      continue;
    }

    try {
      // Use alternating voices for variety
      const voiceChoice = generated % 2 === 0 ? 'female' : 'male';
      const r2Key = `bridge-content/${item.id}.mp3`;

      console.log(`  🎙️  [${item.difficultyLevel}] "${item.title}" (${charCount} chars, ${voiceChoice})...`);

      const { url, metadata } = await generateAndUploadToR2(text, r2Key, {
        voice: voiceChoice as 'female' | 'male',
        speakingRate: SPEAKING_RATE,
      });

      // Estimate duration from character count (Romanian ~10 chars/sec at 0.92 rate)
      const estimatedDuration = Math.ceil(charCount / 9);

      // Update DB with audio URL
      await db.update(contentItems).set({
        audioUrl: url,
        durationSeconds: estimatedDuration,
      }).where(eq(contentItems.id, item.id));

      totalCost += metadata.estimatedCost;
      generated++;
      console.log(`    ✅ ${url} (~${estimatedDuration}s, $${metadata.estimatedCost.toFixed(5)})`);

      await sleep(DELAY_MS);
    } catch (error) {
      failed++;
      console.error(`    ❌ Failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total characters: ${totalChars.toLocaleString()}`);
  console.log(`Total cost: $${totalCost.toFixed(4)}`);
  if (!DRY_RUN) {
    console.log(`Generated: ${generated}`);
    console.log(`Failed: ${failed}`);
  }

  process.exit(0);
}

generateAudio();
