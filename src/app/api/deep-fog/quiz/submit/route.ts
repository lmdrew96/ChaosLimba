import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { saveErrorPatternsToGarden } from "@/lib/db/queries";
import { recordSessionProficiency } from "@/lib/proficiency";
import type { ExtractedErrorPattern } from "@/types/aggregator";
import { NextResponse } from "next/server";
import type { QuizQuestion } from "../route";

interface QuizAnswer {
    question: QuizQuestion;
    userAnswer: string;
    isCorrect: boolean;
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { contentId, answers } = await req.json() as {
            contentId?: string;
            answers: QuizAnswer[];
        };

        if (!answers || answers.length === 0) {
            return new NextResponse("Answers are required", { status: 400 });
        }

        const wrongAnswers = answers.filter(a => !a.isCorrect);
        const score = answers.length - wrongAnswers.length;

        // Only create session and log errors if there were wrong answers
        if (wrongAnswers.length > 0) {
            const [session] = await db.insert(sessions).values({
                userId,
                sessionType: 'deep_fog',
                contentId: contentId || null,
            }).returning();

            const errorPatterns: ExtractedErrorPattern[] = wrongAnswers.map(a => ({
                type: 'grammar' as const,
                category: a.question.targetFeature || 'comprehension',
                pattern: `${a.userAnswer} → ${a.question.correctAnswer}`,
                learnerProduction: a.userAnswer,
                correctForm: a.question.correctAnswer,
                confidence: 0.9,
                severity: 'medium' as const,
                inputType: 'text' as const,
                feedbackType: 'error' as const,
            }));

            // Fire-and-forget
            saveErrorPatternsToGarden(errorPatterns, userId, session.id, 'deep_fog', 'text')
                .then(() => recordSessionProficiency(userId, session.id))
                .catch(err => console.error('[Deep Fog Quiz] Failed to save errors:', err));
        }

        return NextResponse.json({
            score,
            total: answers.length,
        });
    } catch (error) {
        console.error("[Deep Fog Quiz Submit API]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
