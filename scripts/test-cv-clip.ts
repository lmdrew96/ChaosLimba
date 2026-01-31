import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testClip() {
  const testUrl = 'https://pub-d386c55c1fa84dff93e2df0a7019dea0.r2.dev/common-voice/common_voice_ro_38390317.mp3';

  console.log('🎵 Fetching test clip from R2...');
  console.log(`   URL: ${testUrl}\n`);

  const response = await fetch(testUrl);
  if (!response.ok) {
    console.error('❌ Failed to fetch clip:', response.status);
    return;
  }

  const audioBuffer = await response.arrayBuffer();
  const audioFile = new File([audioBuffer], 'test.mp3', { type: 'audio/mpeg' });

  console.log(`📊 File size: ${(audioBuffer.byteLength / 1024).toFixed(1)} KB`);
  console.log('\n🎤 Transcribing with Groq Whisper to get real duration...\n');

  const transcription = await groq.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-large-v3-turbo',
    language: 'ro',
    response_format: 'verbose_json'
  });

  console.log(`✅ Transcription: "${transcription.text}"`);
  console.log(`⏱️  Real duration: ${(transcription as any).duration?.toFixed(2)} seconds`);
  console.log(`🗣️  Language detected: ${(transcription as any).language}`);
}

testClip().catch(console.error);
