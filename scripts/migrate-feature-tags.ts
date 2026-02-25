import { db } from '@/lib/db';
import { contentItems, grammarFeatureMap } from '@/lib/db/schema';
import type { LanguageFeatures } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// ─── Config ────────────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-6';
const BATCH_SIZE = 8;
const DELAY_MS = 1500;
const MAX_RETRIES = 3;
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Types ─────────────────────────────────────────────────────────────────────
interface FeatureInfo {
  featureKey: string;
  featureName: string;
  cefrLevel: string;
  category: string;
  description: string | null;
}

interface ContentItemRow {
  id: string;
  type: string;
  title: string;
  topic: string;
  textContent: string | null;
  transcript: string | null;
  languageFeatures: LanguageFeatures | Record<string, unknown> | null;
}

interface BatchResult {
  [contentItemId: string]: string[];
}

// ─── Anthropic API ─────────────────────────────────────────────────────────────
async function callClaude(prompt: string, retries = 0): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error: ${response.status} ${errText}`);
    }

    const result = await response.json();
    const text = result.content?.[0]?.text;
    if (!text) throw new Error('No text content in Claude response');
    return text;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      const backoff = Math.pow(2, retries) * 1000;
      console.log(`      ⏳ Retry ${retries + 1}/${MAX_RETRIES} in ${backoff}ms...`);
      await sleep(backoff);
      return callClaude(prompt, retries + 1);
    }
    throw error;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Text Extraction ───────────────────────────────────────────────────────────
function extractText(item: ContentItemRow): string {
  // Audio items: prefer transcript, fall back to reconstructing from wordTimestamps
  if (item.type === 'audio') {
    if (item.transcript) return item.transcript;

    const lf = item.languageFeatures as Record<string, unknown> | null;
    const timestamps = lf?.wordTimestamps as { word: string }[] | undefined;
    if (timestamps?.length) {
      return timestamps.map(t => t.word).join(' ');
    }
    return item.title; // last resort
  }

  // Text items: use textContent
  return item.textContent || item.title;
}

// ─── Prompt Builder ────────────────────────────────────────────────────────────
function buildBatchPrompt(
  items: { id: string; title: string; topic: string; text: string }[],
  features: FeatureInfo[]
): string {
  const featureList = features
    .map(f => `- ${f.featureKey} | ${f.featureName} (${f.cefrLevel}, ${f.category}): ${f.description || 'N/A'}`)
    .join('\n');

  const itemsList = items
    .map(
      (item, i) =>
        `--- ITEM ${i + 1} (id: ${item.id}) ---\nTITLE: ${item.title}\nTOPIC: ${item.topic}\nTEXT: "${item.text.substring(0, 2000)}"`
    )
    .join('\n\n');

  return `You are a Romanian language teaching expert. Given short Romanian texts and a list of grammar/vocabulary features, identify which features are clearly demonstrated in each text.

RULES:
- Only tag a feature if it is CLEARLY present — not just tangentially related
- A verb conjugation feature requires the actual conjugated form to appear
- A vocabulary domain feature requires 2+ words from that domain
- Be conservative — false negatives are better than false positives
- Return ONLY the matching feature_key values

FEATURES:
${featureList}

TEXTS TO ANALYZE:
${itemsList}

Return a JSON object where each key is the content item id and the value is an array of matching feature_keys.
Example: {"uuid-1": ["present_tense_a_fi", "vocab_food"], "uuid-2": ["basic_negation"]}

