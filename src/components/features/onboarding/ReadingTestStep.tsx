"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronRight, Loader2 } from "lucide-react";

export interface ReadingAnswer {
    questionId: string;
    selectedOption: number;
    correct: boolean;
}

export interface ReadingResult {
    answers: ReadingAnswer[];
    score: number; // 0-100
}

interface ReadingQuestionData {
    id: string;
    level: string;
    passage: string;
    question: string;
    options: string[];
    correctIndex: number;
}

interface ReadingTestStepProps {
    selfAssessment?: string;
    data?: ReadingResult;
    onUpdate: (data: ReadingResult) => void;
}

export function ReadingTestStep({ selfAssessment, data, onUpdate }: ReadingTestStepProps) {
    const [questions, setQuestions] = useState<ReadingQuestionData[]>([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<ReadingAnswer[]>(data?.answers || []);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);

    // Fetch reading questions from DB
    useEffect(() => {
        async function fetchQuestions() {
            try {
                const res = await fetch("/api/onboarding/reading-questions");
                if (res.ok) {
                    const data = await res.json();
                    setQuestions(data.questions);
                }
            } catch {
                // Questions won't load - component will show empty state
            } finally {
                setIsLoadingQuestions(false);
            }
        }
        fetchQuestions();
    }, []);

    if (isLoadingQuestions) {
        return (
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardContent className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    if (questions.length === 0) {
        return (
            <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardContent className="text-center py-16 text-muted-foreground">
                    No reading questions available.
                </CardContent>
            </Card>
        );
    }

    const question = questions[currentQuestion];
    const isLastQuestion = currentQuestion === questions.length - 1;

    const handleSelect = (optionIndex: number) => {
        if (showFeedback) return;
        setSelectedOption(optionIndex);
    };

    const handleSubmitAnswer = () => {
        if (selectedOption === null) return;

        const isCorrect = selectedOption === question.correctIndex;
        const newAnswer: ReadingAnswer = {
            questionId: question.id,
            selectedOption,
            correct: isCorrect,
        };

        const newAnswers = [...answers.filter((a) => a.questionId !== question.id), newAnswer];
        setAnswers(newAnswers);
        setShowFeedback(true);

        // Calculate score and update parent
        const score = (newAnswers.filter((a) => a.correct).length / questions.length) * 100;
        onUpdate({ answers: newAnswers, score });
    };

    const handleNext = () => {
        if (!isLastQuestion) {
            setCurrentQuestion((prev) => prev + 1);
            setSelectedOption(null);
            setShowFeedback(false);
        }
    };

    return (
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                        <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <span className="text-lg">Reading Comprehension</span>
                        <p className="text-sm font-normal text-muted-foreground">
                            Question {currentQuestion + 1} of {questions.length}
                        </p>
                    </div>
                    <div className="ml-auto px-3 py-1 rounded-full bg-primary/10 text-sm text-primary">
                        {question.level}
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Passage */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border">
                    <p className="text-lg leading-relaxed">{question.passage}</p>
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
                                    disabled={showFeedback}
                                    className={cn(
                                        "h-auto p-4 justify-start text-left transition-all",
                                        isSelected && !showFeedback && "border-primary bg-primary/10",
                                        showAsCorrect && "border-chart-4 bg-chart-4/10 text-chart-4",
                                        showAsWrong && "border-destructive bg-destructive/10 text-destructive"
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
                </div>

                {/* Feedback */}
                {showFeedback && (
                    <div
                        className={cn(
                            "p-4 rounded-xl",
                            selectedOption === question.correctIndex
                                ? "bg-chart-4/10 border border-chart-4/20"
                                : "bg-chart-3/10 border border-chart-3/20"
                        )}
                    >
                        <p className={cn(
                            "font-medium",
                            selectedOption === question.correctIndex ? "text-chart-4" : "text-chart-3"
                        )}>
                            {selectedOption === question.correctIndex
                                ? "Corect! Great job!"
                                : "Not quite, but that's okay! Learning from mistakes is part of the journey."}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    {!showFeedback ? (
                        <Button
                            onClick={handleSubmitAnswer}
                            disabled={selectedOption === null}
                            className="bg-primary hover:bg-primary/80"
                        >
                            Check Answer
                        </Button>
                    ) : !isLastQuestion ? (
                        <Button onClick={handleNext} className="gap-2 bg-primary hover:bg-primary/80">
                            Next Question
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            Reading test complete! Click &quot;Continue&quot; above to proceed.
                        </div>
                    )}
                </div>

                {/* Progress indicators */}
                <div className="flex justify-center gap-2 pt-4">
                    {questions.map((q, index) => {
                        const answered = answers.some(
                            (a) => a.questionId === q.id
                        );
                        const isCorrect = answers.find(
                            (a) => a.questionId === q.id
                        )?.correct;

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "w-3 h-3 rounded-full transition-all",
                                    index === currentQuestion && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                                    answered
                                        ? isCorrect
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
