"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mic, MicOff, ChevronRight, Loader2, Play, Square } from "lucide-react";

export interface SpeakingResponse {
    promptId: string;
    transcript: string;
    grammarScore?: number;
    pronunciationScore?: number;
    errors?: Array<{
        type: string;
        context?: string;
        correction?: string;
    }>;
}

export interface SpeakingResult {
    responses: SpeakingResponse[];
    averageScore: number; // 0-100
}

interface SpeakingTestStepProps {
    selfAssessment?: string;
    data?: SpeakingResult;
    onUpdate: (data: SpeakingResult) => void;
}

const SPEAKING_PROMPTS = [
    {
        id: "s1",
        level: "A1-A2",
        prompt: "Spune-mi cum te cheamă și de unde ești.",
        translation: "Tell me your name and where you're from.",
        expectedStructures: ["Mă numesc", "Sunt din"],
    },
    {
        id: "s2",
        level: "A2-B1",
        prompt: "Ce îți place să faci în timpul liber?",
        translation: "What do you like to do in your free time?",
        expectedStructures: ["Îmi place să", "hobby"],
    },
    {
        id: "s3",
        level: "B1-B2",
        prompt: "Descrie cum arată vremea astăzi și ce planuri ai pentru weekend.",
        translation: "Describe what the weather is like today and what plans you have for the weekend.",
        expectedStructures: ["conditional", "future"],
    },
];

