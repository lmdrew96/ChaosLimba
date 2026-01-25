"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Headphones, ChevronRight, Play, Pause, Volume2, Loader2 } from "lucide-react";

export interface ListeningAnswer {
    questionId: string;
    selectedOption: number;
    correct: boolean;
}

export interface ListeningResult {
    answers: ListeningAnswer[];
    score: number; // 0-100
}

interface ListeningTestStepProps {
    selfAssessment?: string;
    data?: ListeningResult;
    onUpdate: (data: ListeningResult) => void;
}

// Common Voice clip from API
interface CVClip {
    id: string;
    clipPath: string;
    sentence: string;
    r2Url: string;
    durationMs: number | null;
    age: string | null;
    gender: string | null;
}

// Static questions with hardcoded answers (fallback if CV not available)
const FALLBACK_QUESTIONS = [
    {
        id: "l1",
        level: "A1",
        transcript: "Bună ziua! Eu sunt profesor. Lucrez la o școală.",
        question: "Ce meserie are această persoană?",
        options: ["Doctor", "Profesor", "Avocat", "Inginer"],
        correctIndex: 1,
    },
    {
        id: "l2",
        level: "A2",
        transcript: "La ora trei mă întâlnesc cu prietenii mei la cafenea. Apoi mergem la cinema să vedem un film nou.",
        question: "Unde se întâlnesc prietenii?",
        options: ["La restaurant", "La cafenea", "La parc", "La cinema"],
        correctIndex: 1,
    },
    {
        id: "l3",
        level: "B1",
        transcript: "Vremea de mâine va fi însorită în sudul țării, cu temperaturi de până la 28 de grade. În nord, sunt așteptate ploi ușoare.",
        question: "Cum va fi vremea în sud mâine?",
        options: ["Ploioasă", "Înnorată", "Însorită", "Cu zăpadă"],
        correctIndex: 2,
    },
    {
        id: "l4",
        level: "B2",
        transcript: "Potrivit studiului recent, numărul turiștilor străini care vizitează România a crescut cu 15% față de anul trecut, în special datorită promovării patrimoniului cultural.",
        question: "Care este motivul principal al creșterii numărului de turiști?",
        options: [
            "Prețuri mai mici",
            "Promovarea patrimoniului cultural",
            "Vreme mai bună",
            "Infrastructură îmbunătățită"
        ],
        correctIndex: 1,
    },
];

// Generate simple comprehension question from CV sentence
function generateQuestion(sentence: string, index: number): {
    question: string;
    options: string[];
    correctIndex: number;
} {
    // For now, we use a simple "what did you hear?" format
    // The correct answer is a key phrase from the sentence
    const words = sentence.split(' ').filter(w => w.length > 3);

    // Pick a distinctive word from the sentence
    const keyWord = words[Math.min(2, words.length - 1)] || words[0] || sentence.split(' ')[0];

    // Generate distractor options (random Romanian words)
    const distractors = [
        ["casă", "mașină", "carte", "prieteni"],
        ["frumos", "mare", "nou", "vechi"],
        ["merge", "vine", "pleacă", "stă"],
        ["azi", "mâine", "ieri", "acum"],
    ];

    const distractorSet = distractors[index % distractors.length];
    const options = [...distractorSet];
    const correctIndex = Math.floor(Math.random() * 4);
    options[correctIndex] = keyWord;

    return {
        question: "Ce cuvânt ai auzit în propoziție?",
        options,
        correctIndex,
    };
}

