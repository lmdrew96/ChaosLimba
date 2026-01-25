"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronRight } from "lucide-react";

export interface ReadingAnswer {
    questionId: string;
    selectedOption: number;
    correct: boolean;
}

export interface ReadingResult {
    answers: ReadingAnswer[];
    score: number; // 0-100
}

interface ReadingTestStepProps {
    selfAssessment?: string;
    data?: ReadingResult;
    onUpdate: (data: ReadingResult) => void;
}

// Reading passages and questions at different levels
const READING_QUESTIONS = [
    {
        id: "r1",
        level: "A1",
        passage: "Bună ziua! Mă numesc Maria. Eu sunt din București. Am 25 de ani.",
        question: "Cum se numește femeia?",
        options: ["Ana", "Maria", "Elena", "Ioana"],
        correctIndex: 1,
    },
    {
        id: "r2",
        level: "A2",
        passage: "Astăzi mergem la piață. Vrem să cumpărăm legume proaspete: roșii, castraveți și ardei. Mama pregătește o salată pentru cină.",
        question: "Ce vor să cumpere de la piață?",
        options: ["Fructe", "Carne", "Legume", "Pâine"],
        correctIndex: 2,
    },
    {
        id: "r3",
        level: "B1",
        passage: "România este situată în sud-estul Europei. Capitala țării este București, cel mai mare oraș din țară. Limba oficială este româna, o limbă romanică derivată din latină.",
        question: "Din ce limbă derivă limba română?",
        options: ["Slavă", "Greacă", "Latină", "Germană"],
        correctIndex: 2,
    },
    {
        id: "r4",
        level: "B2",
        passage: "Transfăgărășanul este un drum montan spectaculos care traversează Munții Făgăraș. Construit în anii 1970, drumul a fost conceput inițial pentru scopuri militare, dar a devenit una dintre cele mai populare atracții turistice din România.",
        question: "Care a fost scopul inițial al construcției Transfăgărășanului?",
        options: ["Turism", "Militar", "Comercial", "Agricol"],
        correctIndex: 1,
    },
];

export function ReadingTestStep({ selfAssessment, data, onUpdate }: ReadingTestStepProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<ReadingAnswer[]>(data?.answers || []);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);

    const question = READING_QUESTIONS[currentQuestion];
    const isLastQuestion = currentQuestion === READING_QUESTIONS.length - 1;
    const existingAnswer = answers.find((a) => a.questionId === question.id);

    const handleSelect = (optionIndex: number) => {
        if (showFeedback) return;
        setSelectedOption(optionIndex);
    };

    const handleSubmitAnswer = useCallback(() => {
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
        const score = (newAnswers.filter((a) => a.correct).length / READING_QUESTIONS.length) * 100;
        onUpdate({ answers: newAnswers, score });
    }, [selectedOption, question, answers, onUpdate]);

    const handleNext = () => {
        if (!isLastQuestion) {
            setCurrentQuestion((prev) => prev + 1);
            setSelectedOption(null);
            setShowFeedback(false);
        }
    };

    return (
        <Card className="border-purple-500/20 bg-card/50 backdrop-blur">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <BookOpen className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                        <span className="text-lg">Reading Comprehension</span>
                        <p className="text-sm font-normal text-muted-foreground">
                            Question {currentQuestion + 1} of {READING_QUESTIONS.length}
                        </p>
                    </div>
                    <div className="ml-auto px-3 py-1 rounded-full bg-purple-500/10 text-sm text-purple-300">
                        {question.level}
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Passage */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
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
                                        isSelected && !showFeedback && "border-purple-500 bg-purple-500/10",
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
                                ? "🎉 Corect! Great job!"
                                : "💡 Not quite, but that's okay! Learning from mistakes is part of the journey."}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    {!showFeedback ? (
                        <Button
                            onClick={handleSubmitAnswer}
                            disabled={selectedOption === null}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            Check Answer
                        </Button>
                    ) : !isLastQuestion ? (
                        <Button onClick={handleNext} className="gap-2 bg-purple-600 hover:bg-purple-700">
                            Next Question
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            ✓ Reading test complete! Click "Continue" above to proceed.
                        </div>
                    )}
                </div>

                {/* Progress indicators */}
                <div className="flex justify-center gap-2 pt-4">
                    {READING_QUESTIONS.map((_, index) => {
                        const answered = answers.some(
                            (a) => a.questionId === READING_QUESTIONS[index].id
                        );
                        const isCorrect = answers.find(
                            (a) => a.questionId === READING_QUESTIONS[index].id
                        )?.correct;

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "w-3 h-3 rounded-full transition-all",
                                    index === currentQuestion && "ring-2 ring-purple-500 ring-offset-2 ring-offset-background",
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
