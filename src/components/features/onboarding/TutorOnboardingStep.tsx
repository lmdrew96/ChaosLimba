"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquare, Send, Loader2, Sparkles, User } from "lucide-react";
import type { CEFRLevel } from "@/lib/proficiency";

interface ChatMessage {
    id: string;
    role: "tutor" | "user";
    content: string;
    timestamp: Date;
}

export interface TutorOnboardingResult {
    conversationHistory: ChatMessage[];
    inferredLevel: CEFRLevel;
    confidence: number;
    reasoning: string;
}

interface TutorOnboardingStepProps {
    selfAssessment?: string;
    data?: TutorOnboardingResult;
    onUpdate: (data: TutorOnboardingResult) => void;
}

// Opening messages based on self-assessment
const OPENING_MESSAGES: Record<string, string> = {
    complete_beginner: `Bună! 👋 Welcome to ChaosLimbă! I see you're just starting your Romanian journey - that's exciting!

Don't worry, I'll speak mostly in English. Let's chat a bit so I can understand where you are. What brought you to learning Romanian?`,

    some_basics: `Bună ziua! 👋 Welcome to ChaosLimbă! I see you already know some basics - foarte bine!

Let's have a quick chat so I can find your level. Poți să-mi spui, in Romanian or English, what you already know?`,

    intermediate: `Bună! 👋 Bine ai venit la ChaosLimbă! Văd că ai deja experiență cu româna.

Hai să vorbim puțin ca să văd nivelul tău exact. Cum ai învățat limba română până acum?`,

    advanced: `Salut! 🎭 Bine ai venit la ChaosLimbă! Înțeleg că ești destul de avansat cu limba română.

Hai să vedem - povestește-mi puțin despre experiența ta cu româna. Unde ai învățat-o și cât de des o folosești?`,
};

export function TutorOnboardingStep({ selfAssessment, data, onUpdate }: TutorOnboardingStepProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(data?.conversationHistory || []);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [assessmentComplete, setAssessmentComplete] = useState(!!data?.inferredLevel);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Initialize with opening message
    useEffect(() => {
        if (messages.length === 0 && selfAssessment) {
            const openingMessage = OPENING_MESSAGES[selfAssessment] || OPENING_MESSAGES.complete_beginner;
            const initialMessage: ChatMessage = {
                id: "tutor-0",
                role: "tutor",
                content: openingMessage,
                timestamp: new Date(),
            };
            setMessages([initialMessage]);
        }
    }, [selfAssessment, messages.length]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input after tutor responds
    useEffect(() => {
        if (!isLoading && messages.length > 0) {
            inputRef.current?.focus();
        }
    }, [isLoading, messages.length]);

    const handleSubmit = useCallback(async () => {
        const trimmed = inputText.trim();
        if (trimmed.length < 2 || isLoading) return;

        // Add user message
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: trimmed,
            timestamp: new Date(),
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInputText("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/onboarding/tutor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationHistory: updatedMessages,
                    selfAssessment,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get tutor response");
            }

            const data = await response.json();

            // Add tutor response
            const tutorMessage: ChatMessage = {
                id: `tutor-${Date.now()}`,
                role: "tutor",
                content: data.response,
                timestamp: new Date(),
            };

            const finalMessages = [...updatedMessages, tutorMessage];
            setMessages(finalMessages);

            // Check if assessment is complete
            if (data.assessmentComplete) {
                setAssessmentComplete(true);
                onUpdate({
                    conversationHistory: finalMessages,
                    inferredLevel: data.inferredLevel,
                    confidence: data.confidence,
                    reasoning: data.reasoning,
                });
            } else {
                // Partial update - still in progress
                onUpdate({
                    conversationHistory: finalMessages,
                    inferredLevel: data.inferredLevel || "A1",
                    confidence: data.confidence || 0,
                    reasoning: data.reasoning || "Assessment in progress",
                });
            }

        } catch (error) {
            console.error("Tutor API error:", error);
            // Add error message from tutor
            const errorMessage: ChatMessage = {
                id: `tutor-error-${Date.now()}`,
                role: "tutor",
                content: "Hmm, I seem to have lost my train of thought! 🤔 Could you repeat that?",
                timestamp: new Date(),
            };
            setMessages([...updatedMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [inputText, messages, selfAssessment, isLoading, onUpdate]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <Card className="border-purple-500/20 bg-card/50 backdrop-blur">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <MessageSquare className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                        <span className="text-lg">Chat with Your Tutor</span>
                        <p className="text-sm font-normal text-muted-foreground">
                            Let's have a conversation to find your level
                        </p>
                    </div>
                    {assessmentComplete && (
                        <div className="ml-auto px-3 py-1 rounded-full bg-green-500/20 text-sm text-green-400">
                            ✓ Ready to continue
                        </div>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Chat Messages */}
                <div className="h-[400px] overflow-y-auto space-y-4 p-4 rounded-xl bg-background/50 border border-white/5">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex gap-3",
                                message.role === "user" && "flex-row-reverse"
                            )}
                        >
                            {/* Avatar */}
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                    message.role === "tutor"
                                        ? "bg-purple-500/20"
                                        : "bg-blue-500/20"
                                )}
                            >
                                {message.role === "tutor" ? (
                                    <Sparkles className="h-4 w-4 text-purple-400" />
                                ) : (
                                    <User className="h-4 w-4 text-blue-400" />
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-3",
                                    message.role === "tutor"
                                        ? "bg-purple-500/10 border border-purple-500/20"
                                        : "bg-blue-500/10 border border-blue-500/20"
                                )}
                            >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                            </div>
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-3">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="flex gap-3">
                    <textarea
                        ref={inputRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your response..."
                        className="flex-1 min-h-[60px] max-h-[120px] rounded-xl bg-background border border-purple-500/20 p-3 focus:ring-2 focus:ring-purple-500/30 focus:outline-none resize-none"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={inputText.trim().length < 2 || isLoading}
                        className="bg-purple-600 hover:bg-purple-700 rounded-xl px-6"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Hint */}
                <p className="text-xs text-muted-foreground text-center">
                    💡 Speak naturally! Romanian, English, or a mix - whatever feels comfortable.
                </p>
            </CardContent>
        </Card>
    );
}
