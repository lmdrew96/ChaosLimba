// scripts/generate-podcast-audio.ts
// Batch processor: generate Romanian podcast audio via Google Cloud TTS, upload to R2

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Use relative imports (scripts run via tsx, not Next.js)
import textToSpeech from '@google-cloud/text-to-speech';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// ── Types ──────────────────────────────────────────────────

interface PodcastItem {
  id: string;
  title: string;
  script: string;
}

// ── Config ─────────────────────────────────────────────────

const COST_PER_CHAR = 0.000016;
const AUDIO_OUTPUT_DIR = path.join(process.cwd(), 'audio-output');
const VOICE_NAME = 'ro-RO-Wavenet-A'; // female
const SPEAKING_RATE = 0.95;
const DELAY_MS = 200;

// ── Clients (lazy init) ────────────────────────────────────

let ttsClient: textToSpeech.TextToSpeechClient | null = null;

function getTTSClient(): textToSpeech.TextToSpeechClient {
  if (ttsClient) return ttsClient;

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set in .env.local');
  }
  ttsClient = new textToSpeech.TextToSpeechClient();
  return ttsClient;
}

function getS3Client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured in .env.local');
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

// ── Core functions ─────────────────────────────────────────

async function generateAudio(text: string): Promise<Buffer> {
  const client = getTTSClient();

  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: { languageCode: 'ro-RO', name: VOICE_NAME },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: SPEAKING_RATE,
      pitch: 0.0,
    },
  });

  if (!response.audioContent) {
    throw new Error('Google Cloud TTS returned empty audio');
  }

  return Buffer.from(response.audioContent as Uint8Array);
}

async function uploadToR2(key: string, body: Buffer): Promise<string> {
  const s3 = getS3Client();
  const bucket = process.env.R2_BUCKET_NAME!;
  const publicUrl = process.env.R2_PUBLIC_URL!;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'audio/mpeg',
    })
  );

  return `${publicUrl}/${key}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ───────────────────────────────────────────────────

async function main() {
  // Parse --file argument
  const fileArgIndex = process.argv.indexOf('--file');
  if (fileArgIndex === -1 || !process.argv[fileArgIndex + 1]) {
    console.error('Usage: npx tsx scripts/generate-podcast-audio.ts --file <path.json>');
    console.error('JSON format: [{ "id": "ep001", "title": "...", "script": "..." }]');
    process.exit(1);
  }

  const inputPath = resolve(process.argv[fileArgIndex + 1]);
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const items: PodcastItem[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  if (!Array.isArray(items) || items.length === 0) {
    console.error('Input JSON must be a non-empty array of { id, title, script }');
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(AUDIO_OUTPUT_DIR)) {
    fs.mkdirSync(AUDIO_OUTPUT_DIR, { recursive: true });
  }

  console.log(`\n🎙️  Generating ${items.length} podcast audio files\n`);
  console.log(`Voice: ${VOICE_NAME} | Rate: ${SPEAKING_RATE} | Format: MP3\n`);

  let totalChars = 0;
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`[${i + 1}/${items.length}] ${item.id}: ${item.title}`);

    try {
      // Generate audio
      const audioBuffer = await generateAudio(item.script);
      totalChars += item.script.length;

      // Save locally
      const localPath = path.join(AUDIO_OUTPUT_DIR, `${item.id}.mp3`);
      fs.writeFileSync(localPath, audioBuffer);
      console.log(`  💾 Saved: ${localPath} (${audioBuffer.length} bytes)`);

      // Upload to R2
      const r2Key = `content/podcasts/${item.id}.mp3`;
      const url = await uploadToR2(r2Key, audioBuffer);
      console.log(`  ☁️  Uploaded: ${url}`);

      succeeded++;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ Failed: ${message}`);
      failed++;
    }

    // Rate limit between calls
    if (i < items.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // Summary
  const totalCost = totalChars * COST_PER_CHAR;
  console.log('\n────────────────────────────────────');
  console.log(`✅ Succeeded: ${succeeded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total characters: ${totalChars.toLocaleString()}`);
  console.log(`💰 Estimated cost: $${totalCost.toFixed(4)}`);
  console.log('────────────────────────────────────\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
