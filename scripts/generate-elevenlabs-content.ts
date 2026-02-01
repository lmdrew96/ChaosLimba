// scripts/generate-elevenlabs-content.ts
// Generate A1-A2 audio content with ElevenLabs TTS API

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Create output directory for audio files
const AUDIO_OUTPUT_DIR = path.join(process.cwd(), 'generated-audio');
if (!fs.existsSync(AUDIO_OUTPUT_DIR)) {
  fs.mkdirSync(AUDIO_OUTPUT_DIR, { recursive: true });
}

type Sentence = {
  id: string;
  level: string;
  text_romanian: string;
  topic: string;
  word_count: number;
  character_count: number;
  speaker_gender: 'female' | 'male';
  voice_id: string;
  speed: number;
  estimated_duration_sec: number;
};

type WordTimestamp = {
  word: string;
  start: number;
  end: number;
};

// Parse alignment data into word timestamps
// Treats any whitespace (space, newline, tab) as a word boundary
// turnBoundaries: set of character indices where dialogue turns end (used to split merged words)
function parseAlignmentToWords(alignment: any, turnBoundaries?: Set<number>): WordTimestamp[] {
  const words: WordTimestamp[] = [];
  if (!alignment || !alignment.characters) return words;

  const chars: string[] = alignment.characters;
  const starts: number[] = alignment.character_start_times_seconds;
  const ends: number[] = alignment.character_end_times_seconds;

  let currentWord = '';
  let wordStart = 0;
  let pendingTurnBreak = false;
  // Track our position in the original text (excluding whitespace differences)
  let charIndex = 0;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const charStart = starts[i];
    const charEnd = ends[i];
    const isWhitespace = char === ' ' || char === '\n' || char === '\r' || char === '\t';
    const isLast = i === chars.length - 1;

    // Check if this character crosses a turn boundary
    const isTurnBoundary = turnBoundaries && turnBoundaries.has(charIndex) && currentWord.length > 0;

    if (char === '\n' || char === '\r') {
      pendingTurnBreak = true;
    }

    if (isWhitespace || isLast || isTurnBoundary) {
      // If we hit a turn boundary mid-word, flush the current word FIRST
      if (isTurnBoundary && !isWhitespace) {
        // Flush current word (the part before the boundary)
        if (currentWord.length > 0) {
          words.push({
            word: currentWord.trim(),
            start: wordStart,
            end: charStart,
          });
          currentWord = '';
        }
        // Insert turn break
        words.push({ word: '\n', start: charStart, end: charStart });
        pendingTurnBreak = false;
        // Start new word with current character
        currentWord = char;
        wordStart = charStart;
        charIndex++;
        continue;
      }

      // Include the last non-whitespace character
      if (isLast && !isWhitespace) {
        currentWord += char;
        charIndex++;
      }

      // Flush accumulated word
      if (currentWord.length > 0) {
        // Insert turn break marker if we saw a newline before this word
        if (pendingTurnBreak && words.length > 0) {
          const prevEnd = words[words.length - 1].end;
          words.push({ word: '\n', start: prevEnd, end: wordStart });
          pendingTurnBreak = false;
        }

        words.push({
          word: currentWord.trim(),
          start: wordStart,
          end: charEnd,
        });
        currentWord = '';
      }
      wordStart = charEnd;
      if (!isLast) charIndex++;
    } else {
      if (currentWord.length === 0) {
        wordStart = charStart;
      }
      currentWord += char;
      charIndex++;
    }
  }

  return words;
}

// Parse CSV file (handles multiline quoted fields)
function parseCSV(filePath: string): Sentence[] {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Split into records handling multiline quoted fields
  const records: string[][] = [];
  let current = '';
  let inQuotes = false;
  const fields: string[] = [];

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && content[i + 1] === '\n') i++;
      fields.push(current);
      current = '';
      if (fields.length > 1) records.push([...fields]);
      fields.length = 0;
    } else {
      current += char;
    }
  }
  if (current || fields.length > 0) {
    fields.push(current);
    if (fields.length > 1) records.push([...fields]);
  }

  // Skip header row
  return records.slice(1).map(values => ({
    id: values[0],
    level: values[1],
    text_romanian: values[2],
    topic: values[3],
    word_count: parseInt(values[4]),
    character_count: parseInt(values[5]),
    speaker_gender: values[6] as 'female' | 'male',
    voice_id: values[7],
    speed: parseFloat(values[8]),
    estimated_duration_sec: parseFloat(values[9]),
  }));
}

