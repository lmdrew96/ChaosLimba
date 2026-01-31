// scripts/extract-cv-timestamps.ts
// Batch process Common Voice clips through Groq Whisper to extract word timestamps

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { sql as rawSql } from 'drizzle-orm';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type WordTimestamp = {
  word: string;
  start: number;
  end: number;
};

async function extractTimestampsForClip(
  clipPath: string,
  r2Url: string,
  sentence: string
): Promise<{ duration: number; words: WordTimestamp[] } | null> {
  try {
    // Fetch audio from R2
    const response = await fetch(r2Url);
    if (!response.ok) {
      console.error(`  ❌ Failed to fetch audio: ${response.status}`);
      return null;
    }

    const audioBuffer = await response.arrayBuffer();
    const audioFile = new File([audioBuffer], clipPath, { type: 'audio/mpeg' });

    // Transcribe with Groq Whisper
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      language: 'ro',
      response_format: 'verbose_json',
      timestamp_granularities: ['word']
    });

    // Extract word timestamps
    const words: WordTimestamp[] = (transcription as any).words?.map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end
    })) || [];

    return {
      duration: transcription.duration || 0,
      words
    };
  } catch (error: any) {
    console.error(`  ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  // Get batch size from args, default to 5 for testing
  const batchSize = process.argv[2] ? parseInt(process.argv[2]) : 5;
  const concurrency = 5; // Process 5 at a time to avoid rate limits

  console.log('🎵 Common Voice Timestamp Extraction\n');
  console.log(`📊 Fetching ${batchSize} high-quality clips...\n`);

  // Fetch clips to process (high quality, no timestamps yet)
  const clips = await sql`
    SELECT id, clip_path, sentence, r2_url, duration_ms
    FROM common_voice_clips
    WHERE up_votes >= 2
    ORDER BY RANDOM()
    LIMIT ${batchSize}
  `;

  console.log(`✅ Found ${clips.length} clips to process\n`);
  console.log('⚡ Processing with Groq Whisper (FREE!)...\n');

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  // Process in batches to respect rate limits
  for (let i = 0; i < clips.length; i += concurrency) {
    const batch = clips.slice(i, i + concurrency);

    const results = await Promise.allSettled(
      batch.map(async (clip: any) => {
        console.log(`  [${processed + 1}/${clips.length}] ${clip.sentence.substring(0, 50)}...`);

        const result = await extractTimestampsForClip(
          clip.clip_path,
          clip.r2_url,
          clip.sentence
        );

        if (result) {
          // Update database with timestamps and correct duration
          await sql`
            UPDATE common_voice_clips
            SET
              duration_ms = ${Math.round(result.duration * 1000)},
              word_timestamps = ${JSON.stringify(result.words)}::jsonb
            WHERE id = ${clip.id}
          `;

          console.log(`  ✅ ${result.words.length} words, ${result.duration.toFixed(1)}s\n`);
          return true;
        } else {
          console.log(`  ⏭️  Skipped\n`);
          return false;
        }
      })
    );

    // Count successes
    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value === true) {
        succeeded++;
      } else {
        failed++;
      }
    });

    processed += batch.length;

    // Show progress
    const progress = ((processed / clips.length) * 100).toFixed(0);
    console.log(`📈 Progress: ${processed}/${clips.length} (${progress}%) | ✅ ${succeeded} | ❌ ${failed}\n`);

    // Small delay between batches to be polite to Groq
    if (i + concurrency < clips.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n🎉 Timestamp Extraction Complete!\n');
  console.log(`   ✅ Succeeded: ${succeeded}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${processed}`);
}

main().catch(console.error);
