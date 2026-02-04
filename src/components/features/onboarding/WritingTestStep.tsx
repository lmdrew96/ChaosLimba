"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PenTool, ChevronRight, Loader2 } from "lucide-react";

export interface WritingResponse {
    promptId: string;
    text: string;
    grammarScore?: number;
    errors?: Array<{
        type: string;
        context?: string;
        correction?: string;
    }>;
}

export interface WritingResult {
    responses: WritingResponse[];
    averageScore: number; // 0-100
}

interface WritingTestStepProps {
    selfAssessment?: string;
    data?: WritingResult;
    onUpdate: (data: WritingResult) => void;
}

const WRITING_PROMPTS = [
    {
        id: "w1",
        level: "A1-A2",
        prompt: "Descrie-te în 2-3 propoziții. (Describe yourself in 2-3 sentences.)",
        hint: "Try to mention your name, age, or what you do.",
        minLength: 20,
    },
    {
        id: "w2",
        level: "A2-B1",
        prompt: "Ce ai făcut ieri? Scrie 3-4 propoziții. (What did you do yesterday? Write 3-4 sentences.)",
        hint: "Use past tense verbs if you can.",
        minLength: 40,
    },
    {
        id: "w3",
        level: "B1-B2",
        prompt: "Care este locul tău preferat și de ce îți place? (What is your favorite place and why do you like it?)",
        hint: "Try to explain your reasons.",
        minLength: 50,
    },
];

export function WritingTestStep({ selfAssessment, data, onUpdate }: WritingTestStepProps) {
    const [currentPrompt, setCurrentPrompt] = useState(0);
    const [responses, setResponses] = useState<WritingResponse[]>(data?.responses || []);
    const [currentText, setCurrentText] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [currentFeedback, setCurrentFeedback] = useState<{
        score: number;
        errors: WritingResponse["errors"];
    } | null>(null);

    const prompt = WRITING_PROMPTS[currentPrompt];
    const isLastPrompt = currentPrompt === WRITING_PROMPTS.length - 1;
    const existingResponse = responses.find((r) => r.promptId === prompt.id);

    const handleSubmit = useCallback(async () => {
        if (currentText.length < prompt.minLength) return;

        setIsAnalyzing(true);

        try {
            // Call grammar API to analyze the text
            const response = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "grammar",
                    payload: { text: currentText },
                }),
            });

            let score = 70; // Default score
            let errors: WritingResponse["errors"] = [];

            if (response.ok) {
                const result = await response.json();
                score = result.grammarScore || 70;
                errors = result.errors?.map((e: any) => ({
                    type: e.type,
                    context: e.learner_production,
                    correction: e.correct_form,
                })) || [];
            }

            const newResponse: WritingResponse = {
                promptId: prompt.id,
                text: currentText,
                grammarScore: score,
                errors,
            };

            const newResponses = [...responses.filter((r) => r.promptId !== prompt.id), newResponse];
            setResponses(newResponses);

            // Calculate average score
            const avgScore = newResponses.reduce((sum, r) => sum + (r.grammarScore || 70), 0) / newResponses.length;
            onUpdate({ responses: newResponses, averageScore: avgScore });

            setCurrentFeedback({ score, errors });
            setShowFeedback(true);
        } catch (error) {
            console.error("Grammar analysis failed:", error);
            // Use default scoring on error
            const newResponse: WritingResponse = {
                promptId: prompt.id,
                text: currentText,
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
    }, [currentText, prompt, responses, onUpdate]);

    const handleNext = () => {
        if (!isLastPrompt) {
            setCurrentPrompt((prev) => prev + 1);
            setCurrentText("");
            setShowFeedback(false);
            setCurrentFeedback(null);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-chart-4";
        if (score >= 60) return "text-chart-3";
        return "text-destructive";
    };

    return (
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-4/20">
                        <PenTool className="h-5 w-5 text-chart-4" />
                    </div>
                    <div>
                        <span className="text-lg">Writing Production</span>
                        <p className="text-sm font-normal text-muted-foreground">
                            Prompt {currentPrompt + 1} of {WRITING_PROMPTS.length}
                        </p>
                    </div>
                    <div className="ml-auto px-3 py-1 rounded-full bg-chart-4/10 text-sm text-chart-4">
                        {prompt.level}
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Prompt */}
                <div className="p-4 rounded-xl bg-chart-4/5 border border-chart-4/20">
                    <p className="text-lg font-medium text-chart-4">{prompt.prompt}</p>
                    <p className="text-sm text-muted-foreground mt-2">💡 {prompt.hint}</p>
                </div>

                {/* Text Input */}
                <div className="space-y-2">
                    <Textarea
                        value={currentText}
                        onChange={(e) => setCurrentText(e.target.value)}
                        placeholder="Scrie aici... (Write here...)"
                        className="min-h-[150px] bg-muted/20 border-chart-4/20 focus:border-chart-4/50"
                        disabled={showFeedback || isAnalyzing}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{currentText.length} characters</span>
                        <span className={cn(
                            currentText.length >= prompt.minLength ? "text-chart-4" : "text-muted-foreground"
                        )}>
                            Min {prompt.minLength} characters
                        </span>
                    </div>
                </div>

                {/* Feedback */}
                {showFeedback && currentFeedback && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-muted/20 border border-border">
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
                                        <div key={index} className="text-sm p-2 rounded bg-chart-3/10 border border-chart-3/20">
                                            <span className="text-chart-3">{error.type}</span>
                                            {error.context && (
                                                <span className="text-muted-foreground">: "{error.context}"</span>
                                            )}
                                            {error.correction && (
                                                <span className="text-chart-4"> → "{error.correction}"</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-chart-4">✓ No major errors detected! Great work!</p>
                            )}
                        </div>

                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                            <p className="text-sm text-primary">
                                🌱 These errors are being saved to your Error Garden for future practice!
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    {!showFeedback ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={currentText.length < prompt.minLength || isAnalyzing}
                            className="bg-chart-4 hover:bg-chart-4/80"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                "Submit & Check"
                            )}
                        </Button>
                    ) : !isLastPrompt ? (
                        <Button onClick={handleNext} className="gap-2 bg-chart-4 hover:bg-chart-4/80">
                            Next Prompt
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            ✓ Writing test complete! Click "Continue" above to proceed.
                        </div>
                    )}
                </div>

                {/* Progress indicators */}
                <div className="flex justify-center gap-2 pt-4">
                    {WRITING_PROMPTS.map((_, index) => {
                        const responded = responses.some(
                            (r) => r.promptId === WRITING_PROMPTS[index].id
                        );
                        const score = responses.find(
                            (r) => r.promptId === WRITING_PROMPTS[index].id
                        )?.grammarScore;

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "w-3 h-3 rounded-full transition-all",
                                    index === currentPrompt && "ring-2 ring-chart-4 ring-offset-2 ring-offset-background",
                                    responded
                                        ? score && score >= 70
                                            ? "bg-chart-4"
                                            : "bg-chart-3"
                                        : "bg-muted/40"
                                )}
                            />
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
