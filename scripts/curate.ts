#!/usr/bin/env npx tsx
/**
 * ChaosLimbă Content Curator
 *
 * TypeScript CLI for adding Romanian learning content directly to production Neon DB.
 *
 * Usage:
 *   npx tsx scripts/curate.ts add           # Interactive add
 *   npx tsx scripts/curate.ts video <url>   # Quick add YouTube
 *   npx tsx scripts/curate.ts stats         # Show library stats
 *   npx tsx scripts/curate.ts list          # List content
 *   npx tsx scripts/curate.ts batch <file>  # Bulk import from JSON
 */

import { Command } from 'commander';
import { input, select, confirm, number } from '@inquirer/prompts';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc, gte, lte, and, count, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

// Get script directory for relative paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// ============================================================================
// Schema Types (mirror of src/lib/db/schema.ts to avoid path alias issues)
// ============================================================================

type ContentType = 'video' | 'audio' | 'text';

type LanguageFeatures = {
  grammar: string[];
  vocabulary: {
    keywords: string[];
    requiredVocabSize: number;
  };
  structures: string[];
};

type SourceAttribution = {
  creator: string;
  originalUrl?: string;
  license: string;
};

interface NewContentItem {
  type: ContentType;
  title: string;
  difficultyLevel: string;
  durationSeconds: number;
  youtubeId?: string | null;
  startTime?: number | null;
  endTime?: number | null;
  audioUrl?: string | null;
  textContent?: string | null;
  textUrl?: string | null;
  languageFeatures?: LanguageFeatures | null;
  topic: string;
  sourceAttribution: SourceAttribution;
  culturalNotes?: string | null;
}

// ============================================================================
// Database Setup
// ============================================================================

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('\n  DATABASE_URL not found in .env.local');
    console.error('  Make sure your .env.local file contains:');
    console.error('  DATABASE_URL=postgres://...\n');
    process.exit(1);
  }
  const sql = neon(url);
  return drizzle(sql);
}

const db = getDb();

// Table name for raw queries (since we can't import schema with path aliases)
const TABLE = 'content_items';

// ============================================================================
// CEFR ↔ Difficulty Mapping
// ============================================================================

const CEFR_TO_DIFFICULTY: Record<string, string> = {
  'A1': '1.5',
  'A2': '2.5',
  'B1': '4.0',
  'B2': '6.0',
  'C1': '8.0',
  'C2': '9.5'
};

const DIFFICULTY_RANGES: Record<string, [number, number]> = {
  'A1': [1.0, 2.0],
  'A2': [2.0, 3.5],
  'B1': [3.5, 5.0],
  'B2': [5.0, 7.0],
  'C1': [7.0, 9.0],
  'C2': [9.0, 10.0]
};

function difficultyToLabel(diff: string | number): string {
  const d = typeof diff === 'string' ? parseFloat(diff) : diff;
  if (d <= 2.0) return 'A1';
  if (d <= 3.5) return 'A2';
  if (d <= 5.0) return 'B1';
  if (d <= 7.0) return 'B2';
  if (d <= 9.0) return 'C1';
  return 'C2';
}

// ============================================================================
// YouTube Metadata Fetcher
// ============================================================================

interface YouTubeMetadata {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
}

function extractVideoId(input: string): string | null {
  // Direct ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  // URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }

  return null;
}

async function fetchYouTubeMetadata(urlOrId: string): Promise<YouTubeMetadata | null> {
  const videoId = extractVideoId(urlOrId);
  if (!videoId) {
    console.error('  Invalid YouTube URL or ID');
    return null;
  }

  // Use oEmbed API (ToS-compliant, no API key needed)
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  try {
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      console.error(`  YouTube oEmbed failed: ${response.status}`);
      return null;
    }

    const data = await response.json() as { title: string; author_name: string; thumbnail_url: string };

    return {
      videoId,
      title: data.title,
      channelName: data.author_name,
      thumbnailUrl: data.thumbnail_url
    };
  } catch (error) {
    console.error('  Failed to fetch YouTube metadata:', error);
    return null;
  }
}

