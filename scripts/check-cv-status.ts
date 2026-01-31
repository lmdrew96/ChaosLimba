import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function checkCV() {
  console.log('🔍 Checking Common Voice infrastructure...\n');

  // Count total clips
  const total = await sql`SELECT COUNT(*) FROM common_voice_clips`;
  console.log(`📊 Total clips in database: ${total[0].count}`);

  // Count high-quality clips (upvotes >= 2)
  const quality = await sql`SELECT COUNT(*) FROM common_voice_clips WHERE up_votes >= 2`;
  console.log(`⭐ High-quality clips (upvotes >= 2): ${quality[0].count}`);

  // Sample 5 clips
  console.log('\n📝 Sample clips:\n');
  const samples = await sql`
    SELECT clip_path, sentence, up_votes, down_votes, duration_ms, r2_url
    FROM common_voice_clips
    WHERE up_votes >= 2
    LIMIT 5
  `;

  samples.forEach((clip: any, i: number) => {
    console.log(`${i + 1}. ${clip.sentence}`);
    console.log(`   Clip: ${clip.clip_path}`);
    console.log(`   Votes: ↑${clip.up_votes} ↓${clip.down_votes}`);
    console.log(`   Duration: ${(clip.duration_ms / 1000).toFixed(1)}s`);
    console.log(`   R2: ${clip.r2_url?.substring(0, 50)}...`);
    console.log('');
  });
}

checkCV().catch(console.error);
