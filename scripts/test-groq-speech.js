require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function testGroqSpeech() {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  
  if (!GROQ_API_KEY) {
    console.error('❌ Missing GROQ_API_KEY');
    return;
  }

  console.log('🧪 Testing Groq Speech Recognition...\n');

  // For this test, we'll use a dummy audio file
  // In real use, you'd upload an actual .wav/.mp3 file
  const formData = new FormData();
  
  // Create a minimal WAV file (just for testing the API)
  const dummyWav = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x00, 0x00, 0x00, // File size
    0x57, 0x41, 0x56, 0x45  // "WAVE"
  ]);
  
  const blob = new Blob([dummyWav], { type: 'audio/wav' });
  formData.append('file', blob, 'test.wav');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'ro'); // Romanian

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: formData
    });

    console.log('📊 Status:', response.status);
    
    const result = await response.json();
    console.log('\n✅ Response:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGroqSpeech();