// scripts/upload-common-voice.ts
// Batch uploads Common Voice clips to R2 with audio conversion
// Run with: npx tsx scripts/upload-common-voice.ts --batch 1

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// R2 Client
const r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const CV_BASE = path.join(__dirname, '..', 'Common Voice', 'cv-corpus-24.0-2025-12-05', 'ro');
const CLIPS_DIR = path.join(CV_BASE, 'clips');
const TEMP_DIR = path.join(__dirname, '..', '.temp-cv-convert');
const BATCH_SIZE = 10000;

interface ClipMetadata {
    client_id: string;
    path: string;
    sentence_id: string;
    sentence: string;
    sentence_domain: string;
    up_votes: number;
    down_votes: number;
    age: string;
    gender: string;
    accents: string;
    variant: string;
    locale: string;
}

function parseTSV(filePath: string): ClipMetadata[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split('\t');

    return lines.slice(1).map(line => {
        const values = line.split('\t');
        const row: Record<string, string> = {};
        headers.forEach((h, i) => row[h] = values[i] || '');
        return {
            client_id: row.client_id,
            path: row.path,
            sentence_id: row.sentence_id,
            sentence: row.sentence,
            sentence_domain: row.sentence_domain,
            up_votes: parseInt(row.up_votes) || 0,
            down_votes: parseInt(row.down_votes) || 0,
            age: row.age,
            gender: row.gender,
            accents: row.accents,
            variant: row.variant,
            locale: row.locale,
        } as ClipMetadata;
    });
}

function convertAudio(inputPath: string, outputPath: string): boolean {
    try {
        // Convert to mono, 16kHz, mp3 (optimized for speech recognition)
        execSync(
            `ffmpeg -y -i "${inputPath}" -ac 1 -ar 16000 -b:a 48k "${outputPath}" 2>/dev/null`,
            { stdio: 'pipe' }
        );
        return true;
    } catch (error) {
        console.error(`❌ FFmpeg failed for ${inputPath}`);
        return false;
    }
}

async function fileExistsInR2(key: string): Promise<boolean> {
    try {
        await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        return true;
    } catch {
        return false;
    }
}

async function uploadToR2(filePath: string, key: string, metadata: Record<string, string>): Promise<boolean> {
    try {
        const body = fs.readFileSync(filePath);
        await r2.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: body,
            ContentType: 'audio/mpeg',
            Metadata: metadata,
        }));
        return true;
    } catch (error) {
        console.error(`❌ Upload failed for ${key}:`, error);
        return false;
    }
}

function getBatchRange(batchNum: number): { start: number; end: number } {
    const start = (batchNum - 1) * BATCH_SIZE;
    const end = batchNum * BATCH_SIZE;
    return { start, end };
}

async function main() {
    // Parse args
    const batchArg = process.argv.find(a => a.startsWith('--batch='));
    const batchNum = batchArg ? parseInt(batchArg.split('=')[1]) : 1;

    console.log(`\n🚀 Common Voice Upload Script - Batch ${batchNum}\n`);
    console.log(`📁 Source: ${CV_BASE}`);
    console.log(`☁️  Bucket: ${BUCKET}\n`);

    // Create temp directory
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Parse validated.tsv
    console.log('📖 Reading validated.tsv...');
    const validatedPath = path.join(CV_BASE, 'validated.tsv');
    const allClips = parseTSV(validatedPath);
    console.log(`   Found ${allClips.length} validated clips\n`);

    // Get batch range
    const { start, end } = getBatchRange(batchNum);
    const batchClips = allClips.slice(start, Math.min(end, allClips.length));

    if (batchClips.length === 0) {
        console.log(`✅ Batch ${batchNum} is empty - all clips uploaded!`);
        return;
    }

    console.log(`📦 Processing batch ${batchNum}: clips ${start + 1} to ${start + batchClips.length}\n`);

    let uploaded = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < batchClips.length; i++) {
        const clip = batchClips[i];
        const clipName = clip.path;
        const r2Key = `common-voice/${clipName}`;

        // Progress indicator
        if (i % 100 === 0) {
            const pct = ((i / batchClips.length) * 100).toFixed(1);
            console.log(`⏳ Progress: ${i}/${batchClips.length} (${pct}%) - ✅ ${uploaded} ⏭️ ${skipped} ❌ ${failed}`);
        }

        // Check if already uploaded
        if (await fileExistsInR2(r2Key)) {
            skipped++;
            continue;
        }

        // Source file
        const sourcePath = path.join(CLIPS_DIR, clipName);
        if (!fs.existsSync(sourcePath)) {
            console.warn(`⚠️  Source not found: ${clipName}`);
            failed++;
            continue;
        }

        // Convert audio
        const tempPath = path.join(TEMP_DIR, clipName);
        if (!convertAudio(sourcePath, tempPath)) {
            failed++;
            continue;
        }

        // Upload without metadata (metadata stored in database instead)
        // S3/R2 headers don't support non-ASCII characters like Romanian diacritics
        if (await uploadToR2(tempPath, r2Key, {})) {
            uploaded++;
        } else {
            failed++;
        }

        // Clean up temp file
        try { fs.unlinkSync(tempPath); } catch { }
    }

    // Final stats
    console.log(`\n✨ Batch ${batchNum} Complete!`);
    console.log(`   ✅ Uploaded: ${uploaded}`);
    console.log(`   ⏭️  Skipped:  ${skipped}`);
    console.log(`   ❌ Failed:   ${failed}`);
    console.log(`\n💡 To continue, run: npx tsx scripts/upload-common-voice.ts --batch=${batchNum + 1}\n`);

    // Save progress metadata
    const progressFile = path.join(__dirname, '..', '.cv-upload-progress.json');
    const progress = fs.existsSync(progressFile)
        ? JSON.parse(fs.readFileSync(progressFile, 'utf-8'))
        : {};
    progress[`batch_${batchNum}`] = { uploaded, skipped, failed, timestamp: new Date().toISOString() };
    fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
}

main().catch(console.error);
