"use client";

import { Shield } from "lucide-react";

interface ConsentStepProps {
    accepted: boolean;
    onUpdate: (accepted: boolean) => void;
}

export function ConsentStep({ accepted, onUpdate }: ConsentStepProps) {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 mb-2">
                    <Shield className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                    Before We Begin
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Please review our policies so you know exactly how your data is used.
                </p>
            </div>

            <div className="bg-card/50 border border-border/40 rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-foreground">Key Points</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                        <span className="text-primary shrink-0">1.</span>
                        <span>Your text and audio are processed by AI services (Groq, Anthropic, HuggingFace) to provide feedback. They are not stored by these providers beyond processing.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-primary shrink-0">2.</span>
                        <span>Analytics and research contribution are <strong className="text-primary">opt-in only</strong> — off by default. You control them in Settings.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-primary shrink-0">3.</span>
                        <span>You can export or delete all your data at any time from Settings.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-primary shrink-0">4.</span>
                        <span>Our Adaptation Engine automatically adjusts content difficulty based on your error patterns to help you learn more effectively.</span>
                    </li>
                </ul>
            </div>

            <label
                htmlFor="consent-checkbox"
                className="flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-card/30 hover:bg-card/50 transition-colors cursor-pointer"
            >
                <input
                    type="checkbox"
                    id="consent-checkbox"
                    checked={accepted}
                    onChange={(e) => onUpdate(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-primary/50 text-primary focus:ring-primary/30 accent-primary cursor-pointer"
                />
                <span className="text-sm text-foreground leading-relaxed">
                    I have read and agree to the{" "}
                    <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 underline"
                    >
                        Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 underline"
                    >
                        Terms of Service
                    </a>
                    . I understand how my data is processed and my rights regarding it.
                </span>
            </label>
        </div>
    );
}
