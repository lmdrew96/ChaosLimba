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
    // Fetch audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      return null;
    }

    const audioBlob = await audioResponse.blob();

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
      return null;
    }

    const result = await transcriptionResponse.json();
    const transcribedText = result.text;

    return transcribedText;
  } catch (error) {
    return null;
  }
}
