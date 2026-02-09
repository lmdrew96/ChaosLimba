#!/usr/bin/env npx tsx
/**
 * ChaosLimbă AI Content Generator
 *
 * Generates Romanian learning content using AI + Google TTS
 *
 * Usage:
 *   npx tsx scripts/generate-content.ts generate --level B1 --topic "Romanian holidays"
 *   npx tsx scripts/generate-content.ts batch --level B2 --theme "daily life" --count 5
 *   npx tsx scripts/generate-content.ts topics                    # Show topic ideas
 *   npx tsx scripts/generate-content.ts stats                     # Show content stats
 */

import { Command } from 'commander';
import { select, confirm, input } from '@inquirer/prompts';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createHash } from 'crypto';

// Get script directory for relative paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// ============================================================================
// Types
// ============================================================================

type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

interface GeneratedContent {
  title: string;
  text: string;
  topic: string;
  level: CEFRLevel;
  grammarFeatures: string[];
  vocabularyKeywords: string[];
  culturalNotes?: string;
}

interface ContentResult {
  id: string;
  title: string;
  audioUrl?: string;
  durationSeconds: number;
  characterCount: number;
  estimatedCost: number;
  type: 'audio' | 'text';
}

// ============================================================================
// Configuration
// ============================================================================

const CEFR_TO_DIFFICULTY: Record<CEFRLevel, string> = {
  'A1': '1.5',
  'A2': '2.5',
  'B1': '4.0',
  'B2': '6.0',
  'C1': '8.0',
  'C2': '9.5'
};

// Word count targets by level (for ~2-3 min audio each)
const WORD_COUNT_TARGETS: Record<CEFRLevel, { min: number; max: number }> = {
  'A1': { min: 80, max: 120 },
  'A2': { min: 120, max: 180 },
  'B1': { min: 200, max: 300 },
  'B2': { min: 300, max: 450 },
  'C1': { min: 400, max: 600 },
  'C2': { min: 500, max: 750 },
};

const TOPIC_SUGGESTIONS: Record<CEFRLevel, string[]> = {
  'A1': [
    'Introducing yourself', 'Family members', 'Colors and numbers',
    'Days of the week', 'Food and drinks', 'At the market',
    'Simple greetings', 'My house', 'Weather basics'
  ],
  'A2': [
    'Daily routine', 'Shopping for clothes', 'At the restaurant',
    'Asking for directions', 'Hobbies and free time', 'Public transport',
    'Making appointments', 'Describing people', 'Weekend plans'
  ],
  'B1': [
    'Romanian holidays and traditions', 'Job interview basics',
    'Health and visiting the doctor', 'Travel experiences',
    'Environmental issues', 'Technology in daily life',
    'Education system', 'Sports and fitness', 'Cultural differences'
  ],
  'B2': [
    'Romanian history highlights', 'Current events discussion',
    'Business and economy', 'Art and literature',
    'Social media impact', 'Urban vs rural life',
    'Immigration and society', 'Science and innovation', 'Politics basics'
  ],
  'C1': [
    'Romanian philosophy and thinkers', 'Complex social issues',
    'Literary analysis', 'Economic policies', 'Historical debates',
    'Media and journalism ethics', 'Environmental policy',
    'Globalization effects', 'Cultural identity'
  ],
  'C2': [
    'Romanian literary classics analysis', 'Philosophical discourse',
    'Sociolinguistic phenomena', 'Advanced political commentary',
    'Academic research topics', 'Cultural criticism',
    'Historical revisionism debates', 'Abstract concepts'
  ],
};

// ============================================================================
// Database Setup
// ============================================================================

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('\n❌ DATABASE_URL not found in .env.local\n');
    process.exit(1);
  }
  return drizzle(neon(url));
}

// ============================================================================
// Groq AI Text Generation
// ============================================================================

