import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service | ChaosLimbă",
    description: "Terms of Service for ChaosLimbă - Romanian language learning platform",
};

export default function TermsOfServicePage() {
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
                    <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
                    <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
                </div>

                {/* Content */}
                <div className="prose prose-invert prose-purple max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">👋 Welcome to ChaosLimbă</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By using ChaosLimbă (&quot;the Service&quot;), you agree to these Terms of Service.
                            ChaosLimbă is an AI-powered Romanian language learning platform designed for
                            learners who thrive in structured chaos. Please read these terms carefully.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">⚠️ Beta / Preview Status</h2>
                        <div className="bg-chart-3/10 border border-chart-3/30 rounded-lg p-4">
                            <p className="text-chart-3 leading-relaxed">
                                <strong>IMPORTANT:</strong> ChaosLimbă is currently in <strong>live preview</strong> mode.
                                This means:
                            </p>
                            <ul className="list-disc list-inside text-chart-3 space-y-2 mt-4">
                                <li>Features may change, break, or be removed without notice</li>
                                <li>Data may be reset or migrated during updates</li>
                                <li>The service may experience downtime</li>
                                <li>AI outputs may contain errors or inaccuracies</li>
                                <li>Not all planned features are available yet</li>
                            </ul>
                            <p className="text-chart-3 leading-relaxed mt-4">
                                By using the preview, you acknowledge and accept these limitations.
                                We appreciate your patience and feedback as we build this together!
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">👤 Eligibility</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You must be at least <strong className="text-primary">16 years of age</strong> to use ChaosLimbă.
                            If you are under 18, we recommend reviewing these terms with a parent or guardian.
                            By creating an account, you confirm that you meet this age requirement.
                            This threshold complies with the EU General Data Protection Regulation (GDPR) Article 8.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">✅ Acceptable Use</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            When using ChaosLimbă, you agree to:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Use the service for personal language learning purposes</li>
                            <li>Provide accurate account information</li>
                            <li>Keep your account credentials secure</li>
                            <li>Respect other users and the ChaosLimbă community</li>
                            <li>Not attempt to reverse engineer or exploit the service</li>
                            <li>Not use the service for any illegal purposes</li>
                            <li>Not upload harmful, offensive, or inappropriate content</li>
                            <li>Not attempt to circumvent any usage limits or restrictions</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">📝 Your Content</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            When you use ChaosLimbă, you create content (text, audio recordings, notes, etc.).
                            You retain ownership of your content, but you grant us a license to:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                            <li>Store and display your content back to you</li>
                            <li>Process your content through our AI systems to provide feedback</li>
                            <li>Use anonymized, aggregated data to improve our AI models</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-4">
                            We will never share your individual content with third parties without your permission.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">🤖 AI-Generated Content</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            ChaosLimbă uses AI to provide grammar feedback, pronunciation assessment,
                            tutoring, and other features. Important notes:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                            <li><strong className="text-primary">AI is not perfect:</strong> Feedback may contain errors. Always verify important information.</li>
                            <li><strong className="text-primary">Not a replacement:</strong> AI tutoring supplements, not replaces, human instruction.</li>
                            <li><strong className="text-primary">Continuous improvement:</strong> Our models improve over time with usage and feedback.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">💳 Payments & Subscriptions</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            During the live preview period, ChaosLimbă is <strong className="text-green-400">free to use</strong>.
                            When we introduce paid features:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                            <li>We&apos;ll provide advance notice of any pricing changes</li>
                            <li>Early preview users may receive special benefits</li>
                            <li>Core learning features will remain accessible</li>
                            <li>Subscription details will be clearly communicated before any charges</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">🚫 Disclaimers</h2>
                        <div className="bg-muted/50 border border-border rounded-lg p-4">
                            <p className="text-muted-foreground leading-relaxed">
                                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND. WE DO NOT GUARANTEE:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                                <li>That you will achieve any particular learning outcomes</li>
                                <li>That the service will be uninterrupted or error-free</li>
                                <li>The accuracy of AI-generated feedback or content</li>
                                <li>That your data will never be lost (please keep local backups of important content)</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">⚖️ Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            To the maximum extent permitted by law, ChaosLimbă and its creator(s) shall not be
                            liable for any indirect, incidental, special, consequential, or punitive damages,
                            or any loss of profits or revenues, whether incurred directly or indirectly, or any
                            loss of data, use, goodwill, or other intangible losses resulting from:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                            <li>Your use or inability to use the service</li>
                            <li>Any errors or inaccuracies in AI-generated content</li>
                            <li>Unauthorized access to your data</li>
                            <li>Service interruptions or data loss</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">🔄 Account Termination</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You may delete your account at any time. We may suspend or terminate accounts that
                            violate these terms. Upon termination:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                            <li>You can request an export of your data before deletion</li>
                            <li>We&apos;ll delete your personal data within 30 days (some anonymized data may be retained)</li>
                            <li>These terms survive termination where applicable</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">📝 Changes to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may update these terms as ChaosLimbă evolves. We&apos;ll notify you of significant
                            changes via email or in-app notification. Continued use after changes means you
                            accept the new terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">📬 Contact</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Questions about these terms? Reach out at{" "}
                            <a href="mailto:nae@adhdesigns.dev" className="text-primary hover:text-primary/80 underline">
                                nae@adhdesigns.dev
                            </a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">🎯 The TL;DR</h2>
                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                            <ul className="list-disc list-inside text-foreground/80 space-y-2">
                                <li>This is a beta—expect bugs and changes</li>
                                <li>Use the service for learning, not mischief</li>
                                <li>AI feedback isn&apos;t perfect, use your judgment</li>
                                <li>Your content is yours, we just need to process it to help you learn</li>
                                <li>Currently free, future pricing will be communicated clearly</li>
                                <li>We&apos;re building this together—feedback welcome! 💜</li>
                            </ul>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-border">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <Link
                            href="/privacy"
                            className="text-primary hover:text-primary/80 transition-colors"
                        >
                            ← Privacy Policy
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
