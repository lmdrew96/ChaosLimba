import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';
import { like, eq } from 'drizzle-orm';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });
const GROQ_API_KEY = process.env.GROQ_API_KEY!;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateTitles(
  items: { id: string; text: string; topic: string; level: string; isDialogue: boolean }[]
): Promise<Record<string, string>> {
  const itemDescriptions = items
    .map(
      (item, i) =>
        `${i + 1}. [${item.level}] Topic: "${item.topic.replace(/_/g, ' ')}"${item.isDialogue ? ' (dialogue)' : ''}\nText: "${item.text.substring(0, 150)}${item.text.length > 150 ? '...' : ''}"`
    )
    .join('\n\n');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You generate short, descriptive English titles for Romanian language learning audio clips.
Rules:
- Titles should be 3-7 words, descriptive and engaging
- They should hint at the content/scenario without translating the whole text
- For dialogues, frame it as a scene (e.g. "At the Doctor's Office", "Ordering at a Restaurant")
- For monologues, frame it as a topic (e.g. "My Morning Routine", "A Visit to Bucharest")
- Don't use generic titles like "Romanian Conversation" or "Learning Romanian"
- Each title must be unique — avoid repeating the same title
- Return ONLY a JSON object mapping the item number to the title, like: {"1": "Title One", "2": "Title Two"}`,
        },
        {
          role: 'user',
          content: `Generate short English titles for these ${items.length} Romanian audio clips:\n\n${itemDescriptions}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const parsed = JSON.parse(content);
    const result: Record<string, string> = {};
    for (let i = 0; i < items.length; i++) {
      const title = parsed[String(i + 1)];
      if (title) {
        result[items[i].id] = title;
      }
    }
    return result;
  } catch {
    console.error('Failed to parse Groq response:', content);
    return {};
  }
}

async function main() {
  console.log('📝 Updating content titles via Groq...\n');

  // Fetch all ElevenLabs content items
  const items = await db
    .select({
      id: schema.contentItems.id,
      title: schema.contentItems.title,
      transcript: schema.contentItems.transcript,
      topic: schema.contentItems.topic,
      audioUrl: schema.contentItems.audioUrl,
      difficultyLevel: schema.contentItems.difficultyLevel,
    })
    .from(schema.contentItems)
    .where(like(schema.contentItems.audioUrl, '%elevenlabs%'));

  console.log(`Found ${items.length} ElevenLabs content items\n`);

  // Skip items that already have short descriptive titles (not raw transcript text)
  const needsTitle = items.filter((item) => {
    const title = item.title;
    // If title is longer than 60 chars, it's probably raw transcript text
    if (title.length > 60) return true;
    // If title contains Romanian characters typical of transcripts
    if (title.includes('ă') || title.includes('î') || title.includes('ș') || title.includes('ț')) return true;
    // If title starts with "- " it's a dialogue transcript
    if (title.startsWith('- ')) return true;
    return false;
  });

  console.log(`${needsTitle.length} items need new titles (${items.length - needsTitle.length} already titled)\n`);

  if (needsTitle.length === 0) {
    console.log('All items already have titles!');
    return;
  }

  // Prepare items for batching
  const toProcess = needsTitle.map((item) => {
    const text = item.transcript || item.title;
    const isDialogue = text.includes('- ') && text.includes('\n');
    const diffNum = parseFloat(item.difficultyLevel);
    let level = 'A1';
    if (diffNum >= 4.5) level = 'B2';
    else if (diffNum >= 3.5) level = 'B1';
    else if (diffNum >= 2.5) level = 'A2';

    return {
      id: item.id,
      text,
      topic: item.topic || 'general',
      level,
      isDialogue,
    };
  });

  // Process in batches of 10 (smaller to stay under TPM limit)
  const BATCH_SIZE = 10;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toProcess.length / BATCH_SIZE);

    console.log(`[Batch ${batchNum}/${totalBatches}] Generating titles for ${batch.length} items...`);

    // Retry with exponential backoff
    let retries = 0;
    const maxRetries = 5;
    while (retries <= maxRetries) {
      try {
        const titles = await generateTitles(batch);

        for (const [id, title] of Object.entries(titles)) {
          try {
            await db
              .update(schema.contentItems)
              .set({ title, updatedAt: new Date() })
              .where(eq(schema.contentItems.id, id));
            updated++;
            console.log(`  ✅ "${title}"`);
          } catch (err: any) {
            console.error(`  ❌ ${id}: DB update failed - ${err.message}`);
            failed++;
          }
        }
        break; // Success, exit retry loop
      } catch (err: any) {
        if (err.message.includes('429') && retries < maxRetries) {
          const waitMs = Math.min(5000 * Math.pow(2, retries), 60000);
          console.log(`  ⏳ Rate limited, waiting ${(waitMs / 1000).toFixed(0)}s (retry ${retries + 1}/${maxRetries})...`);
          await sleep(waitMs);
          retries++;
        } else {
          console.error(`  ❌ Batch ${batchNum} failed: ${err.message}`);
          failed += batch.length;
          break;
        }
      }
    }

    // Wait 6s between batches to stay under 12K TPM
    if (i + BATCH_SIZE < toProcess.length) {
      await sleep(6000);
    }
  }

  console.log(`\n✅ Updated: ${updated}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${toProcess.length}`);
}

main().catch(console.error);