async function generateRomanianText(
  level: CEFRLevel,
  topic: string,
  additionalInstructions?: string
): Promise<GeneratedContent> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not set in .env.local');
  }

  const wordTarget = WORD_COUNT_TARGETS[level];

  const systemPrompt = `You are a Romanian language content creator for language learners.
Generate authentic, natural Romanian text appropriate for CEFR level ${level}.

Guidelines for ${level}:
${getLevelGuidelines(level)}

IMPORTANT:
- Write ONLY in Romanian (no English translations)
- Use natural, conversational Romanian
- Include cultural context where appropriate
- Target ${wordTarget.min}-${wordTarget.max} words
- Make it engaging and educational`;

  const userPrompt = `Create a Romanian text about: "${topic}"

${additionalInstructions || ''}

Return JSON:
{
  "title": "Catchy Romanian title",
  "text": "The full Romanian text (${wordTarget.min}-${wordTarget.max} words)",
  "grammarFeatures": ["grammar point 1", "grammar point 2"],
  "vocabularyKeywords": ["key word 1", "key word 2", ...],
  "culturalNotes": "Brief cultural context in English (optional)"
}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  try {
    const parsed = JSON.parse(content);
    return {
      title: parsed.title,
      text: parsed.text,
      topic,
      level,
      grammarFeatures: parsed.grammarFeatures || [],
      vocabularyKeywords: parsed.vocabularyKeywords || [],
      culturalNotes: parsed.culturalNotes,
    };
  } catch {
    throw new Error('Failed to parse AI response as JSON');
  }
}

function getLevelGuidelines(level: CEFRLevel): string {
  const guidelines: Record<CEFRLevel, string> = {
    'A1': `- Use only present tense
- Simple sentence structures (Subject + Verb + Object)
- Basic vocabulary (family, food, colors, numbers)
- Short sentences (5-8 words)
- Common verbs: a fi, a avea, a merge, a vrea`,
    'A2': `- Present and past tense (perfect compus)
- Simple connectors (și, dar, pentru că)
- Everyday vocabulary
- Can use basic questions
- Sentences up to 10-12 words`,
    'B1': `- All common tenses including future
- Conditional sentences (simple)
- Opinion expressions (cred că, mi se pare)
- Abstract vocabulary emerging
- Complex sentences with subordinate clauses`,
    'B2': `- Subjunctive mood
- Passive constructions
- Idiomatic expressions
- Nuanced vocabulary
- Longer, more complex paragraph structures`,
    'C1': `- All grammatical structures
- Sophisticated connectors
- Academic and professional vocabulary
- Rhetorical devices
- Nuanced argumentation`,
    'C2': `- Native-like complexity
