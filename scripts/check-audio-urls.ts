// scripts/check-audio-urls.ts
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const rows = await sql`
    SELECT id, title, audio_url
    FROM content_items
    WHERE audio_url LIKE '%elevenlabs%'
    LIMIT 5
  `;

  console.log('Sample audio URLs from database:\n');
  rows.forEach((row: any) => {
    console.log(`ID: ${row.id}`);
    console.log(`Title: ${row.title.substring(0, 50)}...`);
    console.log(`URL: ${row.audio_url}\n`);
  });
}

main().catch(console.error);