// Generate audio with ElevenLabs API
async function generateAudioWithTimestamps(
  text: string,
  voiceId: string
): Promise<{ audio: Buffer; words: WordTimestamp[]; duration: number } | null> {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: 0.90,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`  ❌ ElevenLabs API error: ${response.status} - ${error}`);
      return null;
    }

    const data = await response.json();

    // Decode base64 audio
    const audioBuffer = Buffer.from(data.audio_base64, 'base64');

    // Parse word timestamps from alignment data
    const words = parseAlignmentToWords(data.alignment);

    // Calculate duration from timestamps
    const duration = words.length > 0 ? words[words.length - 1].end : 0;

    return { audio: audioBuffer, words, duration };
  } catch (error: any) {
    console.error(`  ❌ Error generating audio: ${error.message}`);
    return null;
  }
}

// Dialogue voice assignments per ID: [speaker_a_voice, speaker_b_voice]
const FEMALE_VOICE_1 = 'PoHUWWWMHFrA8z7Q88pu';
const FEMALE_VOICE_2 = 'QtObtrglHRaER8xlDZsr';
const MALE_VOICE_1 = 'b4bnZ9y3ZRH0myLzE2B5';
const MALE_VOICE_2 = '8nBBDfYxYXmDNaqTCxPH';

const DIALOGUE_VOICE_MAP: Record<string, [string, string]> = {
  'A1_002': [FEMALE_VOICE_1, MALE_VOICE_1],   // Maria & Ion
  'A1_016': [FEMALE_VOICE_1, MALE_VOICE_1],   // Morning chat
  'A1_019': [MALE_VOICE_1, FEMALE_VOICE_1],   // Waiter & customer
  'A1_024': [FEMALE_VOICE_1, MALE_VOICE_1],   // Customer & vendor
  'A1_032': [FEMALE_VOICE_1, MALE_VOICE_1],   // Weather chat
  'A1_040': [FEMALE_VOICE_1, FEMALE_VOICE_2], // Two women discussing clothes
  'A1_044': [FEMALE_VOICE_1, MALE_VOICE_1],   // Train station
  'A1_050': [MALE_VOICE_1, FEMALE_VOICE_1],   // Interviewer & asistentă medicală
  'A1_052': [FEMALE_VOICE_1, MALE_VOICE_1],   // Patient & doctore
  'A2_008': [FEMALE_VOICE_1, MALE_VOICE_1],   // Restaurant
  'A2_012': [MALE_VOICE_1, FEMALE_VOICE_1],   // Waiter & customer
  'A2_027': [FEMALE_VOICE_1, MALE_VOICE_1],   // Patient & doctore
  'A2_031': [FEMALE_VOICE_1, MALE_VOICE_1],   // Asking directions
  'A2_054': [FEMALE_VOICE_1, MALE_VOICE_1],   // Market produce
  'A2_062': [FEMALE_VOICE_1, FEMALE_VOICE_2], // Daughter & mama
  'A2_063': [FEMALE_VOICE_1, MALE_VOICE_1],   // Receptionist & domnul Andrei
  'A2_064': [FEMALE_VOICE_1, FEMALE_VOICE_2], // Andreea & friend
  'A2_065': [MALE_VOICE_1, FEMALE_VOICE_1],   // Delivery guy & recipient
};
const DEFAULT_DIALOGUE_VOICES: [string, string] = [FEMALE_VOICE_1, MALE_VOICE_1];

// Check if text is a dialogue (starts with "- " and has multiple turns)
function isDialogue(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.startsWith('- ')) return false;
  const turns = trimmed.split(/\n- /).filter(t => t.trim().length > 0);
  return turns.length >= 2;
}