- Literary and archaic forms acceptable
- Highly specialized vocabulary
- Complex nested clauses
- Stylistic variation`,
  };
  return guidelines[level];
}

// ============================================================================
// Google TTS Audio Generation
// ============================================================================

async function generateAudio(
  text: string,
  outputKey: string
): Promise<{ url: string; characterCount: number; estimatedCost: number }> {
  // Import dynamically to handle missing credentials gracefully
  const { TextToSpeechClient } = await import('@google-cloud/text-to-speech');
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  // Check credentials
  let ttsClient: InstanceType<typeof TextToSpeechClient>;
  if (process.env.GOOGLE_TTS_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_TTS_CREDENTIALS_JSON);
    ttsClient = new TextToSpeechClient({ credentials });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    ttsClient = new TextToSpeechClient();
  } else {
    throw new Error('Google TTS credentials not configured');
  }

  // Generate audio
  const [response] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: { languageCode: 'ro-RO', name: 'ro-RO-Wavenet-A' },
    audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95 },
  });

  if (!response.audioContent) {
    throw new Error('TTS returned empty audio');
  }

  const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
  const characterCount = text.length;
  const estimatedCost = characterCount * 0.000016;

  // Upload to R2
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: outputKey,
    Body: audioBuffer,
    ContentType: 'audio/mpeg',
  }));

  const url = `${process.env.R2_PUBLIC_URL}/${outputKey}`;

  return { url, characterCount, estimatedCost };
}

// ============================================================================
// Database Insert
// ============================================================================

async function insertContent(
  content: GeneratedContent,
  audioUrl: string,
  durationSeconds: number
): Promise<string> {
  const db = getDb();

  const result = await db.execute(sql`
    INSERT INTO content_items (
      type, title, difficulty_level, duration_seconds,
      audio_url, text_content,
      language_features, topic, source_attribution, cultural_notes
    ) VALUES (
      'audio',
      ${content.title},
      ${CEFR_TO_DIFFICULTY[content.level]},
      ${durationSeconds},
      ${audioUrl},
      ${content.text},
      ${JSON.stringify({
        grammar: content.grammarFeatures,
        vocabulary: {
          keywords: content.vocabularyKeywords,
          requiredVocabSize: content.level === 'A1' ? 200 : content.level === 'A2' ? 500 : 1000,
        },
        structures: [],
      })}::jsonb,
      ${content.topic},
      ${JSON.stringify({
        creator: 'AI Generated (Llama 3.3 70B + Google TTS)',
        license: 'ChaosLimbă Internal',
      })}::jsonb,
      ${content.culturalNotes || null}
    )
    RETURNING id
  `);

  return (result.rows[0] as { id: string }).id;
}

async function insertTextContent(
  content: GeneratedContent,
  durationSeconds: number
): Promise<string> {
  const db = getDb();

  const result = await db.execute(sql`
    INSERT INTO content_items (
      type, title, difficulty_level, duration_seconds,
      text_content,
      language_features, topic, source_attribution, cultural_notes
    ) VALUES (
      'text',
      ${content.title},
      ${CEFR_TO_DIFFICULTY[content.level]},
      ${durationSeconds},
      ${content.text},
      ${JSON.stringify({
        grammar: content.grammarFeatures,
        vocabulary: {
          keywords: content.vocabularyKeywords,
          requiredVocabSize: content.level === 'A1' ? 200 : content.level === 'A2' ? 500 : 1000,
        },
        structures: [],
      })}::jsonb,
      ${content.topic},
      ${JSON.stringify({
        creator: 'AI Generated (Llama 3.3 70B)',
        license: 'ChaosLimbă Internal',
      })}::jsonb,
      ${content.culturalNotes || null}
    )
    RETURNING id
  `);

  return (result.rows[0] as { id: string }).id;
}

// ============================================================================
// Utility Functions
// ============================================================================

function shortHash(text: string): string {
  return createHash('md5').update(text).digest('hex').slice(0, 8);
}

function estimateDuration(text: string, type: 'audio' | 'text' = 'audio'): number {
  const words = text.split(/\s+/).length;
  if (type === 'text') {
    // Reading speed for L2 learners: ~100 words per minute (slower than native)
    return Math.round((words / 100) * 60);
  }
  // Romanian speech ~150 words per minute at normal speed
  // With 0.95 speaking rate, slightly slower
  return Math.round((words / 140) * 60);
}

async function showStats(): Promise<void> {
  const db = getDb();

  console.log('\n📊 Content Library Statistics\n');

  const typeStats = await db.execute(sql`
    SELECT type, COUNT(*) as count FROM content_items GROUP BY type
  `);

  const durationResult = await db.execute(sql`
    SELECT SUM(duration_seconds) as total FROM content_items
  `);

  const levelStats = await db.execute(sql`
    SELECT
      CASE
        WHEN difficulty_level <= 2.0 THEN 'A1'
        WHEN difficulty_level <= 3.5 THEN 'A2'
        WHEN difficulty_level <= 5.0 THEN 'B1'
        WHEN difficulty_level <= 7.0 THEN 'B2'
        WHEN difficulty_level <= 9.0 THEN 'C1'
        ELSE 'C2'
      END as level,
      COUNT(*) as count,
      ROUND(SUM(duration_seconds) / 3600.0, 2) as hours
    FROM content_items
    GROUP BY 1
    ORDER BY 1
  `);

  const total = (typeStats.rows as any[]).reduce((sum, t) => sum + parseInt(t.count), 0);
  const totalHours = parseInt((durationResult.rows[0] as any)?.total || '0') / 3600;

  console.log(`  Total Items: ${total}`);
  console.log(`  Total Duration: ${totalHours.toFixed(1)} hours / 50 hours target (${Math.round(totalHours/50*100)}%)\n`);

  console.log('  By Type:');
  for (const stat of typeStats.rows as any[]) {
    console.log(`    ${stat.type}: ${stat.count}`);
  }

  console.log('\n  By Level:');
  console.log('  Level | Items | Hours');
  console.log('  ------|-------|------');
  for (const stat of levelStats.rows as any[]) {
    const bar = '█'.repeat(Math.min(20, Math.round(parseFloat(stat.hours) * 2)));
    console.log(`  ${stat.level}    | ${String(stat.count).padStart(5)} | ${stat.hours}h ${bar}`);
  }
  console.log('');
}

// ============================================================================
// Main Generation Function
// ============================================================================

async function generateSingleContent(
  level: CEFRLevel,
  topic: string,
  skipConfirm: boolean = false,
  textOnly: boolean = false
): Promise<ContentResult> {
  const mode = textOnly ? 'text' : 'audio';
  console.log(`\n🎯 Generating ${level} ${mode} content about "${topic}"...\n`);

  // Step 1: Generate text
  console.log('  1️⃣  Generating Romanian text with AI...');
  const content = await generateRomanianText(level, topic);
  console.log(`     ✓ Title: "${content.title}"`);
  console.log(`     ✓ Words: ${content.text.split(/\s+/).length}`);

  // Show preview
  const preview = content.text.slice(0, 200) + (content.text.length > 200 ? '...' : '');
  console.log(`\n     Preview: "${preview}"\n`);

  if (!skipConfirm) {
    const proceed = await confirm({
      message: textOnly ? 'Save text content to database?' : 'Generate audio and save to database?',
      default: true,
    });
    if (!proceed) {
      console.log('  ⏭️  Skipped\n');
      throw new Error('User cancelled');
    }
  }

  const durationSeconds = estimateDuration(content.text, mode);

  if (textOnly) {
    // Text-only: skip TTS, save directly
    console.log('  2️⃣  Saving text content to database...');
    const id = await insertTextContent(content, durationSeconds);
    console.log(`     ✓ ID: ${id}`);
    console.log(`     ✓ Cost: $0.00 (text only, no TTS)`);

    console.log(`\n✅ Text content created successfully!\n`);

    return {
      id,
      title: content.title,
      durationSeconds,
      characterCount: content.text.length,
      estimatedCost: 0,
      type: 'text',
    };
  }

  // Step 2: Generate audio
  console.log('  2️⃣  Generating audio with Google TTS...');
  const audioKey = `content/generated/${level.toLowerCase()}/${Date.now()}-${shortHash(content.title)}.mp3`;
  const audio = await generateAudio(content.text, audioKey);
  console.log(`     ✓ Audio URL: ${audio.url}`);
  console.log(`     ✓ Cost: $${audio.estimatedCost.toFixed(4)}`);

  // Step 3: Save to database
  console.log('  3️⃣  Saving to database...');
  const id = await insertContent(content, audio.url, durationSeconds);
  console.log(`     ✓ ID: ${id}`);

  console.log(`\n✅ Content created successfully!\n`);

  return {
    id,
    title: content.title,
    audioUrl: audio.url,
    durationSeconds,
    characterCount: audio.characterCount,
    estimatedCost: audio.estimatedCost,
    type: 'audio',
  };
}

// ============================================================================
// CLI Commands
// ============================================================================

const program = new Command();

program
  .name('generate-content')
  .description('ChaosLimbă AI Content Generator - Create Romanian learning content')
  .version('1.0.0');

// Generate single content
program
  .command('generate')
  .description('Generate a single piece of content')
  .option('-l, --level <level>', 'CEFR level (A1, A2, B1, B2, C1, C2)')
  .option('-t, --topic <topic>', 'Content topic')
  .option('-y, --yes', 'Skip confirmation prompts')
  .option('--text-only', 'Generate text content only (no audio/TTS)')
  .action(async (options) => {
    let level = options.level?.toUpperCase() as CEFRLevel;
    let topic = options.topic;

    if (!level) {
      level = await select({
        message: 'Select CEFR level:',
        choices: [
          { value: 'A1', name: 'A1 - Beginner' },
          { value: 'A2', name: 'A2 - Elementary' },
          { value: 'B1', name: 'B1 - Intermediate' },
          { value: 'B2', name: 'B2 - Upper Intermediate' },
          { value: 'C1', name: 'C1 - Advanced' },
          { value: 'C2', name: 'C2 - Mastery' },
        ],
      }) as CEFRLevel;
    }

    if (!topic) {
      const suggestions = TOPIC_SUGGESTIONS[level];
      const useCustom = await confirm({
        message: 'Enter custom topic? (No = choose from suggestions)',
        default: false,
      });

      if (useCustom) {
        topic = await input({ message: 'Enter topic:' });
      } else {
        topic = await select({
          message: 'Select topic:',
          choices: suggestions.map(t => ({ value: t, name: t })),
        });
      }
    }

    try {
      await generateSingleContent(level, topic, options.yes, options.textOnly);
    } catch (error: any) {
      if (error.message !== 'User cancelled') {
        console.error('\n❌ Error:', error.message, '\n');
      }
    }
  });

// Batch generate content
program
  .command('batch')
  .description('Generate multiple pieces of content')
  .requiredOption('-l, --level <level>', 'CEFR level (A1, A2, B1, B2, C1, C2)')
  .requiredOption('-c, --count <number>', 'Number of items to generate')
  .option('-t, --theme <theme>', 'General theme for all content')
  .option('--text-only', 'Generate text content only (no audio/TTS)')
  .option('--dry-run', 'Preview without generating')
  .action(async (options) => {
    const level = options.level.toUpperCase() as CEFRLevel;
    const count = parseInt(options.count);
    const theme = options.theme;
    const textOnly = options.textOnly;
    const dryRun = options.dryRun;

    if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) {
      console.error('Invalid level. Use A1, A2, B1, B2, C1, or C2');
      return;
    }

    console.log(`\n🚀 Batch generating ${count} ${level} ${textOnly ? 'text' : 'audio'} content items`);
    if (theme) console.log(`   Theme: "${theme}"`);
    if (textOnly) console.log('   Mode: TEXT ONLY (no TTS, $0 cost)');
    if (dryRun) console.log('   [DRY RUN - no actual generation]\n');

    const topics = TOPIC_SUGGESTIONS[level];
    let totalCost = 0;
    let successCount = 0;

    for (let i = 0; i < count; i++) {
      // Rotate through topics, adding theme variation
      const baseTopic = topics[i % topics.length];
      const topic = theme ? `${baseTopic} (${theme})` : baseTopic;

      console.log(`\n[${i + 1}/${count}] ${topic}`);

      if (dryRun) {
        console.log('  Would generate content here...');
        continue;
      }

      try {
        const result = await generateSingleContent(level, topic, true, textOnly);
        totalCost += result.estimatedCost;
        successCount++;

        // Small delay to avoid rate limits
        if (i < count - 1) {
          console.log('  ⏳ Waiting 2s before next...');
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (error: any) {
        console.error(`  ❌ Failed: ${error.message}`);
      }
    }

    console.log(`\n📊 Batch Summary:`);
    console.log(`   Success: ${successCount}/${count}`);
    console.log(`   Total TTS Cost: $${totalCost.toFixed(4)}`);
    console.log('');
  });

// Show topic suggestions
program
  .command('topics')
  .description('Show topic suggestions by level')
  .option('-l, --level <level>', 'Filter by CEFR level')
  .action((options) => {
    console.log('\n📝 Topic Suggestions by Level\n');

    const levels = options.level
      ? [options.level.toUpperCase() as CEFRLevel]
      : (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CEFRLevel[]);

    for (const level of levels) {
      console.log(`  ${level}:`);
      for (const topic of TOPIC_SUGGESTIONS[level]) {
        console.log(`    • ${topic}`);
      }
      console.log('');
    }
  });

// Show stats
program
  .command('stats')
  .description('Show content library statistics')
  .action(showStats);

// Handle graceful exit
process.on('SIGINT', () => {
  console.log('\n\n  Operation cancelled.\n');
  process.exit(0);
});

program.parse();
