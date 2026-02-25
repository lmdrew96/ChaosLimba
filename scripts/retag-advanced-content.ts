/**
 * P4: Re-tag 8.0–9.5 content with enhanced C1-C2 feature detection
 * Also fixes vague topic labels with specific descriptors.
 *
 * Usage: npx tsx scripts/retag-advanced-content.ts
 *        npx tsx scripts/retag-advanced-content.ts --dry-run
 */
import { db } from '@/lib/db';
import { contentItems, grammarFeatureMap } from '@/lib/db/schema';
import type { LanguageFeatures } from '@/lib/db/schema';
import { and, gte, lte, eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-5';
const BATCH_SIZE = 4; // Smaller batches for longer texts = better analysis
const DELAY_MS = 2000;
const MAX_RETRIES = 3;
const DRY_RUN = process.argv.includes('--dry-run');

// ─── Types ──────────────────────────────────────────────────────────────────────
interface FeatureInfo {
  featureKey: string;
  featureName: string;
  cefrLevel: string;
  category: string;
  description: string | null;
}

interface TagResult {
  grammar: string[];
  topic: string;
}

interface BatchResult {
  [contentItemId: string]: TagResult;
}

// ─── Anthropic API ──────────────────────────────────────────────────────────────
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
        max_tokens: 4096,
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

// ─── Text Extraction ────────────────────────────────────────────────────────────
function extractText(item: {
  type: string;
  textContent: string | null;
  transcript: string | null;
  title: string;
  languageFeatures: unknown;
}): string {
  if (item.type === 'audio') {
    if (item.transcript) return item.transcript;
    const lf = item.languageFeatures as Record<string, unknown> | null;
    const timestamps = lf?.wordTimestamps as { word: string }[] | undefined;
    if (timestamps?.length) return timestamps.map(t => t.word).join(' ');
    return item.title;
  }
  return item.textContent || item.title;
}

// ─── Enhanced C1-C2 Prompt ──────────────────────────────────────────────────────
function buildPrompt(
  items: { id: string; title: string; topic: string; text: string }[],
  features: FeatureInfo[]
): string {
  // Focus on B1+ features — these are what 8.0-9.5 content should have
  const b1PlusFeatures = features.filter(f =>
    ['B1', 'B2', 'C1', 'C2'].includes(f.cefrLevel)
  );
  const allFeatures = features;

  const featureList = allFeatures
    .map(f => `- ${f.featureKey} | ${f.featureName} (${f.cefrLevel}): ${f.description || 'N/A'}`)
    .join('\n');

  const b1PlusList = b1PlusFeatures
    .map(f => `  ${f.featureKey}: ${f.featureName}`)
    .join('\n');

  const itemsList = items
    .map(
      (item, i) =>
        `--- ITEM ${i + 1} (id: ${item.id}) ---\nCURRENT TITLE: ${item.title}\nCURRENT TOPIC: ${item.topic}\nTEXT (first 3000 chars): "${item.text.substring(0, 3000)}"`
    )
    .join('\n\n');

  return `You are a Romanian linguistics professor specializing in advanced grammar (B2-C2).

You are analyzing ADVANCED Romanian texts (difficulty 8.0-9.5 on a 10-point scale). These texts are complex academic, literary, or socio-political content. They WILL contain many advanced grammatical features. Your task is to identify ALL grammar features present, not just basic ones.

IMPORTANT: These are C1-C2 level texts. You should expect to find 15-25+ features per text, including many B1+ features. If you only find basic A1/A2 features, you are not looking hard enough.

DETECTION GUIDE FOR ADVANCED FEATURES:

B1 Grammar:
- subjunctive_sa: "să" + conjugated verb (e.g., "să fie", "să poată", "să reprezinte")
- present_tense_irregular: irregular verb forms (a ști → știe, a putea → poate, a vrea → vrea)
- imperfect_tense: -eam/-eai/-ea/-eau endings (era, avea, putea, trebuia)
- conditional_present: aș/ai/ar/am/ați + infinitive (ar fi, ar trebui, ar putea)
- relative_clauses_care: "care", "pe care", "în care", "la care", "din care"
- advanced_connectors: deși, totuși, cu toate că, prin urmare, în schimb, cu toate acestea, pe de altă parte
- passive_voice: "este/a fost/sunt/au fost" + past participle, OR "se" + verb (se consideră, se observă)
- genitive_dative_case: noun forms with -ului, -ei, -ilor; "al/a/ai/ale" constructions
- clitic_doubling: "pe" + noun with resumptive pronoun (pe el îl cunoaște)
- future_formal_voi: voi/vei/va/vom/veți/vor + infinitive
- adverb_formation: adverbs derived from adjectives (-mente: evident→evident, profund→profund)
- present_tense_group2_3_4: -ea, -e, -i conjugation verbs (a vedea, a face, a ști)

B2 Grammar:
- impersonal_constructions: "se poate", "trebuie", "este necesar", "se observă", "se consideră"
- gerund_gerunziu: -ând/-ind forms (mergând, făcând, citind, fiind)
- reported_speech: "a spus/declarat/afirmat că", indirect speech patterns
- infinitive_long: nominal infinitives (punere, vedenie, cunoaștere, dezvoltare)
- vocative_case: direct address forms
- numbers_advanced: ordinals (primul, al doilea), fractions, complex numerals
- pluperfect_tense: -sem/-seși/-se endings (fusese, avusese)
- conditional_perfect: ar fi + past participle (ar fi fost, ar fi putut)
- diminutives_augmentatives: -el/-ică/-uț/-uleț suffixes

C1 Grammar:
- nominalization_complex: abstract nouns from verbs/adjectives (dezvoltare, cunoaștere, importanță)
- passive_reflexive: "se" passive (se consideră, se observă, se manifestă)
- discourse_markers: în primul rând, de asemenea, cu alte cuvinte, din acest punct de vedere
- formal_register: formal/academic style markers (dumneavoastră, a binevoi, respectiv)
- presumptive_mood: "o fi", "ar fi" + gerund for speculation
- participle_agreement: past participle agreement with gender/number
- vocab_philosophy_abstract: abstract philosophical vocabulary
- vocab_science: scientific/research vocabulary

C2 Grammar:
- academic_register: academic writing conventions, scholarly tone
- literary_tenses: perfect simplu (merse, făcu, veni, zise)
- stylistic_word_order: marked/fronted word order for emphasis
- etymological_awareness: Latinate vocabulary awareness
- pragmatic_competence: register switching, pragmatic markers
- vocab_literary_criticism: literary analysis terminology
- vocab_legal_administrative: legal/administrative terminology

ALSO: Fix vague topic labels. Replace generic labels like "Complex social issues", "Abstract concepts", "Advanced political commentary" with SPECIFIC descriptors (2-4 words) that reflect the actual subject matter of the text.

ALL FEATURES:
${featureList}

B1+ FEATURES TO FOCUS ON:
${b1PlusList}

TEXTS TO ANALYZE:
${itemsList}

Return a JSON object where each key is the content item id. Each value is an object with:
- "grammar": array of ALL matching feature_keys (expect 15-25+ per item)
- "topic": a specific, descriptive topic label (2-4 words, NOT generic phrases like "Complex social issues")

Example: {"uuid-1": {"grammar": ["present_tense_a_fi", "subjunctive_sa", "relative_clauses_care", "passive_voice", "genitive_dative_case", "advanced_connectors", "nominalization_complex", "discourse_markers", "formal_register", "academic_register", "vocab_philosophy_abstract", "impersonal_constructions", "gerund_gerunziu", "conditional_present", "plural_nouns", "definite_article"], "topic": "Cioran's Nihilism"}}

Return ONLY the JSON object, no markdown code blocks, no extra text.`;
}

// ─── Main ───────────────────────────────────────────────────────────────────────
async function retag() {
  console.log(`\n🏷️  P4: Re-tag 8.0–9.5 Content${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log('─'.repeat(60));

  // Load features
  const allFeatures = await db.select().from(grammarFeatureMap);
  const validKeys = new Set(allFeatures.map(f => f.featureKey));
  console.log(`📋 Loaded ${allFeatures.length} grammar features`);

  // Load 8.0-9.5 items
  const items = await db.select().from(contentItems).where(
    and(gte(contentItems.difficultyLevel, '8.0'), lte(contentItems.difficultyLevel, '9.5'))
  );
  console.log(`📦 Found ${items.length} items at 8.0-9.5`);

  // Before stats
  let beforeTotalTags = 0;
  let beforeSparse = 0;
  for (const item of items) {
    const lf = item.languageFeatures as Record<string, unknown> | null;
    const count = ((lf?.grammar as string[]) || []).length;
    beforeTotalTags += count;
    if (count <= 5) beforeSparse++;
  }
  console.log(`\n📊 BEFORE: avg ${(beforeTotalTags / items.length).toFixed(1)} tags/item, ${beforeSparse}/${items.length} sparse (≤5 tags)`);

  // Extract text
  const itemsWithText = items.map(item => ({
    id: item.id,
    title: item.title,
    topic: item.topic,
    text: extractText(item),
    original: item,
  })).filter(i => i.text.trim().length >= 20);

  console.log(`🔍 ${itemsWithText.length} items have enough text to analyze`);

  // Batch analyze
  const featureInfos: FeatureInfo[] = allFeatures.map(f => ({
    featureKey: f.featureKey,
    featureName: f.featureName,
    cefrLevel: f.cefrLevel,
    category: f.category,
    description: f.description,
  }));

  const batches = chunk(itemsWithText, BATCH_SIZE);
  console.log(`\n🤖 Analyzing in ${batches.length} batches (${BATCH_SIZE}/batch)...\n`);

  let updated = 0;
  let topicsFixed = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`   Batch ${i + 1}/${batches.length}`);

    try {
      const prompt = buildPrompt(
        batch.map(b => ({ id: b.id, title: b.title, topic: b.topic, text: b.text })),
        featureInfos
      );

      const rawResponse = await callClaude(prompt);
      const parsed = parseJsonResponse(rawResponse);

      for (const item of batch) {
        const result = parsed[item.id];
        if (!result) {
          console.log(`      ⏭️  "${item.title}" — no result`);
          continue;
        }

        const newGrammar = (result.grammar || []).filter((k: string) => validKeys.has(k));
        const newTopic = result.topic || item.topic;

        // Merge with existing
        const existing = (item.original.languageFeatures || {}) as Record<string, unknown>;
        const existingGrammar = ((existing.grammar as string[]) || []).filter(k => validKeys.has(k));
        const mergedGrammar = [...new Set([...existingGrammar, ...newGrammar])];

        const topicChanged = newTopic !== item.topic;
        const tagsAdded = mergedGrammar.length - existingGrammar.length;

        console.log(`      ✅ "${item.title}": ${existingGrammar.length}→${mergedGrammar.length} tags (+${tagsAdded})${topicChanged ? ` | topic: "${item.topic}" → "${newTopic}"` : ''}`);

        if (!DRY_RUN) {
          const updatedFeatures = { ...existing, grammar: mergedGrammar };
          await db.update(contentItems).set({
            languageFeatures: updatedFeatures as LanguageFeatures,
            topic: newTopic,
            updatedAt: new Date(),
          }).where(eq(contentItems.id, item.id));
        }

        updated++;
        if (topicChanged) topicsFixed++;
      }
    } catch (error) {
      console.error(`      ❌ Batch ${i + 1} failed:`, error instanceof Error ? error.message : error);
    }

    if (i < batches.length - 1) await sleep(DELAY_MS);
  }

  // After stats
  if (!DRY_RUN) {
    const refreshed = await db.select().from(contentItems).where(
      and(gte(contentItems.difficultyLevel, '8.0'), lte(contentItems.difficultyLevel, '9.5'))
    );
    let afterTotalTags = 0;
    let afterSparse = 0;
    for (const item of refreshed) {
      const lf = item.languageFeatures as Record<string, unknown> | null;
      const count = ((lf?.grammar as string[]) || []).length;
      afterTotalTags += count;
      if (count <= 5) afterSparse++;
    }

    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESULTS');
    console.log('═'.repeat(60));
    console.log(`   Before: avg ${(beforeTotalTags / items.length).toFixed(1)} tags/item, ${beforeSparse} sparse`);
    console.log(`   After:  avg ${(afterTotalTags / refreshed.length).toFixed(1)} tags/item, ${afterSparse} sparse`);
    console.log(`   Items updated: ${updated}`);
    console.log(`   Topics fixed: ${topicsFixed}`);
  }

  console.log('\n🏁 P4 re-tagging complete!\n');
  process.exit(0);
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function parseJsonResponse(text: string): BatchResult {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
  const jsonText = jsonMatch ? jsonMatch[1] : text;
  try {
    return JSON.parse(jsonText.trim());
  } catch {
    const start = jsonText.indexOf('{');
    const end = jsonText.lastIndexOf('}');
    if (start !== -1 && end !== -1) return JSON.parse(jsonText.substring(start, end + 1));
    throw new Error(`Could not parse JSON: ${text.substring(0, 200)}`);
  }
}

retag();
