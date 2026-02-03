import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateTutorResponse } from "@/lib/ai/tutor";
import { formatFeedback } from "@/lib/ai/formatter";
import { trackFeatureExposure, extractFeaturesFromErrors } from "@/lib/ai/exposure-tracker";
import { saveErrorPatternsToGarden } from "@/lib/db/queries";
import type { ExtractedErrorPattern } from "@/types/aggregator";

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
    let historicalErrorPatterns: string[] = [];
    let userLevel: string = 'B1';
    let contentId: string | undefined;
    let contentFeatures: string[] = [];
    let targetFeatures: Array<{ featureKey: string; featureName: string; description: string }> = [];

    if (isSpeechMode) {
      // Speech mode - handle FormData
      const formData = await req.formData();
      audioFile = formData.get('audio') as File | null;
      context = formData.get('context') as string;
      expectedResponse = formData.get('expectedResponse') as string | undefined;
      sessionId = formData.get('sessionId') as string;
      modality = 'speech';

      userLevel = (formData.get('userLevel') as string) || 'B1';
      contentId = (formData.get('contentId') as string) || undefined;

      // Parse content features from JSON string
      const contentFeaturesStr = formData.get('contentFeatures') as string | null;
      if (contentFeaturesStr) {
        try { contentFeatures = JSON.parse(contentFeaturesStr); } catch (e) { /* ignore */ }
      }
      const targetFeaturesStr = formData.get('targetFeatures') as string | null;
      if (targetFeaturesStr) {
        try { targetFeatures = JSON.parse(targetFeaturesStr); } catch (e) { /* ignore */ }
      }

      // Parse error patterns from JSON string
      const errorPatternsStr = formData.get('errorPatterns') as string | null;
      if (errorPatternsStr) {
        try {
          historicalErrorPatterns = JSON.parse(errorPatternsStr);
        } catch (e) {
          console.warn('[Chaos Window] Failed to parse errorPatterns from FormData');
        }
      }

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
      historicalErrorPatterns = body.errorPatterns || [];
      userLevel = body.userLevel || 'B1';
      contentId = body.contentId || undefined;
      contentFeatures = body.contentFeatures || [];
      targetFeatures = body.targetFeatures || [];
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
        if (context) {
          aggregatorFormData.append('context', context.trim());
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
              context: context?.trim(),
            }),
          }
        );
      }

      if (aggregatorResponse.ok) {
        aggregatedFeedback = await aggregatorResponse.json();
        console.log(`[Chaos Window] Session ${sessionId}: Score ${aggregatedFeedback.overallScore}/100, ${aggregatedFeedback.errorsSaved || 0} errors saved`);
        console.log(`[Chaos Window] Error types:`, aggregatedFeedback.errorPatterns?.map((e: any) => e.category).join(', ') || 'none');
      } else {
        console.error('[Chaos Window] Aggregator failed:', await aggregatorResponse.text());
      }
    } catch (aggregatorError) {
      console.error('[Chaos Window] Aggregator error:', aggregatorError);
      // Continue without aggregator results - don't block the flow
    }

    // Step 2: Generate AI tutor response with historical error patterns from Error Garden
    // This enables the AI to target the learner's fossilizing error patterns
    const tutorResponse = await generateTutorResponse(
      userResponse.trim(),
      context.trim(),
      historicalErrorPatterns,
      userLevel,
      targetFeatures,
      [] // newlyDiscoveredFeatures - populated by Chaos Window frontend in future
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

    // Step 3.5: Save tutor-identified errors to Error Garden when aggregator missed them
    // The aggregator only saves grammar-checker errors; the tutor often catches additional
    // issues (especially for short responses where grammar analysis finds nothing)
    const { userId } = await auth();
    const aggregatorErrorCount = aggregatedFeedback?.errorsSaved || 0;
    if (userId && sessionId && tutorResponse.feedback?.grammar?.length > 0 && aggregatorErrorCount === 0) {
      const tutorErrorPatterns: ExtractedErrorPattern[] = tutorResponse.feedback.grammar
        .filter((g: { incorrect?: string; correct?: string; severity?: string; feedbackType?: string }) =>
          g.incorrect && g.correct &&
          // Only save major/critical errors — skip minor notes and suggestions
          g.severity !== 'minor' &&
          g.feedbackType !== 'suggestion'
        )
        .map((g: { type?: string; incorrect: string; correct: string; severity?: string; feedbackType?: string }) => ({
          type: 'grammar' as const,
          category: g.type || 'general',
          pattern: `${g.incorrect} → ${g.correct}`,
          learnerProduction: g.incorrect,
          correctForm: g.correct,
          confidence: 0.7,
          severity: (g.severity === 'critical' ? 'high' : g.severity === 'major' ? 'medium' : 'low') as 'low' | 'medium' | 'high',
          inputType: modality as 'text' | 'speech',
          feedbackType: (g.feedbackType || 'error') as 'error' | 'suggestion',
        }));

      if (tutorErrorPatterns.length > 0) {
        saveErrorPatternsToGarden(tutorErrorPatterns, userId, sessionId, 'chaos_window').catch(err => {
          console.error('[Chaos Window] Failed to save tutor-identified errors:', err);
        });
        console.log(`[Chaos Window] Saved ${tutorErrorPatterns.length} tutor-identified errors to Error Garden (aggregator found none)`);
      }
    }

    // Step 4: Track feature exposure (fire-and-forget)
    if (userId && sessionId) {
      const errorFeaturesResult = extractFeaturesFromErrors(
        (aggregatedFeedback?.errorPatterns || []).map((e: { type?: string; category?: string }) => ({
          type: e.type || 'grammar',
          category: e.category,
        }))
      );

      trackFeatureExposure({
        userId,
        sessionId,
        contentId,
        contentFeatures,
        producedFeatures: errorFeaturesResult.produced,
        correctedFeatures: errorFeaturesResult.corrected,
      }).catch(() => {}); // Fire-and-forget
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
