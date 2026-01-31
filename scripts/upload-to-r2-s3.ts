// scripts/upload-to-r2-s3.ts
// Upload audio files to R2 using S3-compatible API

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function uploadFile(filePath: string, key: string): Promise<boolean> {
  try {
    const fileContent = fs.readFileSync(filePath);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: fileContent,
        ContentType: 'audio/mpeg',
      })
    );

    return true;
  } catch (error) {
    console.error(`  ❌ Failed to upload ${key}:`, error);
    return false;
  }
}

async function main() {
  console.log('📤 Uploading 200 audio files to R2...\n');

  const audioDir = path.join(process.cwd(), 'public', 'audio', 'elevenlabs');
  const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));

  console.log(`Found ${files.length} audio files\n`);

  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = path.join(audioDir, file);
    const key = `elevenlabs/${file}`;

    if (await uploadFile(filePath, key)) {
      uploaded++;
      if (uploaded % 20 === 0) {
        console.log(`  ✅ Uploaded ${uploaded}/${files.length}...`);
      }
    } else {
      failed++;
    }
  }

  console.log(`\n✅ Uploaded: ${uploaded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\n🎉 Done! Files now accessible at R2 public URL`);
}

main().catch(console.error);
