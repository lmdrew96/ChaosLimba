"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { WelcomeStep, type WelcomeData } from "./WelcomeStep";
import { TutorOnboardingStep, type TutorOnboardingResult } from "./TutorOnboardingStep";
import { ResultsStep } from "./ResultsStep";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CEFRLevel } from "@/lib/proficiency";

// Simplified steps - Welcome → Tutor Chat → Results
const STEPS = [
    { id: "welcome", label: "Welcome", icon: "👋" },
    { id: "tutor", label: "Chat", icon: "💬" },
    { id: "results", label: "Results", icon: "🎉" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// Types for collected data
export interface OnboardingData {
    welcome?: WelcomeData;
    tutor?: TutorOnboardingResult;
    calculatedLevel?: CEFRLevel;
}

export function OnboardingWizard() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<StepId>("welcome");
    const [data, setData] = useState<OnboardingData>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    const isFirstStep = currentIndex === 0;
    const isLastStep = currentStep === "results";

    // Update data for a specific step
    const updateStepData = useCallback(<K extends keyof OnboardingData>(
        key: K,
        value: OnboardingData[K]
    ) => {
        setData((prev) => ({ ...prev, [key]: value }));
    }, []);

    // Navigation
    const goToNext = useCallback(async () => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < STEPS.length) {
            // If moving to results, save the tutor-determined level
            if (STEPS[nextIndex].id === "results") {
                setIsSubmitting(true);
                setError(null);

                try {
                    // Use the tutor's inferred level
                    const tutorLevel = data.tutor?.inferredLevel || "A1";

                    const response = await fetch("/api/onboarding/complete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            welcome: data.welcome,
                            tutor: data.tutor,
                            // Pass tutorLevel directly for the new flow
                            tutorLevel,
                        }),
                    });

                    if (!response.ok) {
                        throw new Error("Failed to complete onboarding");
                    }

                    const result = await response.json();
                    updateStepData("calculatedLevel", result.level);
                } catch (err) {
                    console.error("Onboarding completion failed:", err);
                    setError("Something went wrong. Please try again.");
                    setIsSubmitting(false);
                    return;
                }

                setIsSubmitting(false);
            }

            setCurrentStep(STEPS[nextIndex].id);
        }
    }, [currentIndex, data, updateStepData]);

    const goToPrevious = useCallback(() => {
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(STEPS[prevIndex].id);
        }
    }, [currentIndex]);

    // Handle completion
    const handleComplete = useCallback(() => {
        router.push("/");
    }, [router]);

    // Check if current step is complete enough to proceed
    const canProceed = useCallback(() => {
        switch (currentStep) {
            case "welcome":
                return !!data.welcome?.selfAssessment;
            case "tutor":
                // Need at least a few exchanges and some confidence
                return (
                    data.tutor?.conversationHistory &&
                    data.tutor.conversationHistory.length >= 4 &&
                    data.tutor.confidence >= 0.5
                );
            case "results":
                return true;
            default:
                return false;
        }
    }, [currentStep, data]);

    return (
        <div className="space-y-8">
            {/* Progress Bar */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    {STEPS.map((step, index) => {
                        const isActive = step.id === currentStep;
                        const isComplete = index < currentIndex;

                        return (
                            <div
                                key={step.id}
                                className={cn(
                                    "flex flex-col items-center gap-2 transition-all duration-300",
                                    isActive && "scale-110",
                                    !isActive && !isComplete && "opacity-50"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300",
                                        isComplete && "bg-green-500/20 border-2 border-green-500",
                                        isActive && "bg-purple-500/20 border-2 border-purple-500",
                                        !isActive && !isComplete && "bg-white/5 border-2 border-white/20"
                                    )}
                                >
                                    {isComplete ? "✓" : step.icon}
                                </div>
                                <span className={cn(
                                    "text-xs font-medium hidden sm:block",
                                    isActive ? "text-purple-300" : "text-muted-foreground"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Progress line */}
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-violet-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-center">
                    {error}
                </div>
            )}

            {/* Step Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {currentStep === "welcome" && (
                        <WelcomeStep
                            data={data.welcome}
                            onUpdate={(d) => updateStepData("welcome", d)}
                        />
                    )}
                    {currentStep === "tutor" && (
                        <TutorOnboardingStep
                            selfAssessment={data.welcome?.selfAssessment}
                            data={data.tutor}
                            onUpdate={(d) => updateStepData("tutor", d)}
                        />
                    )}
                    {currentStep === "results" && (
                        <ResultsStep
                            data={data}
                            onComplete={handleComplete}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            {currentStep !== "results" && (
                <div className="flex justify-between pt-4">
                    <Button
                        variant="ghost"
                        onClick={goToPrevious}
                        disabled={isFirstStep || isSubmitting}
                        className="gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </Button>

                    <Button
                        onClick={goToNext}
                        disabled={!canProceed() || isSubmitting}
                        className="gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Calculating...
                            </>
                        ) : currentIndex === STEPS.length - 2 ? (
                            "See My Results"
                        ) : (
                            <>
                                Continue
                                <ChevronRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
