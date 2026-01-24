import { NextRequest, NextResponse } from "next/server";
import { generateTutorResponse } from "@/lib/ai/tutor";
import { formatFeedback } from "@/lib/ai/formatter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userResponse, context, expectedResponse, sessionId, inputType = 'text' } = body;

    // Validate input
    if (!userResponse?.trim() || !context?.trim()) {
      return NextResponse.json(
        { error: "User response and context are required" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    console.log('[Chaos Window] Processing submission with aggregator');

    // Step 1: Call Feedback Aggregator to analyze user response
    let aggregatedFeedback = null;
    try {
      const aggregatorResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/aggregate-feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Forward auth headers
            Cookie: req.headers.get('cookie') || '',
          },
          body: JSON.stringify({
            userInput: userResponse.trim(),
            expectedResponse: expectedResponse?.trim(),
            inputType,
            sessionId,
          }),
        }
      );

      if (aggregatorResponse.ok) {
        aggregatedFeedback = await aggregatorResponse.json();
        console.log(`[Chaos Window] Aggregator completed: score ${aggregatedFeedback.overallScore}, ${aggregatedFeedback.errorsSaved} errors saved`);
      } else {
        console.error('[Chaos Window] Aggregator failed:', await aggregatorResponse.text());
      }
    } catch (aggregatorError) {
      console.error('[Chaos Window] Aggregator error:', aggregatorError);
      // Continue without aggregator results - don't block the flow
    }

    // Step 2: Generate AI tutor response with error context
    const errorPatterns = aggregatedFeedback?.errorPatterns || [];
    const tutorResponse = await generateTutorResponse(
      userResponse.trim(),
      context.trim(),
      errorPatterns
    );

    // Step 3: Format feedback for user display
    let formattedFeedback = null;
    if (aggregatedFeedback?.rawReport) {
      try {
        formattedFeedback = formatFeedback(aggregatedFeedback.rawReport);
      } catch (formatError) {
        console.error('[Chaos Window] Formatting error:', formatError);
      }
    }

    // Return combined response with tutor feedback + grading data
    return NextResponse.json({
      success: true,
      response: tutorResponse,
      gradingReport: aggregatedFeedback ? {
        overallScore: aggregatedFeedback.overallScore,
        componentStatus: aggregatedFeedback.componentStatus,
        formattedFeedback,
        rawReport: aggregatedFeedback.rawReport,
      } : null,
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
