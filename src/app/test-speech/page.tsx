'use client';

import { useState } from 'react';

export default function TestSpeechPage() {
  const [recording, setRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      await transcribeAudio(blob);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
  }

  function stopRecording() {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  }

  async function transcribeAudio(audioBlob: Blob) {
    setLoading(true);
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setTranscription(data.transcription);
      } else {
        setTranscription('Error: ' + JSON.stringify(data));
      }
    } catch (error) {
      setTranscription('Error: ' + String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">🎤 Speech Recognition Test</h1>
      
      <div className="space-y-4">
        <div>
          {!recording ? (
            <button
              onClick={startRecording}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
            >
              🎙️ Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 animate-pulse"
            >
              ⏹️ Stop Recording
            </button>
          )}
        </div>

        {loading && (
          <div className="text-gray-600">
            ⏳ Transcribing...
          </div>
        )}

        {transcription && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h2 className="font-bold mb-2">Transcription:</h2>
            <p className="text-lg">{transcription}</p>
          </div>
        )}
      </div>
    </div>
  );
}