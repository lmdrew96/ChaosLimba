import { NextRequest, NextResponse } from 'next/server';
import { FeedbackAggregator } from '@/lib/ai/aggregator';
import { GrammarResult } from '@/lib/ai/grammar';
import { SpamAResult } from '@/lib/ai/spamA';

export async function GET() {
  try {
    console.log('🧪 Testing Feedback Aggregator via API...');

    // Mock data
    const mockGrammarResult: GrammarResult = {
      correctedText: 'Eu merg la piață.',
      errors: [{
        type: 'preposition_error',
        learner_production: 'la',
        correct_form: 'la',
        confidence: 0.85,
        category: 'grammar'
      }],
      grammarScore: 85
    };

    const mockSemanticResult: SpamAResult = {
      similarity: 0.9,
      semanticMatch: true,
      threshold: 0.75,
      fallbackUsed: false
    };

    // Test 1: Text Input Path
    const textInput = {
      inputType: 'text' as const,
      grammarResult: mockGrammarResult,
      semanticResult: mockSemanticResult,
      userId: 'test-user',
      sessionId: 'test-session'
    };

    const textResult = await FeedbackAggregator.aggregateFeedback(textInput);

    // Test 2: Speech Input Path
    const speechInput = {
      inputType: 'speech' as const,
      grammarResult: mockGrammarResult,
      pronunciationResult: FeedbackAggregator.createMockPronunciationResult(75),
      semanticResult: mockSemanticResult,
      intonationResult: FeedbackAggregator.createMockIntonationResult(true),
      userId: 'test-user',
      sessionId: 'test-session'
    };

    const speechResult = await FeedbackAggregator.aggregateFeedback(speechInput);

    // Test 3: Score Calculation
    const scoreTestInput = {
      inputType: 'text' as const,
      grammarResult: { ...mockGrammarResult, grammarScore: 80, errors: [] },
      semanticResult: { ...mockSemanticResult, similarity: 0.8 }
    };

    const scoreResult = await FeedbackAggregator.aggregateFeedback(scoreTestInput);

    const results = {
      success: true,
      tests: {
        text: {
          success: true,
          overallScore: textResult.overallScore,
          processingTime: textResult.processingTime,
          errorPatterns: textResult.errorPatterns.length,
          componentStatus: textResult.componentResults
        },
        speech: {
          success: true,
          overallScore: speechResult.overallScore,
          processingTime: speechResult.processingTime,
          errorPatterns: speechResult.errorPatterns.length,
          componentStatus: speechResult.componentResults
        },
        scoring: {
          success: scoreResult.overallScore === 80,
          actualScore: scoreResult.overallScore,
          expectedScore: 80
        }
      }
    };

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('❌ Aggregator test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
