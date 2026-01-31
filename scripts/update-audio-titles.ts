// scripts/update-audio-titles.ts
// Update audio contentItems with Romanian question-based titles

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

// Romanian question-based titles for audio clips
const ROMANIAN_TITLES = [
  'Despre ce vorbește?',       // What are they talking about?
  'Ascultă și înțelege',       // Listen and understand
  'Ce auzi?',                  // What do you hear?
  'Înțelegi?',                 // Do you understand?
  'Ce se întâmplă?',           // What's happening?
  'Despre ce este?',           // What is it about?
  'Cine vorbește?',            // Who is speaking?
  'Unde sunt?',                // Where are they?
  'Ce fac?',                   // What are they doing?
  'Ascultă cu atenție',        // Listen carefully
  'Poți înțelege?',            // Can you understand?
  'Ce spune?',                 // What are they saying?
];

async function main() {
  console.log('📝 Updating audio titles with Romanian questions\n');

  // Get all audio contentItems
  const audioItems = await sql`
    SELECT id, title, topic
    FROM content_items
    WHERE type = 'audio'
    AND audio_url LIKE '%elevenlabs%'
  `;

  console.log(`✅ Found ${audioItems.length} audio items\n`);

  let updated = 0;

  for (const item of audioItems) {
    // Pick a random Romanian question title
    const randomTitle = ROMANIAN_TITLES[Math.floor(Math.random() * ROMANIAN_TITLES.length)];

    await sql`
      UPDATE content_items
      SET title = ${randomTitle}
      WHERE id = ${item.id}
    `;

    updated++;

    if (updated % 20 === 0) {
      console.log(`  Progress: ${updated}/${audioItems.length} updated...`);
    }
  }

  console.log(`\n✅ Updated ${updated} audio titles\n`);

  // Show sample of new titles
  const sample = await sql`
    SELECT title, topic, audio_url
    FROM content_items
    WHERE type = 'audio'
    AND audio_url LIKE '%elevenlabs%'
    LIMIT 10
  `;

  console.log('📋 Sample updated titles:\n');
  sample.forEach((item: any) => {
    console.log(`  • ${item.title} (${item.topic})`);
  });

  console.log('\n🎧 All audio clips now have Romanian question titles!');
}

main().catch(console.error);
