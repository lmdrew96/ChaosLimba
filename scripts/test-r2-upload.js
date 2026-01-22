// scripts/test-r2-upload.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function testUpload() {
  try {
    const testContent = 'Hello from ChaosLimbă! R2 is working! 🎉';
    
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: 'test/hello.txt',
      Body: testContent,
      ContentType: 'text/plain',
    }));
    
    console.log('✅ SUCCESS! R2 upload works!');
    console.log(`📁 File uploaded to: ${process.env.R2_BUCKET_NAME}/test/hello.txt`);
  } catch (error) {
    console.error('❌ FAILED! R2 upload error:', error.message);
  }
}

testUpload();