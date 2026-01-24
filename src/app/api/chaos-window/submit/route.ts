import { NextRequest, NextResponse } from "next/server";
import { generateTutorResponse } from "@/lib/ai/tutor";
import { formatFeedback } from "@/lib/ai/formatter";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const isSpeechMode = contentType.includes('multipart/form-data');

    let userResponse: string;
    let context: string;
    let expectedResponse: string | undefined;
    let sessionId: string;
    let modality: 'text' | 'speech';
    let audioFile: File | null = null;

    if (isSpeechMode) {
      // Speech mode - handle FormData
      const formData = await req.formData();
      audioFile = formData.get('audio') as File | null;
      context = formData.get('context') as string;
      expectedResponse = formData.get('expectedResponse') as string | undefined;
      sessionId = formData.get('sessionId') as string;
      modality = 'speech';

      if (!audioFile) {
        return NextResponse.json(
          { error: "Audio file is required for speech mode" },
          { status: 400 }
        );
      }

      // Transcribe audio using Groq speech-to-text
      console.log('[Chaos Window] Transcribing audio with Groq...');
      try {
        const groqFormData = new FormData();
        groqFormData.append('file', audioFile);
        groqFormData.append('model', 'whisper-large-v3');
        groqFormData.append('language', 'ro');
        groqFormData.append('response_format', 'json');

        const transcriptionResponse = await fetch(
          'https://api.groq.com/openai/v1/audio/transcriptions',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: groqFormData
          }
        );

        if (!transcriptionResponse.ok) {
          const error = await transcriptionResponse.text();
          console.error('[Chaos Window] Transcription failed:', error);
          return NextResponse.json(
            { error: "Failed to transcribe audio" },
            { status: 500 }
          );
        }

        const transcriptionResult = await transcriptionResponse.json();
        userResponse = transcriptionResult.text;
        console.log('[Chaos Window] Transcription:', userResponse);
      } catch (transcriptionError) {
        console.error('[Chaos Window] Transcription error:', transcriptionError);
        return NextResponse.json(
          { error: "Failed to transcribe audio" },
          { status: 500 }
        );
      }
    } else {
      // Text mode - handle JSON
      const body = await req.json();
      userResponse = body.userResponse;
      context = body.context;
      expectedResponse = body.expectedResponse;
      sessionId = body.sessionId;
      modality = body.modality || 'text';
    }

    // Validate common inputs
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

    console.log(`[Chaos Window] Processing ${modality} submission with aggregator`);

    // Step 1: Call Feedback Aggregator to analyze user response
    let aggregatedFeedback = null;
    try {
      let aggregatorResponse: Response;

      if (modality === 'speech' && audioFile) {
        // For speech mode, send both transcribed text and audio file
        const aggregatorFormData = new FormData();
        aggregatorFormData.append('userInput', userResponse.trim());
        aggregatorFormData.append('audio', audioFile);
        aggregatorFormData.append('inputType', 'speech');
        aggregatorFormData.append('sessionId', sessionId);
        if (expectedResponse) {
          aggregatorFormData.append('expectedResponse', expectedResponse.trim());
        }

        aggregatorResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/aggregate-feedback`,
          {
            method: 'POST',
            headers: {
              // Forward auth headers
              Cookie: req.headers.get('cookie') || '',
            },
            body: aggregatorFormData,
          }
        );
      } else {
        // For text mode, send JSON
        aggregatorResponse = await fetch(
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
              inputType: 'text',
              sessionId,
            }),
          }
        );
      }

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
