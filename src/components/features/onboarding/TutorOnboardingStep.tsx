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

const FALLBACK_OPENING = "Bună! 👋 Welcome to ChaosLimbă! Let's chat a bit so I can find your level. Tell me about your Romanian learning experience!";

export function TutorOnboardingStep({ selfAssessment, data, onUpdate }: TutorOnboardingStepProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(data?.conversationHistory || []);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [assessmentComplete, setAssessmentComplete] = useState(!!data?.inferredLevel);
    const [openingMessages, setOpeningMessages] = useState<Record<string, string> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Fetch opening messages from DB
    useEffect(() => {
        async function fetchMessages() {
            try {
                const res = await fetch("/api/onboarding/tutor-messages");
                if (res.ok) {
                    const data = await res.json();
                    setOpeningMessages(data.messages);
                } else {
                    setOpeningMessages({});
                }
            } catch {
                setOpeningMessages({});
            }
        }
        fetchMessages();
    }, []);

    // Initialize with opening message once fetched
    useEffect(() => {
        if (messages.length === 0 && selfAssessment && openingMessages !== null) {
            const openingMessage = openingMessages[selfAssessment] || Object.values(openingMessages)[0] || FALLBACK_OPENING;
            const initialMessage: ChatMessage = {
                id: "tutor-0",
                role: "tutor",
                content: openingMessage,
                timestamp: new Date(),
            };
            setMessages([initialMessage]);
        }
    }, [selfAssessment, messages.length, openingMessages]);

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
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                        <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <span className="text-lg">Chat with Your Tutor</span>
                        <p className="text-sm font-normal text-muted-foreground">
                            Let's have a conversation to find your level
                        </p>
                    </div>
                    {assessmentComplete && (
                        <div className="ml-auto px-3 py-1 rounded-full bg-chart-4/20 text-sm text-chart-4">
                            ✓ Ready to continue
                        </div>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Chat Messages */}
                <div className="h-[400px] overflow-y-auto space-y-4 p-4 rounded-xl bg-background/50 border border-border">
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
                                        ? "bg-primary/20"
                                        : "bg-accent/20"
                                )}
                            >
                                {message.role === "tutor" ? (
                                    <Sparkles className="h-4 w-4 text-primary" />
                                ) : (
                                    <User className="h-4 w-4 text-accent" />
                                )}
                            </div>

                            {/* Message Bubble */}
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-3",
                                    message.role === "tutor"
                                        ? "bg-primary/10 border border-primary/20"
                                        : "bg-accent/10 border border-accent/20"
                                )}
                            >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                            </div>
                            <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
                        className="flex-1 min-h-[60px] max-h-[120px] rounded-xl bg-background border border-primary/20 p-3 focus:ring-2 focus:ring-primary/30 focus:outline-none resize-none"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={inputText.trim().length < 2 || isLoading}
                        className="bg-primary hover:bg-primary/80 rounded-xl px-6"
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
