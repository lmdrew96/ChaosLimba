import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/features/onboarding/OnboardingWizard";

export const metadata: Metadata = {
    title: "Welcome to ChaosLimbă - Proficiency Test",
    description: "Let's discover your Romanian proficiency level",
};

export default function OnboardingPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl">
                <OnboardingWizard />
            </div>
        </div>
    );
}