// Parse dialogue into turns
function parseDialogueTurns(text: string): string[] {
  return text.trim().split(/\n- /)
    .map(t => t.replace(/^- /, '').trim())
    .filter(t => t.length > 0);
}

// Generate dialogue audio with ElevenLabs text-to-dialogue API (Eleven v3)
async function generateDialogueAudio(
  text: string,
  sentenceId: string
): Promise<{ audio: Buffer; words: WordTimestamp[]; duration: number } | null> {
  try {
    const turns = parseDialogueTurns(text);
    const [voiceA, voiceB] = DIALOGUE_VOICE_MAP[sentenceId] || DEFAULT_DIALOGUE_VOICES;
    const inputs = turns.map((turn, i) => ({
      text: turn,
      voice_id: i % 2 === 0 ? voiceA : voiceB,
    }));

    const response = await fetch(
      'https://api.elevenlabs.io/v1/text-to-dialogue/with-timestamps',
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs,
          model_id: 'eleven_v3',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`  ❌ ElevenLabs Dialogue API error: ${response.status} - ${error}`);
      return null;
    }

    const data = await response.json();

    // Decode base64 audio
    const audioBuffer = Buffer.from(data.audio_base64, 'base64');

    // Parse word timestamps from alignment data
    // The dialogue API concatenates all turns' characters WITHOUT separators,
    // so we compute character offsets from the known turn texts to find boundaries.
    const turnBoundaries = new Set<number>();
    let offset = 0;
    for (let t = 0; t < turns.length - 1; t++) {
      offset += turns[t].length;
      turnBoundaries.add(offset);
    }

    const words = parseAlignmentToWords(data.alignment, turnBoundaries);

    // Duration from last timestamp
    const duration = words.length > 0 ? words[words.length - 1].end : 0;

    return { audio: audioBuffer, words, duration };
  } catch (error: any) {
    console.error(`  ❌ Error generating dialogue: ${error.message}`);
    return null;
  }
}

// Save audio locally (we'll upload to R2 separately)
async function saveAudioLocally(
  audioBuffer: Buffer,
  filename: string
): Promise<string> {
  const filepath = path.join(AUDIO_OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, audioBuffer);

  // Return the R2 URL where it WILL be uploaded
  return `${process.env.R2_PUBLIC_URL}/elevenlabs/${filename}`;
}

// Convert CEFR level to numeric difficulty
function levelToDifficulty(level: string): string {
  const map: { [key: string]: string } = {
    A1: '1.5',
    A2: '2.5',
    B1: '3.5',
    B2: '4.5',
    C1: '5.5',
  };
  return map[level] || '3.0';
}

