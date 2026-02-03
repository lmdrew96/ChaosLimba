import { db } from '@/lib/db';
import { contentItems, grammarFeatureMap } from '@/lib/db/schema';
import type { LanguageFeatures } from '@/lib/db/schema';
import { isNull, eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function callGroq(messages: { role: string; content: string }[]): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API Error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function backfillLanguageFeatures() {
  console.log('🏷️  Backfilling language features for content items...\n');

  // Get all valid feature keys
  const allFeatures = await db.select().from(grammarFeatureMap);
  const validKeys = new Set(allFeatures.map(f => f.featureKey));
  const featureKeysList = allFeatures.map(f => `${f.featureKey} (${f.featureName})`).join('\n');

  console.log(`   Found ${allFeatures.length} valid feature keys\n`);

  // Get content items with null languageFeatures
  const items = await db
    .select()
    .from(contentItems)
    .where(isNull(contentItems.languageFeatures));

  if (items.length === 0) {
    console.log('✅ All content items already have language features tagged!');
    process.exit(0);
  }

  console.log(`   Found ${items.length} content items to tag\n`);

  let tagged = 0;
  let failed = 0;

  for (const item of items) {
    const text = item.transcript || item.textContent || item.title;
    if (!text || text.trim().length < 10) {
      console.log(`   ⏭️  Skipping "${item.title}" (no text content)`);
      continue;
    }

    console.log(`   🔍 Analyzing "${item.title}"...`);

    try {
      const result = await callGroq([
        {
          role: 'system',
          content: `You are a Romanian language analysis tool. Given Romanian text, identify which grammar features and vocabulary domains are present.

Available feature keys:
${featureKeysList}

Respond with a JSON object:
{
  "grammar": ["feature_key_1", "feature_key_2"],
  "vocabulary": {
    "keywords": ["word1", "word2", "word3"],
    "requiredVocabSize": 100
  },
  "structures": ["structure description 1"]
}

Rules:
- Only use feature keys from the list above
- For "grammar": list feature keys of grammar structures present in the text
- For "vocabulary.keywords": list 5-10 important Romanian words from the text
- For "vocabulary.requiredVocabSize": estimate how many words a learner needs to understand 70% of this text
- For "structures": list 1-3 notable sentence patterns (e.g., "SVO basic word order", "question with 'ce'")
- Be precise: only tag features that are clearly demonstrated in the text`,
        },
        {
          role: 'user',
          content: `Analyze this Romanian text:\n\n${text.substring(0, 2000)}`,
        },
      ]);

      const parsed = JSON.parse(result) as LanguageFeatures;

      // Validate: only keep feature keys that exist in our map
      const validGrammar = (parsed.grammar || []).filter(k => validKeys.has(k));

      const languageFeatures: LanguageFeatures = {
        grammar: validGrammar,
        vocabulary: {
          keywords: parsed.vocabulary?.keywords || [],
          requiredVocabSize: parsed.vocabulary?.requiredVocabSize || 100,
        },
        structures: parsed.structures || [],
      };

      await db
        .update(contentItems)
        .set({ languageFeatures, updatedAt: new Date() })
        .where(eq(contentItems.id, item.id));

      console.log(`   ✅ Tagged with ${validGrammar.length} grammar features: [${validGrammar.join(', ')}]`);
      tagged++;

      // Rate limit: 3s between calls to stay within Groq free tier TPM
      await new Promise(r => setTimeout(r, 3000));
    } catch (error) {
      console.error(`   ❌ Failed to tag "${item.title}":`, error);
      failed++;
    }
  }

  console.log(`\n🏁 Backfill complete: ${tagged} tagged, ${failed} failed, ${items.length - tagged - failed} skipped`);
  process.exit(0);
}

backfillLanguageFeatures();