// ============================================================================
// Interactive Prompts
// ============================================================================

async function promptCEFRLevel(): Promise<string> {
  return select({
    message: 'CEFR Level:',
    choices: [
      { value: 'A1', name: 'A1 - Beginner' },
      { value: 'A2', name: 'A2 - Elementary' },
      { value: 'B1', name: 'B1 - Intermediate' },
      { value: 'B2', name: 'B2 - Upper Intermediate' },
      { value: 'C1', name: 'C1 - Advanced' },
      { value: 'C2', name: 'C2 - Mastery' }
    ]
  });
}

async function promptLanguageFeatures(): Promise<LanguageFeatures | null> {
  const addFeatures = await confirm({
    message: 'Add language features (grammar, vocabulary, structures)?',
    default: true
  });

  if (!addFeatures) return null;

  const grammarInput = await input({
    message: 'Grammar points (comma-separated, e.g., "past tense, conditionals"):',
    default: ''
  });

  const vocabInput = await input({
    message: 'Key vocabulary (comma-separated):',
    default: ''
  });

  const vocabSize = await number({
    message: 'Estimated vocab size needed (100-10000):',
    default: 500
  }) || 500;

  const structuresInput = await input({
    message: 'Sentence structures (comma-separated, e.g., "questions, commands"):',
    default: ''
  });

  return {
    grammar: grammarInput.split(',').map(s => s.trim()).filter(Boolean),
    vocabulary: {
      keywords: vocabInput.split(',').map(s => s.trim()).filter(Boolean),
      requiredVocabSize: vocabSize
    },
    structures: structuresInput.split(',').map(s => s.trim()).filter(Boolean)
  };
}

async function promptLicense(): Promise<string> {
  return select({
    message: 'Content license:',
    choices: [
      { value: 'Standard YouTube License', name: 'Standard YouTube License' },
      { value: 'Creative Commons', name: 'Creative Commons' },
      { value: 'Public Domain', name: 'Public Domain' },
      { value: 'Unknown', name: 'Unknown' }
    ]
  });
}

// ============================================================================
// Add Content Functions
// ============================================================================

async function addVideoContent(presetUrl?: string): Promise<void> {
  console.log('\n  Add YouTube Video\n');

  // Get YouTube URL/ID
  const youtubeInput = presetUrl || await input({
    message: 'YouTube URL or Video ID:',
    validate: (val) => extractVideoId(val) ? true : 'Invalid YouTube URL or ID'
  });

  // Fetch metadata
  console.log('\n  Fetching YouTube metadata...');
  const metadata = await fetchYouTubeMetadata(youtubeInput);

  if (!metadata) {
    console.error('  Could not fetch YouTube metadata. Please check the URL.\n');
    return;
  }

  console.log(`  Found: "${metadata.title}" by ${metadata.channelName}\n`);

  // Confirm or edit title
  const title = await input({
    message: 'Title:',
    default: metadata.title
  });

  // CEFR level
  const cefrLevel = await promptCEFRLevel();

  // Duration (oEmbed doesn't provide this)
  const durationSeconds = await number({
    message: 'Duration in seconds (check video for exact time):',
    default: 300,
    validate: (val) => val && val > 0 ? true : 'Must be positive'
  }) || 300;

  // Time range (optional)
  const hasTimeRange = await confirm({
    message: 'Add start/end time range (for clips)?',
    default: false
  });

  let startTime: number | null = null;
  let endTime: number | null = null;

  if (hasTimeRange) {
    startTime = await number({ message: 'Start time (seconds):', default: 0 }) || 0;
    endTime = await number({ message: 'End time (seconds):' }) || null;
  }

  // Topic
  const topic = await input({
    message: 'Topic (e.g., cooking, news, music, grammar, vlog):',
    validate: (val) => val.trim() ? true : 'Required'
  });

  // Language features
  const languageFeatures = await promptLanguageFeatures();

  // Cultural notes
  const culturalNotes = await input({
    message: 'Cultural notes (optional):',
    default: ''
  });

  // License
  const license = await promptLicense();

  // Build content item
  const contentItem: NewContentItem = {
    type: 'video',
    title,
    difficultyLevel: CEFR_TO_DIFFICULTY[cefrLevel],
    durationSeconds,
    youtubeId: metadata.videoId,
    startTime,
    endTime,
    topic: topic.trim(),
    languageFeatures,
    sourceAttribution: {
      creator: metadata.channelName,
      originalUrl: `https://www.youtube.com/watch?v=${metadata.videoId}`,
      license
    },
    culturalNotes: culturalNotes.trim() || null
  };

  // Insert into database
  await insertContent(contentItem);
}

