"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Loader2,
    CheckCircle2,
    XCircle,
    ArrowRight,
    SkipForward,
} from "lucide-react"
import type { ContentItem } from "@/lib/db/schema"
import type { QuizQuestion } from "@/app/api/deep-fog/quiz/route"

interface Props {
    content: ContentItem;
    userLevel: string;
    onComplete: (score: number, total: number) => void;
    onSkip: () => void;
}

interface AnswerRecord {
    question: QuizQuestion;
    userAnswer: string;
    isCorrect: boolean;
}

export function DeepFogQuiz({ content, userLevel, onComplete, onSkip }: Props) {
    const [questions, setQuestions] = useState<QuizQuestion[]>([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<AnswerRecord[]>([])
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [fillAnswer, setFillAnswer] = useState("")
    const [answered, setAnswered] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Fetch questions on mount
    useEffect(() => {
        async function fetchQuestions() {
            try {
                const textContent = content.textContent || content.transcript
                if (!textContent) {
                    onSkip()
                    return
                }

                const res = await fetch("/api/deep-fog/quiz", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ textContent, userLevel }),
                })

                if (!res.ok) throw new Error("Failed to generate quiz")
                const data = await res.json()

                if (!data.questions || data.questions.length === 0) {
                    onSkip()
                    return
                }

                setQuestions(data.questions)
            } catch {
                onSkip()
            } finally {
                setLoading(false)
            }
        }

        fetchQuestions()
    }, [content, userLevel, onSkip])

    const currentQuestion = questions[currentIndex]
    const isLastQuestion = currentIndex === questions.length - 1

    const handleMCSelect = (option: string) => {
        if (answered) return
        setSelectedOption(option)
        setAnswered(true)

        setAnswers(prev => [...prev, {
            question: currentQuestion,
            userAnswer: option,
            isCorrect: option === currentQuestion.correctAnswer,
        }])
    }

    const handleFillSubmit = () => {
        if (!fillAnswer.trim() || answered) return
        setAnswered(true)

        const isCorrect = fillAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
        setAnswers(prev => [...prev, {
            question: currentQuestion,
            userAnswer: fillAnswer.trim(),
            isCorrect,
        }])
    }

    const handleNext = async () => {
        if (isLastQuestion) {
            // Submit all answers
            setSubmitting(true)
            const allAnswers = answers
            const score = allAnswers.filter(a => a.isCorrect).length

            try {
                await fetch("/api/deep-fog/quiz/submit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contentId: content.id,
                        answers: allAnswers,
                    }),
                })
            } catch {
                // Non-critical — submit failed
            }

            onComplete(score, allAnswers.length)
            return
        }

        // Move to next question
        setCurrentIndex(prev => prev + 1)
        setSelectedOption(null)
        setFillAnswer("")
        setAnswered(false)
    }

    if (loading) {
        return (
            <Card className="border-primary/30">
                <CardContent className="pt-6 text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Generating comprehension questions...</p>
                </CardContent>
            </Card>
        )
    }

    if (!currentQuestion) return null

    const currentAnswer = answered ? answers[answers.length - 1] : null

    return (
        <Card className="border-primary/30">
            <CardContent className="pt-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 'Fill in the Blank'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {currentIndex + 1} / {questions.length}
                        </span>
                    </div>
                    <button
                        onClick={onSkip}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                        <SkipForward className="h-3 w-3" />
                        Skip Quiz
                    </button>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${((currentIndex + (answered ? 1 : 0)) / questions.length) * 100}%` }}
                    />
                </div>

                {/* Question */}
                <p className="text-sm font-medium">{currentQuestion.question}</p>

                {/* MC Options */}
                {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                    <div className="space-y-2">
                        {currentQuestion.options.map((option, i) => {
                            const isSelected = selectedOption === option
                            const isCorrect = option === currentQuestion.correctAnswer
                            const showResult = answered

                            let className = "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all "
                            if (showResult && isCorrect) {
                                className += "border-chart-4 bg-chart-4/10 text-chart-4"
                            } else if (showResult && isSelected && !isCorrect) {
                                className += "border-chart-5 bg-chart-5/10 text-chart-5"
                            } else if (!showResult) {
                                className += "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                            } else {
                                className += "border-border/50 text-muted-foreground"
                            }

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleMCSelect(option)}
                                    disabled={answered}
                                    className={className}
                                >
                                    <div className="flex items-center gap-2">
                                        {showResult && isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                                        {showResult && isSelected && !isCorrect && <XCircle className="h-4 w-4 shrink-0" />}
                                        <span>{option}</span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Fill in the Blank */}
                {currentQuestion.type === 'fill_in_blank' && (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Your answer..."
                                value={fillAnswer}
                                onChange={(e) => setFillAnswer(e.target.value)}
                                disabled={answered}
                                onKeyDown={(e) => e.key === 'Enter' && handleFillSubmit()}
                                className="flex-1"
                            />
                            {!answered && (
                                <Button
                                    onClick={handleFillSubmit}
                                    disabled={!fillAnswer.trim()}
                                    size="sm"
                                >
                                    Check
                                </Button>
                            )}
                        </div>
                        {answered && currentAnswer && !currentAnswer.isCorrect && (
                            <p className="text-sm text-chart-5">
                                Correct answer: <span className="font-medium">{currentQuestion.correctAnswer}</span>
                            </p>
                        )}
                    </div>
                )}

                {/* Feedback */}
                {answered && currentAnswer && (
                    <div className={`flex items-start gap-2 p-3 rounded-lg ${currentAnswer.isCorrect ? 'bg-chart-4/10' : 'bg-chart-5/10'}`}>
                        {currentAnswer.isCorrect ? (
                            <CheckCircle2 className="h-4 w-4 text-chart-4 mt-0.5 shrink-0" />
                        ) : (
                            <XCircle className="h-4 w-4 text-chart-5 mt-0.5 shrink-0" />
                        )}
                        <p className="text-sm text-foreground/80">{currentQuestion.explanation}</p>
                    </div>
                )}

                {/* Next / Finish button */}
                {answered && (
                    <Button
                        onClick={handleNext}
                        disabled={submitting}
                        className="w-full"
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : isLastQuestion ? (
                            <>Finish Quiz</>
                        ) : (
                            <>
                                Next Question
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
