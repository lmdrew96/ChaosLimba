// scripts/import-cv-metadata.ts
// Imports Common Voice metadata into database after R2 upload
// Run with: npx tsx scripts/import-cv-metadata.ts --batch 1

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Database
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const CV_BASE = path.join(__dirname, '..', 'Common Voice', 'cv-corpus-24.0-2025-12-05', 'ro');
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-chaoslimba.r2.dev';
const BATCH_SIZE = 10000;

interface ClipMetadata {
    path: string;
    sentence_id: string;
    sentence: string;
    up_votes: number;
    down_votes: number;
    age: string;
    gender: string;
    accents: string;
}

interface ClipDuration {
    clip: string;
    duration: number;
}

function parseTSV<T extends Record<string, string | number>>(
    filePath: string,
    transform: (row: Record<string, string>) => T
): T[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split('\t');

    return lines.slice(1).map(line => {
        const values = line.split('\t');
        const row: Record<string, string> = {};
        headers.forEach((h, i) => row[h] = values[i] || '');
        return transform(row);
    });
}

function parseDurations(filePath: string): Map<string, number> {
    const durations = new Map<string, number>();
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').slice(1); // Skip header

    for (const line of lines) {
        const [clip, duration] = line.split('\t');
        if (clip && duration) {
            // Duration is in format "clips/common_voice_ro_xxx.mp3[tab]5.123"
            const clipName = clip.replace('clips/', '');
            durations.set(clipName, Math.round(parseFloat(duration) * 1000)); // Convert to ms
        }
    }

    return durations;
}

async function main() {
    // Parse args
    const batchArg = process.argv.find(a => a.startsWith('--batch='));
    const batchNum = batchArg ? parseInt(batchArg.split('=')[1]) : 1;

    console.log(`\n📊 Common Voice Metadata Import - Batch ${batchNum}\n`);

    // Parse validated.tsv
    console.log('📖 Reading validated.tsv...');
    const validatedPath = path.join(CV_BASE, 'validated.tsv');
    const allClips = parseTSV<ClipMetadata>(validatedPath, (row) => ({
        path: row.path,
        sentence_id: row.sentence_id,
        sentence: row.sentence,
        up_votes: parseInt(row.up_votes) || 0,
        down_votes: parseInt(row.down_votes) || 0,
        age: row.age,
        gender: row.gender,
        accents: row.accents,
    }));

    // Parse durations
    console.log('📖 Reading clip_durations.tsv...');
    const durationsPath = path.join(CV_BASE, 'clip_durations.tsv');
    const durations = parseDurations(durationsPath);
    console.log(`   Loaded ${durations.size} clip durations\n`);

    // Get batch range
    const start = (batchNum - 1) * BATCH_SIZE;
    const end = batchNum * BATCH_SIZE;
    const batchClips = allClips.slice(start, Math.min(end, allClips.length));

    if (batchClips.length === 0) {
        console.log(`✅ Batch ${batchNum} is empty - no more clips to import!`);
        return;
    }

    console.log(`📦 Importing batch ${batchNum}: clips ${start + 1} to ${start + batchClips.length}\n`);

    // Prepare insert data
    const insertData = batchClips.map(clip => ({
        clipPath: clip.path,
        sentence: clip.sentence,
        sentenceId: clip.sentence_id,
        r2Url: `${R2_PUBLIC_URL}/common-voice/${clip.path}`,
        durationMs: durations.get(clip.path) || null,
        age: clip.age || null,
        gender: clip.gender || null,
        accent: clip.accents || null,
        upVotes: clip.up_votes,
        downVotes: clip.down_votes,
        batchNumber: batchNum,
    }));

    // Insert in chunks of 100 to avoid timeout
    const chunkSize = 100;
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < insertData.length; i += chunkSize) {
        const chunk = insertData.slice(i, i + chunkSize);

        try {
            await db.insert(schema.commonVoiceClips)
                .values(chunk)
                .onConflictDoNothing({ target: schema.commonVoiceClips.clipPath });
            inserted += chunk.length;
        } catch (error) {
            console.error(`⚠️  Error inserting chunk at ${i}:`, error);
            skipped += chunk.length;
        }

        if (i % 1000 === 0) {
            console.log(`   Progress: ${i}/${insertData.length} rows...`);
        }
    }

    console.log(`\n✨ Batch ${batchNum} Complete!`);
    console.log(`   ✅ Inserted: ${inserted}`);
    console.log(`   ⏭️  Skipped:  ${skipped}`);
    console.log(`\n💡 To continue, run: npx tsx scripts/import-cv-metadata.ts --batch=${batchNum + 1}\n`);
}

main().catch(console.error);
