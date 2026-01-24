import { NextRequest, NextResponse } from "next/server";
import { generateTutorResponse } from "@/lib/ai/tutor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userResponse, context, errorPatterns = [], sessionId } = body;

    // Validate input
    if (!userResponse?.trim() || !context?.trim()) {
      return NextResponse.json(
        { error: "User response and context are required" },
        { status: 400 }
      );
    }

    // Generate AI tutor response
    const tutorResponse = await generateTutorResponse(
      userResponse.trim(),
      context.trim(),
      errorPatterns
    );

    // TODO: Save to Error Garden if patterns detected
    // TODO: Update session state
    // TODO: Log interaction for analytics

    return NextResponse.json({
      success: true,
      response: tutorResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("[Chaos Window] Submit error:", error);
    return NextResponse.json(
      { error: "Failed to process response" },
      { status: 500 }
    );
  }
}
