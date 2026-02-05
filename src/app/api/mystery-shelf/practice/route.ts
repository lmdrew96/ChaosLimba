import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { mysteryItems, errorLogs, userPreferences } from "@/lib/db/schema";
import { callGroq } from "@/lib/ai/groq";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const GRADING_PROMPT = `You are a Romanian language tutor grading a student's practice sentence.

The student was asked to use a specific word in a sentence.
Grade their attempt and provide helpful feedback.

Return JSON:
{
  "isCorrect": true/false (did they use the word correctly?),
  "feedback": "Brief, encouraging feedback (2-3 sentences max). If incorrect, explain why and give a hint. If correct, praise the usage and maybe suggest a variation.",
  "grammarErrors": [
    {"incorrect": "...", "correct": "...", "type": "grammar type"}
  ] // empty array if no errors
}

Be encouraging but accurate. Focus on whether they used the target word correctly.
Small grammar errors elsewhere are worth mentioning but shouldn't make isCorrect = false if the target word usage is good.`;

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { itemId, word, userAnswer } = await req.json();

        if (!word || !userAnswer) {
            return new NextResponse("Word and answer are required", { status: 400 });
        }

        // Get user level for appropriate feedback
        const prefs = await db.select()
            .from(userPreferences)
            .where(eq(userPreferences.userId, userId));
        const userLevel = prefs[0]?.languageLevel || 'B1';

        // Grade the response using Groq
        const prompt = `
Target word: "${word}"
Student's sentence: "${userAnswer}"
Student's CEFR level: ${userLevel}

Grade this practice attempt.
`;

        const output = await callGroq([
            { role: "system", content: GRADING_PROMPT },
            { role: "user", content: prompt }
        ]);

        // Parse response
        const cleanJson = output.replace(/```json/g, "").replace(/```/g, "").trim();
        const effectiveJson = cleanJson.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        const result = JSON.parse(effectiveJson);

        // Log errors to Error Garden if any
        if (result.grammarErrors && result.grammarErrors.length > 0) {
            for (const error of result.grammarErrors) {
                await db.insert(errorLogs).values({
                    userId,
                    errorType: 'grammar',
                    category: error.type || 'mystery_shelf_practice',
                    context: userAnswer,
                    correction: error.correct,
                    source: 'mystery_shelf' as any, // Type assertion for new source
                    modality: 'text',
                    feedbackType: 'error',
                });
            }
        }

        // Update mystery item - mark as having been practiced
        if (itemId) {
            await db.update(mysteryItems)
                .set({ isExplored: true })
                .where(and(
                    eq(mysteryItems.id, itemId),
                    eq(mysteryItems.userId, userId)
                ));
        }

        return NextResponse.json({
            isCorrect: result.isCorrect,
            feedback: result.feedback,
            grammarErrors: result.grammarErrors || []
        });

    } catch (error) {
        console.error("[Mystery Practice API]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
