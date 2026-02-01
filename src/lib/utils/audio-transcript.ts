/**
 * Transcribes audio URL using Groq Whisper v3 (FREE)
 * Used for audio content transcription
 *
 * @param audioUrl - Direct URL to audio file (mp3, wav, etc.)
 * @param lang - Language code (default: 'ro' for Romanian)
 * @returns Transcribed text or null if transcription fails
 */
export async function transcribeAudioUrl(
  audioUrl: string,
  lang: string = 'ro'
): Promise<string | null> {
  try {
    console.log(`[Audio Transcript] Fetching audio from ${audioUrl}`);

    // Fetch audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      console.error(`[Audio Transcript] Failed to fetch ${audioUrl}: ${audioResponse.statusText}`);
      return null;
    }

    const audioBlob = await audioResponse.blob();
    console.log(`[Audio Transcript] Fetched ${audioBlob.size} bytes, transcribing with Groq Whisper v3...`);

    // Send to Groq Whisper v3
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', lang); // Romanian
    formData.append('response_format', 'json');

    const transcriptionResponse = await fetch(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: formData
      }
    );

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      console.error('[Audio Transcript] Groq API failed:', error);
      return null;
    }

    const result = await transcriptionResponse.json();
    const transcribedText = result.text;

    console.log(`[Audio Transcript] Successfully transcribed ${transcribedText.length} characters`);
    return transcribedText;
  } catch (error) {
    console.error('[Audio Transcript] Error:', error);
    return null;
  }
}
