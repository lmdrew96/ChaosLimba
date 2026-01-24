import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { analyzeGrammar } from '@/lib/ai/grammar';
import { compareSemanticSimilarity } from '@/lib/ai/spamA';
import { checkIntonationShift } from '@/lib/ai/spamD';
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

    const body: AggregateFeedbackRequest = await req.json();

    // Validate required fields
    if (!body.userInput?.trim()) {
      return NextResponse.json(
        { error: 'userInput is required' },
        { status: 400 }
      );
    }

    if (!body.inputType || !['text', 'speech'].includes(body.inputType)) {
      return NextResponse.json(
        { error: 'inputType must be "text" or "speech"' },
        { status: 400 }
      );
    }

    if (!body.sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    console.log(`[AggregateFeedback] Processing ${body.inputType} input for user ${userId}`);

    // Step 1: Run grammar analysis (required for all inputs)
    const grammarResult = await analyzeGrammar(body.userInput.trim());
    console.log(`[AggregateFeedback] Grammar analysis complete, score: ${grammarResult.grammarScore}`);

    // Step 2: Run semantic analysis (required if expectedResponse provided)
    let semanticResult = null;
    if (body.expectedResponse?.trim()) {
      semanticResult = await compareSemanticSimilarity(
        body.userInput.trim(),
        body.expectedResponse.trim(),
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

    // Step 3: For speech input, run pronunciation (mocked) and intonation
    let pronunciationResult = null;
    let intonationResult = null;

    if (body.inputType === 'speech') {
      // Use mock pronunciation result until real pronunciation model is implemented (Milestone 5)
      pronunciationResult = FeedbackAggregator.createMockPronunciationResult(75);
      console.log('[AggregateFeedback] Using mock pronunciation result');

      // Run intonation check if stress patterns provided
      if (body.stressPatterns && body.stressPatterns.length > 0) {
        intonationResult = checkIntonationShift(
          body.userInput.trim(),
          body.stressPatterns
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
      inputType: body.inputType,
      userId,
      sessionId: body.sessionId,
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
      body.sessionId,
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
