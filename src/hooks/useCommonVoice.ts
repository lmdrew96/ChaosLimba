// src/hooks/useCommonVoice.ts
// Hook for fetching Common Voice audio clips with fallback

import { useState, useCallback, useEffect } from 'react';

export interface CVClip {
    id: string;
    clipPath: string;
    sentence: string;
    r2Url: string;
    durationMs: number | null;
    age: string | null;
    gender: string | null;
    accent: string | null;
}

interface CVStats {
    totalClips: number;
    status: 'ready' | 'empty';
}

export function useCommonVoice() {
    const [clips, setClips] = useState<CVClip[]>([]);
    const [stats, setStats] = useState<CVStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check if CV clips are available
    const checkAvailability = useCallback(async () => {
        try {
            const response = await fetch('/api/common-voice/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
                return data.status === 'ready';
            }
            return false;
        } catch {
            return false;
        }
    }, []);

    // Fetch random clips
    const fetchRandomClips = useCallback(async (count: number = 5) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/common-voice/random?count=${count}`);
            if (!response.ok) {
                throw new Error('Failed to fetch clips');
            }

            const data = await response.json();
            setClips(data.clips);
            return data.clips as CVClip[];
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Play audio with Web Audio API
    const playClip = useCallback(async (clip: CVClip): Promise<void> => {
        return new Promise((resolve, reject) => {
            const audio = new Audio(clip.r2Url);
            audio.onended = () => resolve();
            audio.onerror = () => reject(new Error('Audio playback failed'));
            audio.play().catch(reject);
        });
    }, []);

    // Fallback to TTS if no clips available
    const speakText = useCallback((text: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!('speechSynthesis' in window)) {
                reject(new Error('Speech synthesis not supported'));
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ro-RO';
            utterance.rate = 0.9;
            utterance.onend = () => resolve();
            utterance.onerror = () => reject(new Error('Speech synthesis failed'));

            window.speechSynthesis.speak(utterance);
        });
    }, []);

    return {
        clips,
        stats,
        isLoading,
        error,
        isAvailable: stats?.status === 'ready',
        checkAvailability,
        fetchRandomClips,
        playClip,
        speakText,
    };
}

// Utility: Generate comprehension questions from CV sentences
export function generateComprehensionQuestion(sentence: string): {
    question: string;
    options: string[];
    correctIndex: number;
} | null {
    // Simple heuristics for question generation
    // In production, this would use AI (DeepSeek R1)

    // Check for common patterns
    const patterns = [
        { regex: /eu (sunt|lucrez|merg|am) (\w+)/i, type: 'action' },
        { regex: /la (\w+) \w+ (întâlnesc|merg|ajung)/i, type: 'location' },
        { regex: /(vremea|temperatura|ploaie|soare) .* (va fi|este|sunt)/i, type: 'weather' },
    ];

    // For MVP, return null - we'll use hardcoded questions
    // Real implementation would parse and generate questions
    return null;
}
