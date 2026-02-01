import { NextRequest, NextResponse } from "next/server";
import { generateInitialQuestion } from "@/lib/ai/tutor";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { contentTitle, contentTranscript, contentType, errorPatterns } = body;

        if (!contentTitle) {
            return NextResponse.json(
                { error: "Content title is required" },
                { status: 400 }
            );
        }

        const validTypes = ['audio', 'text'];
        if (!validTypes.includes(contentType)) {
            return NextResponse.json(
                { error: "Invalid content type" },
                { status: 400 }
            );
        }

        console.log(`[Initial Question API] Generating question for: "${contentTitle}" (${contentType})`);
        console.log(`[Initial Question API] Transcript available: ${!!contentTranscript && contentTranscript.length > 50}`);

        const question = await generateInitialQuestion(
            contentTitle,
            contentTranscript || null,
            contentType as 'audio' | 'text',
            errorPatterns || []
        );

        console.log(`[Initial Question API] Generated: "${question.question}" (${question.questionType})`);

        return NextResponse.json({ question });

    } catch (error) {
        console.error("[Initial Question API] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate initial question" },
            { status: 500 }
        );
    }
}
