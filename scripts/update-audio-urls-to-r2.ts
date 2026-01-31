// scripts/update-audio-urls-to-r2.ts
// Update audio URLs to use R2 public URL for production

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('📝 Updating audio URLs to use R2 public URL\n');

  const localPath = '/audio/elevenlabs/';
  const r2Url = process.env.R2_PUBLIC_URL + '/elevenlabs/';

  // Update all ElevenLabs URLs
  const result = await sql`
    UPDATE content_items
    SET audio_url = REPLACE(audio_url, ${localPath}, ${r2Url})
    WHERE audio_url LIKE '%elevenlabs%'
  `;

  console.log(`✅ Updated audio URLs to R2`);

  // Verify
  const sample = await sql`
    SELECT id, title, audio_url
    FROM content_items
    WHERE audio_url LIKE '%elevenlabs%'
    LIMIT 3
  `;

  console.log('\n📋 Sample URLs after update:\n');
  sample.forEach((row: any) => {
    console.log(`  ${row.audio_url}`);
  });

  console.log('\n🎉 Audio files now served from R2!');
  console.log(`💡 Public URL: ${r2Url}`);
}

main().catch(console.error);
