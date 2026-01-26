"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trophy, MessageSquare, ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import type { OnboardingData } from "./OnboardingWizard";

interface ResultsStepProps {
    data: OnboardingData;
    onComplete: () => void;
}

const CEFR_INFO = {
    A1: {
        title: "Beginner",
        description: "You can understand and use basic phrases and introduce yourself.",
        emoji: "🌱",
        color: "from-green-500 to-emerald-500",
    },
    A2: {
        title: "Elementary",
        description: "You can communicate in simple tasks and describe your background.",
        emoji: "🌿",
        color: "from-green-400 to-teal-500",
    },
    B1: {
        title: "Intermediate",
        description: "You can handle most travel situations and describe experiences.",
        emoji: "🌳",
        color: "from-blue-500 to-cyan-500",
    },
    B2: {
        title: "Upper Intermediate",
        description: "You can interact fluently and produce detailed text on various topics.",
        emoji: "🏔️",
        color: "from-purple-500 to-indigo-500",
    },
    C1: {
        title: "Advanced",
        description: "You can express yourself fluently and use language flexibly.",
        emoji: "⭐",
        color: "from-amber-500 to-orange-500",
    },
    C2: {
        title: "Proficient",
        description: "You can understand virtually everything and express yourself spontaneously.",
        emoji: "🏆",
        color: "from-rose-500 to-pink-500",
    },
};

export function ResultsStep({ data, onComplete }: ResultsStepProps) {
    const level = data.calculatedLevel || data.tutor?.inferredLevel || "A1";
    const info = CEFR_INFO[level];
    const confidence = data.tutor?.confidence || 0.7;
    const reasoning = data.tutor?.reasoning;

    return (
        <Card className="border-purple-500/20 bg-card/50 backdrop-blur overflow-hidden">
            <CardContent className="p-8 space-y-8">
                {/* Celebration Header */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="text-center space-y-4"
                >
                    <motion.div
                        initial={{ rotate: -10 }}
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-7xl"
                    >
                        {info.emoji}
                    </motion.div>

                    <div className="space-y-2">
                        <p className="text-muted-foreground">Your Romanian Level</p>
                        <h1 className={cn(
                            "text-5xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                            info.color
                        )}>
                            {level} - {info.title}
                        </h1>
                    </div>

                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                        {info.description}
                    </p>
                </motion.div>

                {/* Sparkle animation */}
                <div className="flex justify-center gap-4 text-purple-400">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                        >
                            <Sparkles className="h-5 w-5" />
                        </motion.div>
                    ))}
                </div>

                {/* Tutor Assessment Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-4"
                >
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                                <MessageSquare className="h-5 w-5 text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-medium text-purple-300">Tutor Assessment</h3>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-xs",
                                        confidence >= 0.8
                                            ? "bg-green-500/20 text-green-400"
                                            : confidence >= 0.5
                                                ? "bg-amber-500/20 text-amber-400"
                                                : "bg-blue-500/20 text-blue-400"
                                    )}>
                                        {Math.round(confidence * 100)}% confidence
                                    </span>
                                </div>
                                {reasoning && (
                                    <p className="text-sm text-muted-foreground">{reasoning}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Conversation Stats */}
                    {data.tutor?.conversationHistory && (
                        <div className="flex justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                                <span className="text-muted-foreground">
                                    {data.tutor.conversationHistory.length} exchanges
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-purple-400" />
                                <span className="text-muted-foreground">
                                    Conversational assessment
                                </span>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* What's Next */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="rounded-xl bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 p-6"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-purple-500/20">
                            <Trophy className="h-6 w-6 text-purple-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-medium text-purple-300">What's Next?</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Your personalized content is ready at your level</li>
                                <li>• Start with a Chaos Window session for AI-guided practice</li>
                                <li>• Any struggles become seeds in your Error Garden</li>
                                <li>• Explore Deep Fog Mode when you're ready to push yourself</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="flex justify-center"
                >
                    <Button
                        size="lg"
                        onClick={onComplete}
                        className="gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-lg px-8"
                    >
                        Start Learning!
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </motion.div>

                {/* Encouraging footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                    className="text-center text-sm text-muted-foreground italic"
                >
                    "We provide the method. You provide the mess." 🎭
                </motion.p>
            </CardContent>
        </Card>
    );
}
