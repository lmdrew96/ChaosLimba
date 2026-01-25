"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trophy, BookOpen, Headphones, PenTool, Mic, ArrowRight, Sparkles } from "lucide-react";
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
    const level = data.calculatedLevel || "A1";
    const info = CEFR_INFO[level];

    // Calculate individual skill scores
    const readingScore = data.reading?.score || 0;
    const listeningScore = data.listening?.score || 0;
    const writingScore = data.writing?.averageScore || 0;
    const speakingScore = data.speaking?.averageScore || 0;

    const skills = [
        { name: "Reading", score: readingScore, icon: BookOpen, color: "text-purple-400" },
        { name: "Listening", score: listeningScore, icon: Headphones, color: "text-indigo-400" },
        { name: "Writing", score: writingScore, icon: PenTool, color: "text-emerald-400" },
        { name: "Speaking", score: speakingScore, icon: Mic, color: "text-rose-400" },
    ];

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

                {/* Skill Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-4"
                >
                    <h2 className="text-lg font-medium text-center">Your Skill Breakdown</h2>

                    <div className="grid grid-cols-2 gap-4">
                        {skills.map((skill, index) => (
                            <motion.div
                                key={skill.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + index * 0.1 }}
                                className="p-4 rounded-xl bg-white/5 border border-white/10"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <skill.icon className={cn("h-5 w-5", skill.color)} />
                                    <span className="font-medium">{skill.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className={cn(
                                                "h-full rounded-full",
                                                skill.score >= 70 ? "bg-green-500" : skill.score >= 50 ? "bg-amber-500" : "bg-red-500"
                                            )}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${skill.score}%` }}
                                            transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium w-12 text-right">
                                        {Math.round(skill.score)}%
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* What's Next */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
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
                                <li>• Errors from this test are in your Error Garden</li>
                                <li>• Start with a Chaos Window session for targeted practice</li>
                                <li>• Explore Deep Fog Mode to challenge yourself</li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
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
                    transition={{ delay: 1.5 }}
                    className="text-center text-sm text-muted-foreground italic"
                >
                    "We provide the method. You provide the mess." 🎭
                </motion.p>
            </CardContent>
        </Card>
    );
}