async function addAudioContent(): Promise<void> {
  console.log('\n  Add Audio Content\n');

  const title = await input({
    message: 'Title:',
    validate: (val) => val.trim() ? true : 'Required'
  });

  const audioUrl = await input({
    message: 'Audio URL (R2, S3, or direct link):',
    validate: (val) => val.trim() ? true : 'Required'
  });

  const cefrLevel = await promptCEFRLevel();

  const durationSeconds = await number({
    message: 'Duration in seconds:',
    default: 300,
    validate: (val) => val && val > 0 ? true : 'Must be positive'
  }) || 300;

  const topic = await input({
    message: 'Topic:',
    validate: (val) => val.trim() ? true : 'Required'
  });

  const creator = await input({
    message: 'Creator/Source:',
    default: 'Unknown'
  });

  const languageFeatures = await promptLanguageFeatures();

  const culturalNotes = await input({
    message: 'Cultural notes (optional):',
    default: ''
  });

  const license = await promptLicense();

  const contentItem: NewContentItem = {
    type: 'audio',
    title: title.trim(),
    difficultyLevel: CEFR_TO_DIFFICULTY[cefrLevel],
    durationSeconds,
    audioUrl: audioUrl.trim(),
    topic: topic.trim(),
    languageFeatures,
    sourceAttribution: {
      creator: creator.trim(),
      license
    },
    culturalNotes: culturalNotes.trim() || null
  };

  await insertContent(contentItem);
}

async function addTextContent(): Promise<void> {
  console.log('\n  Add Text Content\n');

  const title = await input({
    message: 'Title:',
    validate: (val) => val.trim() ? true : 'Required'
  });

  const contentSource = await select({
    message: 'Text source:',
    choices: [
      { value: 'inline', name: 'Paste text directly' },
      { value: 'url', name: 'Link to external URL' }
    ]
  });

  let textContent: string | null = null;
  let textUrl: string | null = null;

  if (contentSource === 'inline') {
    textContent = await input({
      message: 'Paste the Romanian text (press Enter when done):',
      validate: (val) => val.trim() ? true : 'Required'
    });
  } else {
    textUrl = await input({
      message: 'Text URL:',
      validate: (val) => val.trim() ? true : 'Required'
    });
  }

  const cefrLevel = await promptCEFRLevel();

  const durationSeconds = await number({
    message: 'Estimated reading time in seconds (300 = ~5 min):',
    default: 180,
    validate: (val) => val && val > 0 ? true : 'Must be positive'
  }) || 180;

  const topic = await input({
    message: 'Topic:',
    validate: (val) => val.trim() ? true : 'Required'
  });

  const creator = await input({
    message: 'Author/Source:',
    default: 'Unknown'
  });

  const languageFeatures = await promptLanguageFeatures();

  const culturalNotes = await input({
    message: 'Cultural notes (optional):',
    default: ''
  });

  const license = await promptLicense();

  const contentItem: NewContentItem = {
    type: 'text',
    title: title.trim(),
    difficultyLevel: CEFR_TO_DIFFICULTY[cefrLevel],
    durationSeconds,
    textContent: textContent?.trim() || null,
    textUrl: textUrl?.trim() || null,
    topic: topic.trim(),
    languageFeatures,
    sourceAttribution: {
      creator: creator.trim(),
      license
    },
    culturalNotes: culturalNotes.trim() || null
  };

  await insertContent(contentItem);
}

// ============================================================================
// Database Operations
// ============================================================================

