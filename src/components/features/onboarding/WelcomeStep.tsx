"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WelcomeData {
    selfAssessment: "complete_beginner" | "some_basics" | "intermediate" | "advanced";
    hasStudiedFormal?: boolean;
    nativeLanguage?: string;
}

interface WelcomeStepProps {
    data?: WelcomeData;
    onUpdate: (data: WelcomeData) => void;
}

const SELF_ASSESSMENT_OPTIONS = [
    {
        value: "complete_beginner" as const,
        emoji: "🌱",
        title: "Complete Beginner",
        description: "I know little to no Romanian",
    },
    {
        value: "some_basics" as const,
        emoji: "🌿",
        title: "Some Basics",
        description: "I know common phrases and basic grammar",
    },
    {
        value: "intermediate" as const,
        emoji: "🌳",
        title: "Intermediate",
        description: "I can hold simple conversations",
    },
    {
        value: "advanced" as const,
        emoji: "🏔️",
        title: "Advanced",
        description: "I'm quite comfortable with Romanian",
    },
];

export function WelcomeStep({ data, onUpdate }: WelcomeStepProps) {
    const [selected, setSelected] = useState<WelcomeData["selfAssessment"] | null>(
        data?.selfAssessment || null
    );

    const handleSelect = (value: WelcomeData["selfAssessment"]) => {
        setSelected(value);
        onUpdate({ ...data, selfAssessment: value });
    };

    return (
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardContent className="p-8 space-y-8">
                {/* Welcome Header */}
                <div className="text-center space-y-4">
                    <div className="text-6xl mb-4">🎭</div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                        Bine ai venit la ChaosLimbă!
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Welcome! Let's discover your Romanian level so we can personalize your learning journey.
                    </p>
                </div>

                {/* Self Assessment */}
                <div className="space-y-4">
                    <h2 className="text-lg font-medium text-center">
                        How would you describe your Romanian right now?
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {SELF_ASSESSMENT_OPTIONS.map((option) => (
                            <Button
                                key={option.value}
                                variant="outline"
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    "h-auto p-4 flex flex-col items-start gap-2 text-left transition-all duration-200",
                                    selected === option.value
                                        ? "border-primary bg-primary/10 ring-2 ring-primary/50"
                                        : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                                )}
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <span className="text-2xl">{option.emoji}</span>
                                    <span className="font-medium">{option.title}</span>
                                </div>
                                <p className="text-sm text-muted-foreground pl-10">
                                    {option.description}
                                </p>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Encouragement */}
                <div className="rounded-xl bg-chart-3/5 border border-chart-3/20 p-4">
                    <p className="text-sm text-muted-foreground italic text-center">
                        💡 Don't worry about getting this exactly right! <br />
                        The test ahead will help us fine-tune your level.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
