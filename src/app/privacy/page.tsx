import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | ChaosLimbă",
    description: "Privacy Policy for ChaosLimbă - Romanian language learning platform",
};

export default function PrivacyPolicyPage() {
    const lastUpdated = "February 16, 2026";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
            <div className="max-w-4xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="mb-12">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm mb-6"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 28"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                        >
                            <path d="M 8 3.5 Q 12 7 16 3.5" />
                            <g transform="translate(0, 4)">
                                <circle cx="12" cy="12" r="1" />
                                <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
                                <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" />
                            </g>
                        </svg>
                        ← Back to ChaosLimbă
                    </Link>
                    <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
                    <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
                </div>

                {/* Content */}
                <div className="prose prose-invert prose-purple max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">🔒 Our Commitment to Your Privacy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            ChaosLimbă is built by a language learner, for language learners. We believe your learning data
                            is <strong className="text-primary">your data</strong>. We collect only what&apos;s necessary to
                            provide the service, and we never sell or share your personal information with third parties
                            for advertising purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">📊 Information We Collect</h2>

                        <h3 className="text-xl font-medium text-primary mt-6 mb-3">Account Information</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Email address (for account creation and communication)</li>
                            <li>Display name (optional)</li>
                            <li>Authentication data via Clerk (our auth provider)</li>
                        </ul>

                        <h3 className="text-xl font-medium text-primary mt-6 mb-3">Learning Data</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Text you write during practice sessions</li>
                            <li>Audio recordings (if you use speech features)</li>
                            <li>Error patterns and grammar feedback from AI analysis</li>
                            <li>Session timestamps and duration</li>
                            <li>Content you interact with (articles, videos, podcasts)</li>
                        </ul>

                        <h3 className="text-xl font-medium text-primary mt-6 mb-3">Technical Data</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Browser type and version</li>
                            <li>General location (country-level, for timezone purposes)</li>
                            <li>Error logs and performance metrics</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">🎯 How We Use Your Data</h2>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li><strong className="text-primary">To personalize your learning:</strong> Your errors become your curriculum through our Error Garden feature</li>
                            <li><strong className="text-primary">To improve our AI models:</strong> Aggregated, anonymized data helps us make grammar and pronunciation feedback better</li>
                            <li><strong className="text-primary">To provide the service:</strong> Account management, feature access, and communication</li>
                            <li><strong className="text-primary">To fix bugs:</strong> Error tracking helps us improve the platform</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">📈 Analytics & Consent Controls</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            ChaosLimbă uses <strong className="text-primary">Umami</strong>, a privacy-focused, open-source analytics tool.
                            Analytics are <strong className="text-primary">opt-in only</strong> — no tracking occurs unless you explicitly enable it in your Settings.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            When analytics are enabled, we collect:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Page views and navigation patterns (no personal data)</li>
                            <li>General device/browser type</li>
                            <li>Country-level location (no IP addresses are stored)</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4 mb-4">
                            You have two separate consent toggles in Settings:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li><strong className="text-primary">Anonymous Analytics:</strong> Controls whether Umami tracks your page views. Off by default.</li>
                            <li><strong className="text-primary">Contribute to Research:</strong> Controls whether your anonymized error patterns can be used for language learning research. Off by default.</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            Both can be toggled on or off at any time from your Settings page. Disabling takes effect immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">🔐 Data Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use industry-standard security measures including:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                            <li>HTTPS encryption for all data transmission</li>
                            <li>Secure authentication via Clerk</li>
                            <li>Database encryption at rest</li>
                            <li>Regular security audits</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">🤝 Third-Party Services & AI Data Processing</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            We use the following third-party services to provide ChaosLimbă:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li><strong className="text-primary">Clerk:</strong> Authentication and user management</li>
                            <li><strong className="text-primary">Vercel:</strong> Hosting and deployment</li>
                            <li><strong className="text-primary">Neon:</strong> Database hosting (encrypted at rest)</li>
                            <li><strong className="text-primary">Cloudflare R2:</strong> Audio file storage</li>
                            <li><strong className="text-primary">Groq:</strong> Speech recognition and conversational AI (your audio and text are sent to Groq for processing)</li>
                            <li><strong className="text-primary">Anthropic:</strong> Grammar analysis (your text is sent to Anthropic&apos;s Claude for grammar correction)</li>
                            <li><strong className="text-primary">HuggingFace:</strong> Semantic analysis and pronunciation assessment (text and audio data sent for inference)</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            <strong className="text-primary">Important:</strong> When you use AI features (grammar checking, speech recognition, tutoring),
                            your text and audio inputs are sent to the above AI providers for processing. These providers process your data according to their
                            own privacy policies. We do not use your inputs to train AI models — they are processed in real-time and not retained by these services
                            beyond what is necessary to deliver results.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            Each of these services has their own privacy policies. We encourage you to review them.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">📧 Your Rights</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You have the right to:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                            <li>Access your personal data</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your account and data</li>
                            <li>Export your learning data</li>
                            <li>Opt out of non-essential data collection</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            To exercise these rights, contact us at{" "}
                            <a href="mailto:nae@adhdesigns.dev" className="text-primary hover:text-primary/80 underline">
                                nae@adhdesigns.dev
                            </a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">⚠️ Beta / Preview Notice</h2>
                        <div className="bg-chart-3/10 border border-chart-3/30 rounded-lg p-4">
                            <p className="text-chart-3 leading-relaxed">
                                ChaosLimbă is currently in <strong>live preview</strong> mode. This means features may change,
                                data structures may be updated, and there may be bugs. While we take every precaution to protect
                                your data, please be aware that this is pre-release software. We recommend not uploading
                                sensitive personal information beyond what&apos;s required for the service.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">📝 Changes to This Policy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may update this privacy policy as ChaosLimbă evolves. We&apos;ll notify you of significant
                            changes via email or in-app notification. Continued use of the service after changes constitutes
                            acceptance of the updated policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">📬 Contact</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Questions about this privacy policy? Reach out at{" "}
                            <a href="mailto:nae@adhdesigns.dev" className="text-primary hover:text-primary/80 underline">
                                nae@adhdesigns.dev
                            </a>
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-border">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <Link
                            href="/terms"
                            className="text-primary hover:text-primary/80 transition-colors"
                        >
                            Terms of Service →
                        </Link>
                        <p className="text-muted-foreground/60 text-sm">
                            © 2026 ChaosLimbă. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