async function insertContent(item: NewContentItem): Promise<void> {
  console.log('\n  Inserting into database...');

  try {
    const result = await db.execute(sql`
      INSERT INTO content_items (
        type, title, difficulty_level, duration_seconds,
        youtube_id, start_time, end_time,
        audio_url, text_content, text_url,
        language_features, topic, source_attribution, cultural_notes
      ) VALUES (
        ${item.type},
        ${item.title},
        ${item.difficultyLevel},
        ${item.durationSeconds},
        ${item.youtubeId || null},
        ${item.startTime || null},
        ${item.endTime || null},
        ${item.audioUrl || null},
        ${item.textContent || null},
        ${item.textUrl || null},
        ${item.languageFeatures ? JSON.stringify(item.languageFeatures) : null}::jsonb,
        ${item.topic},
        ${JSON.stringify(item.sourceAttribution)}::jsonb,
        ${item.culturalNotes || null}
      )
      RETURNING id
    `);

    const id = (result.rows[0] as { id: string })?.id;
    console.log(`\n   Inserted: ${id}`);
    console.log(`  Title: ${item.title}`);
    console.log(`  Type: ${item.type} | Level: ${difficultyToLabel(item.difficultyLevel)}\n`);
  } catch (error) {
    console.error('\n  Failed to insert content:', error);
    if (error instanceof Error && error.message.includes('unique')) {
      console.error('  This content may already exist in the database.\n');
    }
  }
}

// ============================================================================
// Stats Command
// ============================================================================

async function showStats(): Promise<void> {
  console.log('\n  Content Library Statistics\n');

  try {
    // Get counts by type
    const typeStats = await db.execute(sql`
      SELECT type, COUNT(*) as count
      FROM content_items
      GROUP BY type
    `);

    // Get total duration
    const durationResult = await db.execute(sql`
      SELECT SUM(duration_seconds) as total
      FROM content_items
    `);

    // Get counts by difficulty level
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
        COUNT(*) as count
      FROM content_items
      GROUP BY 1
      ORDER BY 1
    `);

    const total = (typeStats.rows as { type: string; count: string }[])
      .reduce((sum, t) => sum + parseInt(t.count), 0);
    const totalHours = (parseInt((durationResult.rows[0] as { total: string })?.total || '0')) / 3600;

    console.log(`  Total Items: ${total}`);
    console.log(`  Total Duration: ${totalHours.toFixed(1)} hours\n`);

    console.log('  By Type:');
    for (const stat of typeStats.rows as { type: string; count: string }[]) {
      const emoji = stat.type === 'video' ? '' : stat.type === 'audio' ? '' : '';
      console.log(`    ${emoji} ${stat.type}: ${stat.count}`);
    }

    console.log('\n  By Level:');
    for (const stat of levelStats.rows as { level: string; count: string }[]) {
      console.log(`    ${stat.level}: ${stat.count}`);
    }

    console.log('');
  } catch (error) {
    console.error('  Failed to fetch stats:', error);
  }
}

// ============================================================================
// List Command
// ============================================================================

async function listContent(options: { type?: string; level?: string; limit?: string }): Promise<void> {
  const limit = parseInt(options.limit || '20');

  console.log(`\n  Content Items\n`);

  try {
    let query = sql`
      SELECT id, type, title, difficulty_level, duration_seconds, youtube_id, topic, created_at
      FROM content_items
    `;

    const conditions: ReturnType<typeof sql>[] = [];

    if (options.type) {
      conditions.push(sql`type = ${options.type}`);
    }

    if (options.level && DIFFICULTY_RANGES[options.level]) {
      const [min, max] = DIFFICULTY_RANGES[options.level];
      conditions.push(sql`difficulty_level >= ${min} AND difficulty_level <= ${max}`);
    }

    if (conditions.length > 0) {
      query = sql`
        SELECT id, type, title, difficulty_level, duration_seconds, youtube_id, topic, created_at
        FROM content_items
        WHERE ${sql.join(conditions, sql` AND `)}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else {
      query = sql`
        SELECT id, type, title, difficulty_level, duration_seconds, youtube_id, topic, created_at
        FROM content_items
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    const result = await db.execute(query);
    const items = result.rows as {
      id: string;
      type: string;
      title: string;
      difficulty_level: string;
      duration_seconds: number;
      youtube_id: string | null;
      topic: string;
      created_at: string;
    }[];

    if (items.length === 0) {
      console.log('  No content found.\n');
      return;
    }

    console.log(`  Showing ${items.length} items:\n`);

    for (const item of items) {
      const emoji = item.type === 'video' ? '' : item.type === 'audio' ? '' : '';
      const level = difficultyToLabel(item.difficulty_level);
      const duration = Math.round(item.duration_seconds / 60);

      console.log(`  ${emoji} [${level}] ${item.title}`);
      console.log(`     ID: ${item.id.slice(0, 8)}...`);
      console.log(`     Topic: ${item.topic} | ${duration} min`);

      if (item.type === 'video' && item.youtube_id) {
        console.log(`     https://youtu.be/${item.youtube_id}`);
      }
      console.log('');
    }
  } catch (error) {
    console.error('  Failed to list content:', error);
  }
}

