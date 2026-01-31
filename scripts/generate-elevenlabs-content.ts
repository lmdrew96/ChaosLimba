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
  speaker_gender: 'female' | 'male' | 'neutral';
};

// Romanian voice IDs
const VOICES = {
  female: 'gCte8DU5EgI3W1KcuLSA', // Romanian Female
  male: 'b4bnZ9y3ZRH0myLzE2B5',   // Romanian Male
  neutral: 'gCte8DU5EgI3W1KcuLSA' // Use female for neutral (educational consistency)
};

type WordTimestamp = {
  word: string;
  start: number;
  end: number;
};

// Parse CSV file
function parseCSV(filePath: string): Sentence[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    // Handle quoted fields with commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Push last value

    return {
      id: values[0],
      level: values[1],
      text_romanian: values[2].replace(/^"|"$/g, ''), // Remove quotes
      topic: values[3],
      word_count: parseInt(values[4]),
      speaker_gender: (values[5] || 'neutral') as 'female' | 'male' | 'neutral'
    };
  });
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

    // Parse word timestamps from alignment data
    const words: WordTimestamp[] = [];
    if (data.alignment && data.alignment.characters) {
      let currentWord = '';
      let wordStart = 0;

      for (let i = 0; i < data.alignment.characters.length; i++) {
        const char = data.alignment.characters[i];
        const charStart = data.alignment.character_start_times_seconds[i];
        const charEnd = data.alignment.character_end_times_seconds[i];

        if (char === ' ' || i === data.alignment.characters.length - 1) {
          if (i === data.alignment.characters.length - 1 && char !== ' ') {
            currentWord += char;
          }

          if (currentWord.length > 0) {
            words.push({
              word: currentWord.trim(),
              start: wordStart,
              end: charEnd,
            });
            currentWord = '';
          }
          wordStart = charEnd;
        } else {
          if (currentWord.length === 0) {
            wordStart = charStart;
          }
          currentWord += char;
        }
      }
    }

    // Decode base64 audio
    const audioBuffer = Buffer.from(data.audio_base64, 'base64');

    // Calculate duration from timestamps
    const duration = words.length > 0 ? words[words.length - 1].end : 0;

    return { audio: audioBuffer, words, duration };
  } catch (error: any) {
    console.error(`  ❌ Error generating audio: ${error.message}`);
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
  };
  return map[level] || '2.0';
}

async function main() {
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 5; // Default 5 for testing

  console.log('🎤 ElevenLabs Content Generation\n');
  console.log(`📊 Processing ${limit} sentences...\n`);

  // Parse CSV
  const csvPath = path.join(process.cwd(), 'content', 'sentences.csv');
  const sentences = parseCSV(csvPath).slice(0, limit);

  console.log(`✅ Loaded ${sentences.length} sentences from CSV\n`);

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const sentence of sentences) {
    processed++;
    console.log(`\n[${processed}/${sentences.length}] ${sentence.text_romanian.substring(0, 60)}...`);
    console.log(`   Level: ${sentence.level} | Topic: ${sentence.topic} | Voice: ${sentence.speaker_gender}`);

    // Select voice based on gender
    const voiceId = VOICES[sentence.speaker_gender];

    // Generate audio with timestamps
    const result = await generateAudioWithTimestamps(sentence.text_romanian, voiceId);

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
  console.log(`\n💰 Character usage: ${totalChars} / 30,000 monthly quota`);
}

main().catch(console.error);
