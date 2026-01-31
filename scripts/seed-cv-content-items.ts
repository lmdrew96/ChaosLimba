// scripts/seed-cv-content-items.ts
// Convert Common Voice clips → contentItems with difficulty assignment

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Simple difficulty assignment based on sentence complexity
function calculateDifficulty(sentence: string): number {
  const words = sentence.trim().split(/\s+/).length;
  const avgWordLength = sentence.replace(/\s+/g, '').length / words;

  // Heuristic CEFR levels based on sentence length and word complexity
  if (words <= 5 && avgWordLength < 6) {
    return 2.0; // A2 - Simple short sentences
  } else if (words <= 8 && avgWordLength < 7) {
    return 3.5; // B1 - Everyday topics
  } else if (words <= 12 && avgWordLength < 8) {
    return 5.5; // B2 - More complex structures
  } else if (words <= 15 && avgWordLength < 9) {
    return 7.0; // C1 - Advanced vocabulary
  } else {
    return 8.5; // C2 - Very complex
  }
}

// Infer topic from sentence content (basic keyword matching)
function inferTopic(sentence: string): string {
  const lower = sentence.toLowerCase();

  const topics: { [key: string]: string[] } = {
    'Politics & Society': ['guvern', 'politic', 'democra', 'european', 'uniune', 'stat', 'parlament', 'vot'],
    'Economy': ['econom', 'finanț', 'bani', 'piaț', 'preț', 'cost', 'cumpăr', 'vând'],
    'Education': ['școal', 'educa', 'învăț', 'student', 'profesor', 'universitat'],
    'Health': ['sănătat', 'medic', 'doctor', 'spital', 'tratament', 'boal'],
    'Family & Relationships': ['fami', 'copil', 'părint', 'soț', 'prieten', 'dragoste'],
    'Daily Life': ['zi', 'muncă', 'casă', 'mânc', 'bea', 'dorm'],
    'Culture': ['cultur', 'art', 'muzică', 'teatru', 'film', 'carte']
  };

  for (const [topic, keywords] of Object.entries(topics)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      return topic;
    }
  }

  return 'General'; // Default topic
}

async function main() {
  console.log('📝 Seeding contentItems with Common Voice clips\n');

  // Fetch clips that have word timestamps (already processed)
  console.log('🔍 Fetching processed clips with timestamps...\n');

  const clips = await sql`
    SELECT id, clip_path, sentence, r2_url, duration_ms, word_timestamps, up_votes, down_votes
    FROM common_voice_clips
    WHERE word_timestamps IS NOT NULL
    ORDER BY up_votes DESC
    LIMIT 200
  `;

  console.log(`✅ Found ${clips.length} clips with timestamps\n`);

  if (clips.length === 0) {
    console.log('⚠️  No clips with timestamps found. Run extract-cv-timestamps.ts first!');
    return;
  }

  console.log('🌱 Creating contentItems...\n');

  let inserted = 0;
  let skipped = 0;

  for (const clip of clips) {
    const difficulty = calculateDifficulty(clip.sentence);
    const topic = inferTopic(clip.sentence);
    const durationSeconds = Math.round((clip.duration_ms || 0) / 1000);

    try {
      await db.insert(schema.contentItems).values({
        type: 'audio',
        title: clip.sentence.substring(0, 100), // Truncate long sentences for title
        difficultyLevel: difficulty.toFixed(1),
        durationSeconds: durationSeconds,
        audioUrl: clip.r2_url,
        transcript: clip.sentence,
        transcriptSource: 'common_voice_manual',
        transcriptLanguage: 'ro',
        languageFeatures: {
          wordTimestamps: clip.word_timestamps
        } as any,
        topic: topic,
        sourceAttribution: {
          creator: 'Common Voice Contributors',
          license: 'CC0 1.0 Universal',
          originalUrl: 'https://commonvoice.mozilla.org/'
        },
        culturalNotes: null
      }).onConflictDoNothing();

      inserted++;
      console.log(`  ✅ [${inserted}/${clips.length}] ${clip.sentence.substring(0, 60)}... (${difficulty.toFixed(1)} CEFR, ${topic})`);
    } catch (error: any) {
      skipped++;
      console.error(`  ❌ Failed: ${error.message}`);
    }
  }

  console.log('\n🎉 Seeding Complete!\n');
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📊 Total: ${clips.length}`);
  console.log('\n💡 Common Voice clips are now available in Chaos Window!');
}

main().catch(console.error);