// ============================================================================
// Batch Import
// ============================================================================

interface BatchImportItem {
  type: 'video' | 'audio' | 'text';
  youtubeUrl?: string;
  audioUrl?: string;
  textContent?: string;
  textUrl?: string;
  title?: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  durationSeconds?: number;
  topic: string;
  languageFeatures?: LanguageFeatures;
  creator?: string;
  license?: string;
  culturalNotes?: string;
}

async function batchImport(filePath: string, dryRun: boolean): Promise<void> {
  console.log(`\n  Batch Import from ${filePath}\n`);

  const fullPath = join(process.cwd(), filePath);

  if (!existsSync(fullPath)) {
    console.error(`  File not found: ${fullPath}\n`);
    process.exit(1);
  }

  const content = readFileSync(fullPath, 'utf-8');
  let items: BatchImportItem[];

  try {
    const parsed = JSON.parse(content);
    items = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    console.error('  Invalid JSON file\n');
    process.exit(1);
  }

  console.log(`  Found ${items.length} items to import\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`  [${i + 1}/${items.length}] Processing ${item.type}: ${item.title || item.youtubeUrl || 'untitled'}...`);

    try {
      const contentItem = await transformBatchItem(item);

      if (dryRun) {
        console.log(`    [DRY RUN] Would insert: ${contentItem.title}`);
      } else {
        await insertContentSilent(contentItem);
        console.log(`    Inserted`);
      }
      success++;
    } catch (error) {
      console.error(`    FAILED: ${error}`);
      failed++;
    }
  }

  console.log(`\n  Summary: ${success} success, ${failed} failed\n`);
}

async function transformBatchItem(item: BatchImportItem): Promise<NewContentItem> {
  if (!item.type || !item.level || !item.topic) {
    throw new Error('Missing required fields: type, level, topic');
  }

  const base = {
    difficultyLevel: CEFR_TO_DIFFICULTY[item.level],
    topic: item.topic,
    languageFeatures: item.languageFeatures || null,
    culturalNotes: item.culturalNotes || null
  };

  if (item.type === 'video') {
    if (!item.youtubeUrl) throw new Error('Video requires youtubeUrl');

    const metadata = await fetchYouTubeMetadata(item.youtubeUrl);
    if (!metadata) throw new Error('Could not fetch YouTube metadata');

    return {
      ...base,
      type: 'video',
      title: item.title || metadata.title,
      durationSeconds: item.durationSeconds || 300,
      youtubeId: metadata.videoId,
      sourceAttribution: {
        creator: item.creator || metadata.channelName,
        originalUrl: `https://www.youtube.com/watch?v=${metadata.videoId}`,
        license: item.license || 'Standard YouTube License'
      }
    };
  }

  if (item.type === 'audio') {
    if (!item.audioUrl) throw new Error('Audio requires audioUrl');
    if (!item.title) throw new Error('Audio requires title');

    return {
      ...base,
      type: 'audio',
      title: item.title,
      durationSeconds: item.durationSeconds || 300,
      audioUrl: item.audioUrl,
      sourceAttribution: {
        creator: item.creator || 'Unknown',
        license: item.license || 'Unknown'
      }
    };
  }

  if (item.type === 'text') {
    if (!item.textContent && !item.textUrl) throw new Error('Text requires textContent or textUrl');
    if (!item.title) throw new Error('Text requires title');

    return {
      ...base,
      type: 'text',
      title: item.title,
      durationSeconds: item.durationSeconds || 180,
      textContent: item.textContent || null,
      textUrl: item.textUrl || null,
      sourceAttribution: {
        creator: item.creator || 'Unknown',
        license: item.license || 'Unknown'
      }
    };
  }

  throw new Error(`Unknown type: ${item.type}`);
}

