import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userPreferences, errorLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { calculateCEFRLevel, type CEFRLevel } from '@/lib/proficiency';

interface OnboardingData {
    welcome?: {
        selfAssessment?: 'complete_beginner' | 'some_basics' | 'intermediate' | 'advanced';
    };
    // New: tutor-based assessment
    tutor?: {
        conversationHistory: Array<{ id: string; role: string; content: string }>;
        inferredLevel: CEFRLevel;
        confidence: number;
        reasoning: string;
    };
    tutorLevel?: CEFRLevel; // Shortcut for direct level passing
    // Legacy: old test-based assessment (deprecated)
    reading?: {
        answers: Array<{ questionId: string; correct: boolean }>;
        score: number;
    };
    listening?: {
        answers: Array<{ questionId: string; correct: boolean }>;
        score: number;
    };
    writing?: {
        responses: Array<{
            promptId: string;
            text: string;
            grammarScore?: number;
            errors?: Array<{ type: string; context?: string; correction?: string }>;
        }>;
        averageScore: number;
    };
    speaking?: {
        responses: Array<{
            promptId: string;
            transcript: string;
            grammarScore?: number;
            errors?: Array<{ type: string; context?: string; correction?: string }>;
        }>;
        averageScore: number;
    };
}

// POST /api/onboarding/complete - Complete onboarding and set initial level
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data: OnboardingData = await req.json();

        // Determine CEFR level - prioritize tutor assessment over legacy tests
        let level: CEFRLevel;

        if (data.tutorLevel) {
            // Direct tutor level from new flow
            level = data.tutorLevel;
        } else if (data.tutor?.inferredLevel) {
            // Tutor assessment from conversation
            level = data.tutor.inferredLevel;
        } else {
            // Fallback: Calculate from legacy test scores
            level = calculateCEFRLevel({
                selfAssessment: data.welcome?.selfAssessment,
                readingScore: data.reading?.score,
                listeningScore: data.listening?.score,
                writingScore: data.writing?.averageScore,
                speakingScore: data.speaking?.averageScore,
            });
        }

        // Upsert user preferences with level and mark onboarding complete
        await db
            .insert(userPreferences)
            .values({
                userId,
                languageLevel: level,
                onboardingCompleted: true,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: userPreferences.userId,
                set: {
                    languageLevel: level,
                    onboardingCompleted: true,
                    updatedAt: new Date(),
                },
            });

        // Seed Error Garden with errors from writing and speaking tests
        const errorsToSeed: Array<{
            userId: string;
            errorType: 'grammar' | 'pronunciation' | 'vocabulary' | 'word_order';
            category: string | null;
            context: string | null;
            correction: string | null;
            source: 'manual';
        }> = [];

        // Collect writing errors
        if (data.writing?.responses) {
            for (const response of data.writing.responses) {
                if (response.errors) {
                    for (const error of response.errors) {
                        errorsToSeed.push({
                            userId,
                            errorType: 'grammar',
                            category: error.type || null,
                            context: error.context || null,
                            correction: error.correction || null,
                            source: 'manual',
                        });
                    }
                }
            }
        }

        // Collect speaking errors
        if (data.speaking?.responses) {
            for (const response of data.speaking.responses) {
                if (response.errors) {
                    for (const error of response.errors) {
                        errorsToSeed.push({
                            userId,
                            errorType: 'grammar',
                            category: error.type || null,
                            context: error.context || null,
                            correction: error.correction || null,
                            source: 'manual',
                        });
                    }
                }
            }
        }

        // Insert errors into Error Garden (limit to first 10 to avoid spam)
        if (errorsToSeed.length > 0) {
            await db.insert(errorLogs).values(errorsToSeed.slice(0, 10));
        }

        return NextResponse.json({
            success: true,
            level,
            errorsSeeded: Math.min(errorsToSeed.length, 10),
        });
    } catch (error) {
        console.error('Onboarding completion failed:', error);
        return NextResponse.json(
            { error: 'Failed to complete onboarding' },
            { status: 500 }
        );
    }
}
