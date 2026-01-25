// scripts/fix-cv-urls.ts
// One-time script to update Common Voice URLs to public R2 endpoint

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
    const sql = neon(process.env.DATABASE_URL!);
    const publicUrl = process.env.R2_PUBLIC_URL!;

    console.log('🔧 Updating r2_url to:', publicUrl);

    const result = await sql`
    UPDATE common_voice_clips 
    SET r2_url = ${publicUrl} || '/common-voice/' || clip_path
  `;

    console.log('✅ Updated all rows');
}

main().catch(console.error);