async function insertContentSilent(item: NewContentItem): Promise<void> {
  await db.execute(sql`
    INSERT INTO content_items (
      type, title, difficulty_level, duration_seconds,
      youtube_id, start_time, end_time,
      audio_url, text_content, text_url,
      language_features, topic, source_attribution, cultural_notes
    ) VALUES (
      ${item.type},
      ${item.title},
      ${item.difficultyLevel},
      ${item.durationSeconds},
      ${item.youtubeId || null},
      ${item.startTime || null},
      ${item.endTime || null},
      ${item.audioUrl || null},
      ${item.textContent || null},
      ${item.textUrl || null},
      ${item.languageFeatures ? JSON.stringify(item.languageFeatures) : null}::jsonb,
      ${item.topic},
      ${JSON.stringify(item.sourceAttribution)}::jsonb,
      ${item.culturalNotes || null}
    )
  `);
}

// ============================================================================
// CLI Command Structure
// ============================================================================

const program = new Command();

program
  .name('curate')
  .description('ChaosLimba Content Curator - Add Romanian learning content to production DB')
  .version('1.0.0');

// Interactive add command
program
  .command('add')
  .description('Interactively add a single content item')
  .option('-t, --type <type>', 'Content type: video, audio, text')
  .action(async (options) => {
    let type = options.type;

    if (!type) {
      type = await select({
        message: 'What type of content?',
        choices: [
          { value: 'video', name: 'YouTube Video' },
          { value: 'audio', name: 'Audio (podcast, etc.)' },
          { value: 'text', name: 'Text (article, etc.)' }
        ]
      });
    }

    if (type === 'video') {
      await addVideoContent();
    } else if (type === 'audio') {
      await addAudioContent();
    } else if (type === 'text') {
      await addTextContent();
    } else {
      console.error(`Unknown type: ${type}`);
    }
  });

// Quick add video command
program
  .command('video [url]')
  .description('Add YouTube video (opens interactive prompts)')
  .action(async (url) => {
    await addVideoContent(url);
  });

// Quick add audio command
program
  .command('audio')
  .description('Add audio content (opens interactive prompts)')
  .action(async () => {
    await addAudioContent();
  });

// Quick add text command
program
  .command('text')
  .description('Add text content (opens interactive prompts)')
  .action(async () => {
    await addTextContent();
  });

// Stats command
program
  .command('stats')
  .description('Show content library statistics')
  .action(async () => {
    await showStats();
  });

// List command
program
  .command('list')
  .description('List content items')
  .option('-t, --type <type>', 'Filter by type: video, audio, text')
  .option('-l, --level <level>', 'Filter by CEFR level: A1, A2, B1, B2, C1, C2')
  .option('-n, --limit <number>', 'Limit results', '20')
  .action(async (options) => {
    await listContent(options);
  });

// Batch import command
program
  .command('batch <file>')
  .description('Import multiple items from JSON file')
  .option('--dry-run', 'Validate without inserting')
  .action(async (file, options) => {
    await batchImport(file, options.dryRun || false);
  });

// Handle graceful exit
process.on('SIGINT', () => {
  console.log('\n\n  Operation cancelled.\n');
  process.exit(0);
});

// Parse and run
program.parse();