export function SpeakingTestStep({ selfAssessment, data, onUpdate }: SpeakingTestStepProps) {
    const [currentPrompt, setCurrentPrompt] = useState(0);
    const [responses, setResponses] = useState<SpeakingResponse[]>(data?.responses || []);
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [currentFeedback, setCurrentFeedback] = useState<{
        score: number;
        errors: SpeakingResponse["errors"];
    } | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const prompt = SPEAKING_PROMPTS[currentPrompt];
    const isLastPrompt = currentPrompt === SPEAKING_PROMPTS.length - 1;

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: "audio/webm;codecs=opus",
            });

            audioChunksRef.current = [];
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                setRecordedAudio(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Failed to start recording:", error);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    const playRecording = useCallback(() => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play();
        }
    }, [audioUrl]);

    const handleSubmit = useCallback(async () => {
        if (!recordedAudio) return;

        setIsAnalyzing(true);

        try {
            // Convert blob to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    resolve(base64.split(",")[1]);
                };
                reader.readAsDataURL(recordedAudio);
            });
            const audioBase64 = await base64Promise;

            // Call speech-to-text API
            const sttResponse = await fetch("/api/speech-to-text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audio: audioBase64 }),
            });

            let transcribedText = "";
            if (sttResponse.ok) {
                const sttResult = await sttResponse.json();
                transcribedText = sttResult.text || sttResult.transcription || "";
            }

            setTranscript(transcribedText);

            // Analyze grammar if we got a transcript
            let score = 70;
            let errors: SpeakingResponse["errors"] = [];

            if (transcribedText.length > 5) {
                const grammarResponse = await fetch("/api/ai", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "grammar",
                        payload: { text: transcribedText },
                    }),
                });

                if (grammarResponse.ok) {
                    const grammarResult = await grammarResponse.json();
                    score = grammarResult.grammarScore || 70;
                    errors = grammarResult.errors?.map((e: any) => ({
                        type: e.type,
                        context: e.learner_production,
                        correction: e.correct_form,
                    })) || [];
                }
            }

            const newResponse: SpeakingResponse = {
                promptId: prompt.id,
                transcript: transcribedText,
                grammarScore: score,
                errors,
            };

            const newResponses = [...responses.filter((r) => r.promptId !== prompt.id), newResponse];
            setResponses(newResponses);

            const avgScore = newResponses.reduce((sum, r) => sum + (r.grammarScore || 70), 0) / newResponses.length;
            onUpdate({ responses: newResponses, averageScore: avgScore });

            setCurrentFeedback({ score, errors });
            setShowFeedback(true);
        } catch (error) {
            console.error("Speech analysis failed:", error);
            // Use default scoring on error
            const newResponse: SpeakingResponse = {
                promptId: prompt.id,
                transcript: "Analysis unavailable",
                grammarScore: 65,
                errors: [],
            };

            const newResponses = [...responses.filter((r) => r.promptId !== prompt.id), newResponse];
            setResponses(newResponses);

            const avgScore = newResponses.reduce((sum, r) => sum + (r.grammarScore || 70), 0) / newResponses.length;
            onUpdate({ responses: newResponses, averageScore: avgScore });

            setCurrentFeedback({ score: 65, errors: [] });
            setShowFeedback(true);
        } finally {
            setIsAnalyzing(false);
        }
    }, [recordedAudio, prompt, responses, onUpdate]);

    const handleNext = () => {
        if (!isLastPrompt) {
            setCurrentPrompt((prev) => prev + 1);
            setRecordedAudio(null);
            setAudioUrl(null);
            setTranscript(null);
            setShowFeedback(false);
            setCurrentFeedback(null);
            setRecordingTime(0);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-400";
        if (score >= 60) return "text-amber-400";
        return "text-red-400";
    };

    return (
        <Card className="border-purple-500/20 bg-card/50 backdrop-blur">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/20">
                        <Mic className="h-5 w-5 text-rose-400" />
                    </div>
                    <div>
                        <span className="text-lg">Speaking Production</span>
                        <p className="text-sm font-normal text-muted-foreground">
                            Prompt {currentPrompt + 1} of {SPEAKING_PROMPTS.length}
                        </p>
                    </div>
                    <div className="ml-auto px-3 py-1 rounded-full bg-rose-500/10 text-sm text-rose-300">
                        {prompt.level}
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Prompt */}
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <p className="text-lg font-medium text-rose-300">{prompt.prompt}</p>
                    <p className="text-sm text-muted-foreground mt-2 italic">{prompt.translation}</p>
                </div>

                {/* Recording Interface */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20">
                    <div className="flex flex-col items-center gap-4">
                        {/* Recording button */}
                        <Button
                            size="lg"
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={showFeedback || isAnalyzing}
                            className={cn(
                                "h-20 w-20 rounded-full p-0 transition-all",
                                isRecording
                                    ? "bg-red-600 hover:bg-red-700 animate-pulse"
                                    : "bg-rose-600 hover:bg-rose-700"
                            )}
                        >
                            {isRecording ? (
                                <Square className="h-8 w-8" />
                            ) : (
                                <Mic className="h-8 w-8" />
                            )}
                        </Button>

                        {/* Status text */}
                        <div className="text-center">
                            {isRecording ? (
                                <>
                                    <p className="font-medium text-red-400">Recording... {formatTime(recordingTime)}</p>
                                    <p className="text-sm text-muted-foreground">Click to stop</p>
                                </>
                            ) : recordedAudio ? (
                                <div className="flex items-center gap-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={playRecording}
                                        className="gap-2"
                                    >
                                        <Play className="h-4 w-4" />
                                        Play Recording
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        {formatTime(recordingTime)}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <p className="font-medium text-rose-300">Click to start recording</p>
                                    <p className="text-sm text-muted-foreground">Answer in Romanian</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Transcript & Feedback */}
                {showFeedback && currentFeedback && (
                    <div className="space-y-4">
                        {transcript && (
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-sm text-muted-foreground mb-2">What we heard:</p>
                                <p className="text-lg">{transcript}</p>
                            </div>
                        )}

                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-medium">Grammar Score</span>
                                <span className={cn("text-2xl font-bold", getScoreColor(currentFeedback.score))}>
                                    {Math.round(currentFeedback.score)}%
                                </span>
                            </div>

                            {currentFeedback.errors && currentFeedback.errors.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Errors detected:</p>
                                    {currentFeedback.errors.slice(0, 3).map((error, index) => (
                                        <div key={index} className="text-sm p-2 rounded bg-amber-500/10 border border-amber-500/20">
                                            <span className="text-amber-300">{error.type}</span>
                                            {error.context && (
                                                <span className="text-muted-foreground">: "{error.context}"</span>
                                            )}
                                            {error.correction && (
                                                <span className="text-green-400"> → "{error.correction}"</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-green-400">✓ Good speaking! Keep practicing.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    {!showFeedback ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={!recordedAudio || isAnalyzing}
                            className="bg-rose-600 hover:bg-rose-700"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                "Submit & Analyze"
                            )}
                        </Button>
                    ) : !isLastPrompt ? (
                        <Button onClick={handleNext} className="gap-2 bg-rose-600 hover:bg-rose-700">
                            Next Prompt
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            ✓ Speaking test complete! Click "Continue" above to proceed.
                        </div>
                    )}
                </div>

                {/* Progress indicators */}
                <div className="flex justify-center gap-2 pt-4">
                    {SPEAKING_PROMPTS.map((_, index) => {
                        const responded = responses.some(
                            (r) => r.promptId === SPEAKING_PROMPTS[index].id
                        );
                        const score = responses.find(
                            (r) => r.promptId === SPEAKING_PROMPTS[index].id
                        )?.grammarScore;

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "w-3 h-3 rounded-full transition-all",
                                    index === currentPrompt && "ring-2 ring-rose-500 ring-offset-2 ring-offset-background",
                                    responded
                                        ? score && score >= 70
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