// Re-generate word timestamps for dialogue content already in the database
// --regen-timestamps: calls ElevenLabs API to regenerate
// --fix-dialogues: fixes existing data in-place using turn text to split merged words (no API calls)
async function regenDialogueTimestamps() {
  const { eq } = await import('drizzle-orm');

  console.log('🔄 Re-generating dialogue timestamps...\n');

  const csvPath = path.join(process.cwd(), 'romanian_month1_124k.csv');
  const sentences = parseCSV(csvPath).filter(s => isDialogue(s.text_romanian));
  console.log(`Found ${sentences.length} dialogues in CSV\n`);

  let updated = 0;
  let failed = 0;

  for (const sentence of sentences) {
    console.log(`[${updated + failed + 1}/${sentences.length}] ${sentence.id}: ${sentence.text_romanian.substring(0, 50)}...`);

    const result = await generateDialogueAudio(sentence.text_romanian, sentence.id);
    if (!result) {
      console.log('   ⏭️  Skipped (API failed)');
      failed++;
      continue;
    }

    const r2Url = `${process.env.R2_PUBLIC_URL}/elevenlabs/sentence_${sentence.id}.mp3`;
    try {
      await db.update(schema.contentItems)
        .set({
          languageFeatures: { wordTimestamps: result.words } as any,
          durationSeconds: Math.ceil(result.duration),
          updatedAt: new Date(),
        })
        .where(eq(schema.contentItems.audioUrl, r2Url));

      console.log(`   ✅ Updated (${result.words.length} words, ${result.duration.toFixed(1)}s)`);
      updated++;
    } catch (error: any) {
      console.error(`   ❌ DB update error: ${error.message}`);
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Updated: ${updated}`);
  console.log(`❌ Failed: ${failed}`);
}

// Fix dialogue timestamps in-place using existing DB data (no API calls needed)
// Splits merged words at turn boundaries using the known turn text lengths
async function fixDialogueTimestamps() {
  const { eq } = await import('drizzle-orm');

  console.log('🔧 Fixing dialogue timestamps in-place (no API calls)...\n');

  const csvPath = path.join(process.cwd(), 'romanian_month1_124k.csv');
  const sentences = parseCSV(csvPath).filter(s => isDialogue(s.text_romanian));
  console.log(`Found ${sentences.length} dialogues in CSV\n`);

  let updated = 0;
  let failed = 0;

  for (const sentence of sentences) {
    const r2Url = `${process.env.R2_PUBLIC_URL}/elevenlabs/sentence_${sentence.id}.mp3`;

    // Fetch existing row
    const rows = await db.select().from(schema.contentItems)
      .where(eq(schema.contentItems.audioUrl, r2Url));

    if (rows.length === 0) {
      console.log(`[${updated + failed + 1}/${sentences.length}] ${sentence.id}: ⏭️  Not found in DB`);
      failed++;
      continue;
    }

    const row = rows[0];
    const features = row.languageFeatures as any;
    const existingWords: WordTimestamp[] = features?.wordTimestamps || [];

    if (existingWords.length === 0) {
      console.log(`[${updated + failed + 1}/${sentences.length}] ${sentence.id}: ⏭️  No timestamps`);
      failed++;
      continue;
    }

    // Get the turn texts (without "- " prefix)
    const turns = parseDialogueTurns(sentence.text_romanian);

    // Compute turn boundary positions in the concatenated text
    // The dialogue API concatenates all turn texts without separators
    const turnEndPositions: number[] = [];
    let pos = 0;
    for (let t = 0; t < turns.length - 1; t++) {
      pos += turns[t].length;
      turnEndPositions.push(pos);
    }

    // Walk through existing words and figure out character position
    // to detect which words span turn boundaries
    const fixedWords: WordTimestamp[] = [];
    let charPos = 0;

    for (const w of existingWords) {
      // Skip existing \n markers from previous fix attempts
      if (w.word === '\n') continue;

      const wordText = w.word;
      const wordEnd = charPos + wordText.length;

      // Check if any turn boundary falls within this word
      let splitAt = -1;
      for (const boundary of turnEndPositions) {
        if (boundary > charPos && boundary < wordEnd) {
          splitAt = boundary - charPos;
          break;
        }
      }

      if (splitAt > 0) {
        // Split word at the turn boundary
        const part1 = wordText.substring(0, splitAt);
        const part2 = wordText.substring(splitAt);

        // Interpolate the split time based on character position ratio
        const ratio = splitAt / wordText.length;
        const splitTime = w.start + (w.end - w.start) * ratio;

        if (part1.trim().length > 0) {
          fixedWords.push({ word: part1.trim(), start: w.start, end: splitTime });
        }
        // Turn break marker
        fixedWords.push({ word: '\n', start: splitTime, end: splitTime });
        if (part2.trim().length > 0) {
          fixedWords.push({ word: part2.trim(), start: splitTime, end: w.end });
        }
      } else {
        fixedWords.push(w);
      }

      // Advance character position (word length + 1 for space)
      charPos = wordEnd + 1;
    }

    // Count turn breaks inserted
    const breaks = fixedWords.filter(w => w.word === '\n').length;

    try {
      await db.update(schema.contentItems)
        .set({
          languageFeatures: { wordTimestamps: fixedWords } as any,
          updatedAt: new Date(),
        })
        .where(eq(schema.contentItems.audioUrl, r2Url));

      console.log(`[${updated + failed + 1}/${sentences.length}] ${sentence.id}: ✅ Fixed (${existingWords.length} → ${fixedWords.length} words, ${breaks} turn breaks)`);
      updated++;
    } catch (error: any) {
      console.error(`[${updated + failed + 1}/${sentences.length}] ${sentence.id}: ❌ ${error.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Fixed: ${updated}`);
  console.log(`❌ Failed: ${failed}`);
}

async function main() {
  const regenTimestamps = process.argv.includes('--regen-timestamps');
  if (regenTimestamps) {
    return regenDialogueTimestamps();
  }

  const fixDialogues = process.argv.includes('--fix-dialogues');
  if (fixDialogues) {
    return fixDialogueTimestamps();
  }

  const dialoguesOnly = process.argv.includes('--dialogues-only');
  const limit = dialoguesOnly
    ? Infinity
    : (process.argv[2] ? parseInt(process.argv[2]) : 5);

  console.log('🎤 ElevenLabs Content Generation\n');

  // Parse CSV
  const csvPath = path.join(process.cwd(), 'romanian_month1_124k.csv');
  let sentences = parseCSV(csvPath);

  if (dialoguesOnly) {
    sentences = sentences.filter(s => isDialogue(s.text_romanian));
    console.log(`🗣️ Dialogues-only mode: ${sentences.length} dialogues found\n`);
  } else {
    sentences = sentences.slice(0, limit);
    console.log(`📊 Processing ${sentences.length} sentences...\n`);
  }

  console.log(`✅ Loaded ${sentences.length} sentences from CSV\n`);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const sentence of sentences) {
    processed++;
    console.log(`\n[${processed}/${sentences.length}] ${sentence.text_romanian.substring(0, 60)}...`);
    const dialogue = isDialogue(sentence.text_romanian);
    console.log(`   Level: ${sentence.level} | Topic: ${sentence.topic} | ${dialogue ? '🗣️ Dialogue' : `Voice: ${sentence.speaker_gender}`}`);

    // Route to appropriate API
    const result = dialogue
      ? await generateDialogueAudio(sentence.text_romanian, sentence.id)
      : await generateAudioWithTimestamps(sentence.text_romanian, sentence.voice_id);

    if (!result) {
      console.log('   ⏭️  Skipped (generation failed)');
      failed++;
      continue;
    }

    const { audio, words, duration } = result;

    // Save locally (upload to R2 later)
    const filename = `sentence_${sentence.id}.mp3`;
    try {
      const r2Url = await saveAudioLocally(audio, filename);
      console.log(`   ✅ Saved locally: ${filename}`);

      // Insert into contentItems
      await db.insert(schema.contentItems).values({
        type: 'audio',
        title: sentence.text_romanian.substring(0, 100),
        difficultyLevel: levelToDifficulty(sentence.level),
        durationSeconds: Math.ceil(duration),
        audioUrl: r2Url,
        transcript: sentence.text_romanian,
        transcriptSource: 'elevenlabs_generated',
        transcriptLanguage: 'ro',
        languageFeatures: {
          wordTimestamps: words,
        } as any,
        topic: sentence.topic.replace(/_/g, ' '),
        sourceAttribution: {
          creator: 'ElevenLabs TTS',
          license: 'Generated',
        },
        culturalNotes: null,
      });

      console.log(`   ✅ Inserted to database (${words.length} words, ${duration.toFixed(1)}s)`);
      succeeded++;
    } catch (error: any) {
      console.error(`   ❌ Upload/DB error: ${error.message}`);
      failed++;
    }

    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n🎉 Generation Complete!\n');
  console.log(`   ✅ Succeeded: ${succeeded}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${processed}`);

  // Calculate character usage
  const totalChars = sentences.reduce((sum, s) => sum + s.text_romanian.length, 0);
  console.log(`\n💰 Character usage: ${totalChars.toLocaleString()} chars`);
}

main().catch(console.error);
