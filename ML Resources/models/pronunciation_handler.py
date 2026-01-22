import runpod
import torch
import torchaudio
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
import numpy as np

# Load the Romanian pronunciation model
MODEL_NAME = "gigant/romanian-wav2vec2"
processor = Wav2Vec2Processor.from_pretrained(MODEL_NAME)
model = Wav2Vec2ForCTC.from_pretrained(MODEL_NAME)
model.eval()

def calculate_phoneme_accuracy(predicted_text, expected_text):
    """
    Compare predicted vs expected pronunciation
    Returns score 0-100
    """
    # Simple character-level similarity for MVP
    # TODO: Enhance with actual phoneme-level comparison later
    
    if not expected_text:
        return 100.0  # No comparison needed
    
    predicted = predicted_text.lower().strip()
    expected = expected_text.lower().strip()
    
    # Calculate character-level accuracy
    matches = sum(1 for a, b in zip(predicted, expected) if a == b)
    max_len = max(len(predicted), len(expected))
    
    if max_len == 0:
        return 0.0
    
    accuracy = (matches / max_len) * 100
    return round(accuracy, 2)

def detect_stress_errors(audio_array, sample_rate):
    """
    Detect stress pattern issues
    Returns list of potential stress errors
    """
    # This is simplified for MVP - just checks volume peaks
    # Post-MVP: Use proper prosody analysis
    
    # Calculate energy (volume) over time
    frame_length = int(sample_rate * 0.1)  # 100ms frames
    energy = []
    
    for i in range(0, len(audio_array) - frame_length, frame_length):
        frame = audio_array[i:i+frame_length]
        energy.append(np.sum(frame ** 2))
    
    # Find stress peaks (high energy frames)
    threshold = np.mean(energy) + np.std(energy)
    stress_peaks = [i for i, e in enumerate(energy) if e > threshold]
    
    return {
        "stress_detected": len(stress_peaks) > 0,
        "stress_count": len(stress_peaks),
        "confidence": 0.75  # Placeholder for MVP
    }

def handler(event):
    """
    Main handler for RunPod serverless
    Input: audio file URL or base64 audio data
    Output: pronunciation analysis
    """
    try:
        input_data = event["input"]
        audio_url = input_data.get("audio_url")
        expected_text = input_data.get("expected_text", "")
        
        # Download and load audio
        # For MVP, assume audio is already preprocessed to 16kHz
        # In production, add proper audio downloading from R2
        
        if "audio_base64" in input_data:
            # Decode base64 audio
            import base64
            import io
            audio_bytes = base64.b64decode(input_data["audio_base64"])
            audio_array, sample_rate = torchaudio.load(io.BytesIO(audio_bytes))
        else:
            # Download from URL (implement R2 fetch here)
            raise NotImplementedError("URL download not yet implemented")
        
        # Ensure mono and correct sample rate
        if audio_array.shape[0] > 1:
            audio_array = torch.mean(audio_array, dim=0, keepdim=True)
        
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(sample_rate, 16000)
            audio_array = resampler(audio_array)
            sample_rate = 16000
        
        # Run Wav2Vec2 model
        input_values = processor(
            audio_array.squeeze().numpy(),
            sampling_rate=16000,
            return_tensors="pt"
        ).input_values
        
        with torch.no_grad():
            logits = model(input_values).logits
        
        # Decode to text
        predicted_ids = torch.argmax(logits, dim=-1)
        transcription = processor.batch_decode(predicted_ids)[0]
        
        # Calculate pronunciation score
        phoneme_accuracy = calculate_phoneme_accuracy(
            transcription,
            expected_text
        )
        
        # Detect stress issues
        stress_analysis = detect_stress_errors(
            audio_array.squeeze().numpy(),
            sample_rate
        )
        
        return {
            "transcription": transcription,
            "phoneme_accuracy": phoneme_accuracy,
            "stress_analysis": stress_analysis,
            "overall_score": phoneme_accuracy * 0.7 + (100 if not stress_analysis["stress_detected"] else 70) * 0.3
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "success": False
        }

runpod.serverless.start({"handler": handler})