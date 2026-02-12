import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { learningNarratives } from "@/lib/db/schema";
import { getAutobiographyData } from "@/lib/db/queries";
import { callGroq } from "@/lib/ai/groq";
import { eq, and, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";

const NARRATIVE_SYSTEM_PROMPT = `You are a warm, insightful language learning narrator writing the story of a learner's Romanian language journey.

Your role is to transform raw learning data into a 2-3 paragraph narrative that:
- Celebrates concrete progress (mention specific numbers, patterns, breakthroughs)
- Acknowledges struggles honestly without being discouraging
- References specific error patterns by name when relevant (e.g. "verb conjugation", "gender agreement")
- Uses second person ("you") to address the learner directly
- Feels like a wise mentor reflecting on the learner's journey
- Highlights moments of growth, not just end states
- If there was a breakthrough (error frequency dropping), make it a narrative highlight
- If there were new word discoveries, weave them into the story
- End with something forward-looking and encouraging

Keep it personal, specific, and grounded in the actual data. Avoid generic motivational platitudes.
Do NOT use emoji. Do NOT use markdown formatting. Write plain prose paragraphs.`;

function buildNarrativePrompt(data: ReturnType<typeof getAutobiographyData> extends Promise<infer T> ? T : never): string {
    const parts: string[] = [
        `Learning period: ${data.periodStart.toLocaleDateString()} to ${data.periodEnd.toLocaleDateString()}`,
        `Sessions: ${data.sessionCount} (${data.totalMinutes} minutes total)`,
    ];

    if (Object.keys(data.sessionsByType).length > 0) {
        const types = Object.entries(data.sessionsByType)
            .map(([type, count]) => `${type.replace('_', ' ')}: ${count}`)
            .join(', ');
        parts.push(`Session types: ${types}`);
    }

    parts.push(`Errors logged: ${data.errorCount}`);
    if (data.topErrorType) {
        parts.push(`Most common error type: ${data.topErrorType}`);
    }

    if (data.resolvedPatterns > 0) {
        parts.push(`Error patterns resolved: ${data.resolvedPatterns}`);
    }

    if (data.biggestImprovement) {
        parts.push(`Biggest improvement: "${data.biggestImprovement.pattern}" dropped from ${data.biggestImprovement.before}% to ${data.biggestImprovement.after}% frequency`);
    }

    if (data.proficiencyDelta !== null) {
        const direction = data.proficiencyDelta > 0 ? 'improved' : data.proficiencyDelta < 0 ? 'dipped' : 'stayed steady';
        parts.push(`Proficiency score ${direction} by ${Math.abs(data.proficiencyDelta)} points`);
    }

    parts.push(`New words collected: ${data.wordsCollected}`);
    parts.push(`Grammar features discovered: ${data.featuresDiscovered}`);

    return parts.join('\n');
}

function getCurrentPeriod(): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const start = new Date(end);
    start.setDate(start.getDate() - 13); // 14-day window (inclusive)
    start.setHours(0, 0, 0, 0);
    return { start, end };
}

export async function POST() {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { start, end } = getCurrentPeriod();

        // Check if narrative already exists for this period
        const existing = await db
            .select()
            .from(learningNarratives)
            .where(and(
                eq(learningNarratives.userId, userId),
                gte(learningNarratives.periodStart, start),
                lte(learningNarratives.periodEnd, end)
            ))
            .limit(1);

        if (existing[0]) {
            return NextResponse.json({ narrative: existing[0], isExisting: true });
        }

        // Aggregate data for the period
        const data = await getAutobiographyData(userId, start, end);

        if (!data.hasActivity) {
            return NextResponse.json({
                narrative: null,
                message: "No learning activity found for this period. Start a Chaos Window session to begin your journey!",
            });
        }

        // Generate narrative via Groq
        const prompt = buildNarrativePrompt(data);
        const narrative = await callGroq(
            [
                { role: "system", content: NARRATIVE_SYSTEM_PROMPT },
                { role: "user", content: `Write a 2-3 paragraph narrative based on this learning data:\n\n${prompt}` },
            ],
            0.8, // slightly higher temperature for creative prose
            false // NOT json mode — we want prose
        );

        // Clean any thinking tags from the response
        const cleanNarrative = narrative
            .replace(/<think>[\s\S]*?<\/think>/g, "")
            .replace(/```/g, "")
            .trim();

        // Save to database
        const stats = {
            sessionCount: data.sessionCount,
            totalMinutes: data.totalMinutes,
            sessionsByType: data.sessionsByType,
            errorCount: data.errorCount,
            resolvedPatterns: data.resolvedPatterns,
            wordsCollected: data.wordsCollected,
            featuresDiscovered: data.featuresDiscovered,
            proficiencyDelta: data.proficiencyDelta,
            topErrorType: data.topErrorType,
            biggestImprovement: data.biggestImprovement,
        };

        const [saved] = await db
            .insert(learningNarratives)
            .values({
                userId,
                narrative: cleanNarrative,
                periodStart: start,
                periodEnd: end,
                stats,
            })
            .returning();

        return NextResponse.json({ narrative: saved, isExisting: false });
    } catch (error) {
        console.error("[Journey Generate API]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