Return ONLY the JSON object, no markdown code blocks, no extra text.`;
}

// ─── Main Migration ────────────────────────────────────────────────────────────
async function migrate() {
  console.log(`\n🏷️  ChaosLimbă Feature Tag Migration${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log('─'.repeat(50));

  // Step 1: Fetch all data
  const allFeatures = await db.select().from(grammarFeatureMap);
  const validKeys = new Set(allFeatures.map(f => f.featureKey));
  console.log(`\n📋 Loaded ${allFeatures.length} grammar features`);

  const allItems = await db.select().from(contentItems);
  console.log(`📦 Loaded ${allItems.length} content items`);

  // Step 1b: Snapshot "before" coverage
  const beforeCoverage = countCoverage(allItems, validKeys);
  console.log(`\n📊 BEFORE: ${beforeCoverage.coveredFeatures}/${allFeatures.length} features have content (${Math.round(beforeCoverage.coveredFeatures / allFeatures.length * 100)}%)`);

  // Step 2: Extract text for each item
  const itemsWithText = allItems.map(item => ({
    id: item.id,
    title: item.title,
    topic: item.topic,
    text: extractText(item as ContentItemRow),
    original: item,
  }));

  // Filter out items with no usable text
  const analyzable = itemsWithText.filter(i => i.text.trim().length >= 10);
  console.log(`\n🔍 ${analyzable.length} items have enough text to analyze`);
  if (analyzable.length < allItems.length) {
    console.log(`   ⏭️  Skipping ${allItems.length - analyzable.length} items with insufficient text`);
  }

  // Step 3: Batch analyze with Claude
  const featureInfos: FeatureInfo[] = allFeatures.map(f => ({
    featureKey: f.featureKey,
    featureName: f.featureName,
    cefrLevel: f.cefrLevel,
    category: f.category,
    description: f.description,
  }));

  const allResults: Map<string, string[]> = new Map();
  const batches = chunk(analyzable, BATCH_SIZE);

  console.log(`\n🤖 Analyzing ${analyzable.length} items in ${batches.length} batches (${BATCH_SIZE} per batch)...\n`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`   Batch ${i + 1}/${batches.length}: ${batch.map(b => `"${b.title}"`).join(', ')}`);

    try {
      const prompt = buildBatchPrompt(
        batch.map(b => ({ id: b.id, title: b.title, topic: b.topic, text: b.text })),
        featureInfos
      );

      const rawResponse = await callClaude(prompt);
      const parsed = parseJsonResponse(rawResponse);

      for (const item of batch) {
        const rawKeys = parsed[item.id] || [];
        // Validate: only keep keys that exist in our grammar_feature_map
        const validatedKeys = rawKeys.filter(k => validKeys.has(k));
        allResults.set(item.id, validatedKeys);
        console.log(`      ✅ ${item.title}: [${validatedKeys.join(', ')}] (${validatedKeys.length} features)`);
      }
    } catch (error) {
      console.error(`      ❌ Batch ${i + 1} failed:`, error);
      // Mark all items in this batch as failed (empty arrays)
      for (const item of batch) {
        allResults.set(item.id, []);
      }
    }

    // Rate limiting between batches
    if (i < batches.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // Step 4: Write back to database
  console.log(`\n💾 Writing results to database${DRY_RUN ? ' (DRY RUN — no writes)' : ''}...\n`);
  let updated = 0;
  let skipped = 0;

  for (const item of allItems) {
    const newKeys = allResults.get(item.id);
    if (!newKeys || newKeys.length === 0) {
      skipped++;
      continue;
    }

    // Merge with existing languageFeatures — preserve everything, update grammar array
    const existing = (item.languageFeatures || {}) as Record<string, unknown>;
    const existingGrammar = (existing.grammar as string[]) || [];

    // Deduplicate: merge existing grammar keys with new ones
    const mergedGrammar = [...new Set([...existingGrammar.filter(k => validKeys.has(k)), ...newKeys])];

    const updatedFeatures = {
      ...existing,
      grammar: mergedGrammar,
    };

    if (DRY_RUN) {
      console.log(`   🔍 ${item.title}: would set grammar to [${mergedGrammar.join(', ')}]`);
    } else {
      await db
        .update(contentItems)
        .set({ languageFeatures: updatedFeatures as LanguageFeatures, updatedAt: new Date() })
        .where(eq(contentItems.id, item.id));
    }

    updated++;
  }

  console.log(`\n✅ ${updated} items updated, ${skipped} skipped (no features found)`);

  // Step 5: Verify — re-fetch and count coverage
  if (!DRY_RUN) {
    const refreshedItems = await db.select().from(contentItems);
    const afterCoverage = countCoverage(refreshedItems, validKeys);

    console.log('\n' + '═'.repeat(50));
    console.log('📊 COVERAGE REPORT');
    console.log('═'.repeat(50));
    console.log(`   Before: ${beforeCoverage.coveredFeatures}/${allFeatures.length} features (${Math.round(beforeCoverage.coveredFeatures / allFeatures.length * 100)}%)`);
    console.log(`   After:  ${afterCoverage.coveredFeatures}/${allFeatures.length} features (${Math.round(afterCoverage.coveredFeatures / allFeatures.length * 100)}%)`);
    console.log(`\n   Feature breakdown:`);

    for (const f of allFeatures) {
      const count = afterCoverage.featureCounts.get(f.featureKey) || 0;
      const indicator = count > 0 ? '✅' : '⬜';
      console.log(`   ${indicator} ${f.featureKey}: ${count} items`);
    }
  }

  console.log('\n🏁 Migration complete!\n');
  process.exit(0);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function parseJsonResponse(text: string): BatchResult {
  // Strip markdown code blocks if present
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
  const jsonText = jsonMatch ? jsonMatch[1] : text;

  try {
    return JSON.parse(jsonText.trim());
  } catch {
    console.error('   ⚠️  Failed to parse response, attempting line-by-line fix...');
    // Try to find the first { and last } to extract JSON
    const start = jsonText.indexOf('{');
    const end = jsonText.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(jsonText.substring(start, end + 1));
    }
    throw new Error(`Could not parse JSON from response: ${text.substring(0, 200)}`);
  }
}

function countCoverage(
  items: { languageFeatures: unknown }[],
  validKeys: Set<string>
): { coveredFeatures: number; featureCounts: Map<string, number> } {
  const featureCounts = new Map<string, number>();

  for (const key of validKeys) {
    featureCounts.set(key, 0);
  }

  for (const item of items) {
    const lf = item.languageFeatures as Record<string, unknown> | null;
    const grammar = (lf?.grammar as string[]) || [];
    for (const key of grammar) {
      if (validKeys.has(key)) {
        featureCounts.set(key, (featureCounts.get(key) || 0) + 1);
      }
    }
  }

  const coveredFeatures = [...featureCounts.values()].filter(c => c > 0).length;
  return { coveredFeatures, featureCounts };
}

// ─── Run ───────────────────────────────────────────────────────────────────────
migrate();