"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageSquare, Send, Loader2, Sparkles, User, X, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
    id: string;
    role: "tutor" | "user";
    content: string;
    timestamp: Date;
}

export function TutorTutorialOverlay() {
    const router = useRouter();
    const pathname = usePathname();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: "tutor-initial",
                    role: "tutor",
                    content: "Buna! Welcome to ChaosLimbă. I'm your Tutor, here to show you around. Before we start the tour, what is your main goal for learning Romanian?",
                    timestamp: new Date()
                }
            ]);
        }
    }, [messages.length]);

    useEffect(() => {
        if (!isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isMinimized]);

    const completeTutorial = async () => {
        try {
            await fetch("/api/onboarding/tutorial/complete", { method: "POST" });
            setIsVisible(false);
        } catch (e) {
            console.error("Failed to complete tutorial:", e);
        }
    };

    const handleSubmit = useCallback(async () => {
        const trimmed = inputText.trim();
        if (trimmed.length < 1 || isLoading) return; // Allow short answers like "ok"

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
            const response = await fetch("/api/onboarding/tutorial", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationHistory: updatedMessages,
                    currentUrl: pathname,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get tutor response");
            }

            const data = await response.json();

            const tutorMessage: ChatMessage = {
                id: `tutor-${Date.now()}`,
                role: "tutor",
                content: data.response,
                timestamp: new Date(),
            };

            setMessages([...updatedMessages, tutorMessage]);

            if (data.navigate && data.navigate !== pathname) {
                router.push(data.navigate);
            }

            if (data.endTutorial) {
                await completeTutorial();
            }

        } catch (e) {
            console.error("Tutorial tutor error:", e);
            setMessages([...updatedMessages, {
                id: `tutor-error-${Date.now()}`,
                role: "tutor",
                content: "Hmm, let me catch my breath! Could you say that again?",
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [inputText, messages, pathname, router, isLoading]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {!isMinimized && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="pointer-events-auto"
                    >
                        <Card className="w-[calc(100vw-2.5rem)] sm:w-[380px] shadow-2xl border-primary/30 bg-background/95 backdrop-blur overflow-hidden flex flex-col mb-4">
                            <CardHeader className="py-3 px-4 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    Tutor Tour Guide
                                </CardTitle>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px] min-w-[44px]" onClick={() => setIsMinimized(true)}>
                                        <Minimize2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive" onClick={() => completeTutorial()}>
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex flex-col h-[400px]">
                                {/* Chat Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map((message) => (
                                        <div key={message.id} className={cn("flex gap-2", message.role === "user" && "flex-row-reverse")}>
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                                                message.role === "tutor" ? "bg-primary/20" : "bg-accent/20"
                                            )}>
                                                {message.role === "tutor" ? <Sparkles className="h-3 w-3 text-primary" /> : <User className="h-3 w-3 text-accent" />}
                                            </div>
                                            <div className={cn(
                                                "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                                                message.role === "tutor" ? "bg-primary/10 border border-primary/20 rounded-tl-sm" : "bg-accent/10 border border-accent/20 rounded-tr-sm"
                                            )}>
                                                <p className="whitespace-pre-wrap">{message.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                                            </div>
                                            <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tl-sm px-3 py-2">
                                                <div className="flex gap-1 h-3 items-center">
                                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                                
                                {/* Input Area */}
                                <div className="p-3 bg-muted/20 border-t flex gap-2">
                                    <textarea
                                        ref={inputRef}
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Type..."
                                        className="flex-1 min-h-[40px] max-h-[80px] rounded-lg bg-background border border-primary/20 p-2 text-sm focus:ring-1 focus:ring-primary/30 focus:outline-none resize-none"
                                        disabled={isLoading}
                                    />
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={inputText.trim().length < 1 || isLoading}
                                        size="icon"
                                        className="bg-primary hover:bg-primary/80 shrink-0 self-end"
                                    >
                                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Minimized Chat Head */}
            <AnimatePresence>
                {isMinimized && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="pointer-events-auto h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center hover:scale-110 transition-transform relative"
                        onClick={() => setIsMinimized(false)}
                    >
                        <MessageSquare className="h-6 w-6" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-accent border-[2px] border-background"></span>
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
