import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { analyzeGrammar } from '@/lib/ai/grammar';
import { compareSemanticSimilarity } from '@/lib/ai/spamA';
import { checkIntonationShift } from '@/lib/ai/spamD';
import { analyzePronunciation } from '@/lib/ai/pronunciation';
import { FeedbackAggregator } from '@/lib/ai/aggregator';
import { saveErrorPatternsToGarden } from '@/lib/db/queries';
import { AggregatorInput } from '@/types/aggregator';
import { ErrorSource } from '@/lib/db/schema';

export interface AggregateFeedbackRequest {
  userInput: string;
  expectedResponse?: string;
  inputType: 'text' | 'speech';
  sessionId: string;
  contentId?: string;
  stressPatterns?: Array<{ word: string; stress: string }>; // For speech input with intonation
}

export interface AggregateFeedbackResponse {
  success: boolean;
  overallScore: number;
  errorPatterns: any[];
  componentStatus: any;
  rawReport: any;
  errorsSaved: number;
  timestamp: string;
}

/**
 * POST /api/aggregate-feedback
 *
 * Production endpoint for the Feedback Aggregator (Component 9)
 * Orchestrates all diagnostic components and saves results to Error Garden
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');

    let userInput: string;
    let expectedResponse: string | undefined;
    let inputType: 'text' | 'speech';
    let sessionId: string;
    let contentId: string | undefined;
    let stressPatterns: Array<{ word: string; stress: string }> | undefined;
    let audioFile: File | null = null;

    if (isFormData) {
      // Handle FormData (speech mode with audio)
      const formData = await req.formData();
      userInput = formData.get('userInput') as string;
      expectedResponse = formData.get('expectedResponse') as string | undefined;
      inputType = formData.get('inputType') as 'text' | 'speech';
      sessionId = formData.get('sessionId') as string;
      contentId = formData.get('contentId') as string | undefined;
      audioFile = formData.get('audio') as File | null;

      // Parse stress patterns if provided
      const stressPatternsStr = formData.get('stressPatterns') as string | null;
      if (stressPatternsStr) {
        try {
          stressPatterns = JSON.parse(stressPatternsStr);
        } catch (e) {
          console.warn('[AggregateFeedback] Failed to parse stress patterns:', e);
        }
      }
    } else {
      // Handle JSON (text mode)
      const body: AggregateFeedbackRequest = await req.json();
      userInput = body.userInput;
      expectedResponse = body.expectedResponse;
      inputType = body.inputType;
      sessionId = body.sessionId;
      contentId = body.contentId;
      stressPatterns = body.stressPatterns;
    }

    // Validate required fields
    if (!userInput?.trim()) {
      return NextResponse.json(
        { error: 'userInput is required' },
        { status: 400 }
      );
    }

    if (!inputType || !['text', 'speech'].includes(inputType)) {
      return NextResponse.json(
        { error: 'inputType must be "text" or "speech"' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    console.log(`[AggregateFeedback] Processing ${inputType} input for user ${userId}`);

    // Step 1: Run grammar analysis (required for all inputs)
    const grammarResult = await analyzeGrammar(userInput.trim());
    console.log(`[AggregateFeedback] Grammar analysis complete, score: ${grammarResult.grammarScore}`);

    // Step 2: Run semantic analysis (required if expectedResponse provided)
    let semanticResult = null;
    if (expectedResponse?.trim()) {
      semanticResult = await compareSemanticSimilarity(
        userInput.trim(),
        expectedResponse.trim(),
        0.75 // Default threshold
      );
      console.log(`[AggregateFeedback] Semantic analysis complete, similarity: ${semanticResult.similarity}`);
    } else {
      // Create a default semantic result if no expected response provided
      semanticResult = {
        similarity: 1.0, // Assume perfect match if no comparison needed
        semanticMatch: true,
        threshold: 0.75,
        fallbackUsed: false,
      };
      console.log('[AggregateFeedback] No expected response provided, skipping semantic analysis');
    }

    // Step 3: For speech input, run pronunciation and intonation
    let pronunciationResult = null;
    let intonationResult = null;

    if (inputType === 'speech') {
      // Run real pronunciation analysis if audio file provided
      if (audioFile) {
        try {
          const pronResult = await analyzePronunciation(
            audioFile,
            expectedResponse?.trim(),
            0.70 // Default threshold
          );

          // Convert PronunciationResult to aggregator format
          pronunciationResult = {
            phonemeScore: pronResult.pronunciationScore ? pronResult.pronunciationScore * 100 : 0,
            stressAccuracy: pronResult.pronunciationScore ? pronResult.pronunciationScore * 100 : 0,
            overallPronunciationScore: pronResult.pronunciationScore ? pronResult.pronunciationScore * 100 : 0,
            detectedErrors: !pronResult.isAccurate ? [
              {
                phoneme: 'general',
                expected: expectedResponse?.trim() || '',
                actual: pronResult.transcribedText || '',
                severity: 'medium' as const,
                position: 0
              }
            ] : []
          };
          console.log(`[AggregateFeedback] Pronunciation analysis complete, score: ${pronunciationResult.overallPronunciationScore}`);
        } catch (pronError) {
          console.error('[AggregateFeedback] Pronunciation analysis failed:', pronError);
          // Fall back to mock
          pronunciationResult = FeedbackAggregator.createMockPronunciationResult(75);
          console.log('[AggregateFeedback] Using mock pronunciation result (fallback)');
        }
      } else {
        // Use mock pronunciation result if no audio file
        pronunciationResult = FeedbackAggregator.createMockPronunciationResult(75);
        console.log('[AggregateFeedback] No audio file provided, using mock pronunciation result');
      }

      // Run intonation check if stress patterns provided
      if (stressPatterns && stressPatterns.length > 0) {
        intonationResult = checkIntonationShift(
          userInput.trim(),
          stressPatterns
        );
        console.log(`[AggregateFeedback] Intonation check complete, warnings: ${intonationResult.warnings.length}`);
      } else {
        // Create empty intonation result
        intonationResult = { warnings: [] };
        console.log('[AggregateFeedback] No stress patterns provided, skipping intonation check');
      }
    }

    // Step 4: Aggregate all component results
    const aggregatorInput: AggregatorInput = {
      inputType,
      userId,
      sessionId,
      grammarResult,
      semanticResult,
      pronunciationResult: pronunciationResult || undefined,
      intonationResult: intonationResult || undefined,
    };

    const aggregatedReport = await FeedbackAggregator.aggregateFeedback(aggregatorInput);
    console.log(`[AggregateFeedback] Aggregation complete, overall score: ${aggregatedReport.overallScore}`);

    // Step 5: Save error patterns to Error Garden
    const source: ErrorSource = 'chaos_window'; // Default source, can be parameterized later
    const savedErrors = await saveErrorPatternsToGarden(
      aggregatedReport.errorPatterns,
      userId,
      sessionId,
      source
    );
    console.log(`[AggregateFeedback] Saved ${savedErrors.length} error patterns to Error Garden`);

    // Step 6: Return aggregated report
    const response: AggregateFeedbackResponse = {
      success: true,
      overallScore: aggregatedReport.overallScore,
      errorPatterns: aggregatedReport.errorPatterns,
      componentStatus: aggregatedReport.componentResults,
      rawReport: aggregatedReport,
      errorsSaved: savedErrors.length,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[AggregateFeedback] Error processing feedback:', error);

    // Provide specific error message if available
    const errorMessage = error instanceof Error ? error.message : 'Failed to process feedback';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