export function ListeningTestStep({ selfAssessment, data, onUpdate }: ListeningTestStepProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<ListeningAnswer[]>(data?.answers || []);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasPlayed, setHasPlayed] = useState(false);

    // Native audio state
    const [cvClips, setCvClips] = useState<CVClip[]>([]);
    const [isLoadingClips, setIsLoadingClips] = useState(true);
    const [useNativeAudio, setUseNativeAudio] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Fetch Common Voice clips on mount
    useEffect(() => {
        async function fetchClips() {
            try {
                const response = await fetch('/api/common-voice/random?count=4');
                if (response.ok) {
                    const data = await response.json();
                    if (data.clips && data.clips.length >= 4) {
                        setCvClips(data.clips);
                        setUseNativeAudio(true);
                    }
                }
            } catch (error) {
                console.log('CV clips not available, using TTS fallback');
            } finally {
                setIsLoadingClips(false);
            }
        }
        fetchClips();
    }, []);

    // Determine current question data - memoized to prevent shuffling on re-renders
    const questions = useMemo(() => {
        if (useNativeAudio && cvClips.length >= 4) {
            return cvClips.map((clip, i) => ({
                id: `cv-${clip.id}`,
                level: ["A1", "A2", "B1", "B2"][i] || "A1",
                transcript: clip.sentence,
                audioUrl: clip.r2Url,
                ...generateQuestion(clip.sentence, i),
            }));
        }
        return FALLBACK_QUESTIONS.map(q => ({ ...q, audioUrl: null }));
    }, [useNativeAudio, cvClips]);

    const question = questions[currentQuestion];
    const isLastQuestion = currentQuestion === questions.length - 1;
    const hasNativeAudio = useNativeAudio && question?.audioUrl;

    // Play native audio
    const playNativeAudio = useCallback(() => {
        if (!question?.audioUrl) return;

        setIsPlaying(true);

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(question.audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
            setIsPlaying(false);
            setHasPlayed(true);
        };

        audio.onerror = () => {
            console.error('Audio playback failed, falling back to TTS');
            setIsPlaying(false);
            playTTSFallback();
        };

        audio.play().catch(() => {
            setIsPlaying(false);
            playTTSFallback();
        });
    }, [question]);

    // TTS fallback
    const playTTSFallback = useCallback(() => {
        if (!("speechSynthesis" in window)) {
            setHasPlayed(true);
            return;
        }

        setIsPlaying(true);
        const utterance = new SpeechSynthesisUtterance(question.transcript);
        utterance.lang = "ro-RO";
        utterance.rate = 0.9;

        utterance.onend = () => {
            setIsPlaying(false);
            setHasPlayed(true);
        };

        utterance.onerror = () => {
            setIsPlaying(false);
            setHasPlayed(true);
        };

        window.speechSynthesis.speak(utterance);
    }, [question?.transcript]);

    // Main play handler
    const playAudio = useCallback(() => {
        if (hasNativeAudio) {
            playNativeAudio();
        } else {
            playTTSFallback();
        }
    }, [hasNativeAudio, playNativeAudio, playTTSFallback]);

    const handleSelect = (optionIndex: number) => {
        if (showFeedback) return;
        setSelectedOption(optionIndex);
    };

    const handleSubmitAnswer = useCallback(() => {
        if (selectedOption === null) return;

        const isCorrect = selectedOption === question.correctIndex;
        const newAnswer: ListeningAnswer = {
            questionId: question.id,
            selectedOption,
            correct: isCorrect,
        };

        const newAnswers = [...answers.filter((a) => a.questionId !== question.id), newAnswer];
        setAnswers(newAnswers);
        setShowFeedback(true);

        const score = (newAnswers.filter((a) => a.correct).length / questions.length) * 100;
        onUpdate({ answers: newAnswers, score });
    }, [selectedOption, question, answers, questions.length, onUpdate]);

    const handleNext = () => {
        if (!isLastQuestion) {
            // Stop any playing audio
            if (audioRef.current) {
                audioRef.current.pause();
            }
            window.speechSynthesis?.cancel();

            setCurrentQuestion((prev) => prev + 1);
            setSelectedOption(null);
            setShowFeedback(false);
            setHasPlayed(false);
            setIsPlaying(false);
        }
    };

    // Loading state
    if (isLoadingClips) {
        return (
            <Card className="border-purple-500/20 bg-card/50 backdrop-blur">
                <CardContent className="py-12 flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    <p className="text-muted-foreground">Loading native Romanian audio...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-purple-500/20 bg-card/50 backdrop-blur">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20">
                        <Headphones className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                        <span className="text-lg">Listening Comprehension</span>
                        <p className="text-sm font-normal text-muted-foreground">
                            Question {currentQuestion + 1} of {questions.length}
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {hasNativeAudio && (
                            <div className="px-2 py-1 rounded-full bg-green-500/10 text-xs text-green-400 flex items-center gap-1">
                                <Volume2 className="h-3 w-3" />
                                Native
                            </div>
                        )}
                        <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-sm text-indigo-300">
                            {question.level}
                        </div>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Audio Player */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                    <div className="flex items-center gap-4">
                        <Button
                            size="lg"
                            onClick={playAudio}
                            disabled={isPlaying}
                            className={cn(
                                "h-14 w-14 rounded-full p-0",
                                isPlaying
                                    ? "bg-indigo-600 animate-pulse"
                                    : "bg-indigo-600 hover:bg-indigo-700"
                            )}
                        >
                            {isPlaying ? (
                                <Pause className="h-6 w-6" />
                            ) : (
                                <Play className="h-6 w-6 ml-1" />
                            )}
                        </Button>
                        <div className="flex-1">
                            <p className="font-medium text-indigo-300">
                                {isPlaying ? "Playing..." : hasPlayed ? "Click to replay" : "Click to listen"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {hasNativeAudio
                                    ? "Listen to the native Romanian speaker"
                                    : "Listen carefully, then answer the question below"
                                }
                            </p>
                        </div>
                        {hasPlayed && (
                            <div className="text-green-400 text-sm">✓ Heard</div>
                        )}
                    </div>
                </div>

                {/* Question */}
                <div className="space-y-4">
                    <h3 className="font-medium text-lg">{question.question}</h3>

                    <div className="grid grid-cols-1 gap-3">
                        {question.options.map((option, index) => {
                            const isSelected = selectedOption === index;
                            const isCorrectAnswer = index === question.correctIndex;
                            const showAsCorrect = showFeedback && isCorrectAnswer;
                            const showAsWrong = showFeedback && isSelected && !isCorrectAnswer;

                            return (
                                <Button
                                    key={index}
                                    variant="outline"
                                    onClick={() => handleSelect(index)}
                                    disabled={showFeedback || !hasPlayed}
                                    className={cn(
                                        "h-auto p-4 justify-start text-left transition-all",
                                        !hasPlayed && "opacity-50 cursor-not-allowed",
                                        isSelected && !showFeedback && "border-indigo-500 bg-indigo-500/10",
                                        showAsCorrect && "border-green-500 bg-green-500/10 text-green-300",
                                        showAsWrong && "border-red-500 bg-red-500/10 text-red-300"
                                    )}
                                >
                                    <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-3 text-sm font-medium">
                                        {String.fromCharCode(65 + index)}
                                    </span>
                                    {option}
                                </Button>
                            );
                        })}
                    </div>

                    {!hasPlayed && (
                        <p className="text-sm text-muted-foreground text-center">
                            👆 Listen to the audio first to unlock the answers
                        </p>
                    )}
                </div>

                {/* Feedback */}
                {showFeedback && (
                    <div
                        className={cn(
                            "p-4 rounded-xl",
                            selectedOption === question.correctIndex
                                ? "bg-green-500/10 border border-green-500/20"
                                : "bg-amber-500/10 border border-amber-500/20"
                        )}
                    >
                        <p className={cn(
                            "font-medium",
                            selectedOption === question.correctIndex ? "text-green-400" : "text-amber-400"
                        )}>
                            {selectedOption === question.correctIndex
                                ? "🎉 Excellent listening! You got it!"
                                : "💡 Good try! Keep listening to Romanian audio to improve."}
                        </p>
                        {hasNativeAudio && (
                            <p className="text-sm text-muted-foreground mt-2">
                                You heard: &ldquo;{question.transcript}&rdquo;
                            </p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    {!showFeedback ? (
                        <Button
                            onClick={handleSubmitAnswer}
                            disabled={selectedOption === null || !hasPlayed}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            Check Answer
                        </Button>
                    ) : !isLastQuestion ? (
                        <Button onClick={handleNext} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                            Next Question
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            ✓ Listening test complete! Click &ldquo;Continue&rdquo; above to proceed.
                        </div>
                    )}
                </div>

                {/* Progress indicators */}
                <div className="flex justify-center gap-2 pt-4">
                    {questions.map((_, index) => {
                        const answered = answers.some(
                            (a) => a.questionId === questions[index].id
                        );
                        const isCorrect = answers.find(
                            (a) => a.questionId === questions[index].id
                        )?.correct;

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "w-3 h-3 rounded-full transition-all",
                                    index === currentQuestion && "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background",
                                    answered
                                        ? isCorrect
                                            ? "bg-green-500"
                                            : "bg-amber-500"
                                        : "bg-white/20"
                                )}
                            />
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
