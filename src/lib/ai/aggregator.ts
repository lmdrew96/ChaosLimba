import {
  AggregatorInput,
  AggregatedReport,
  ComponentStatus,
  ExtractedErrorPattern,
  ScoringWeights,
  DEFAULT_WEIGHTS,
} from '../../types/aggregator';

// Re-export types for external use
export type { AggregatorInput, AggregatedReport };
import { GrammarResult, GrammarError, analyzeGrammar } from './grammar';
import { compareSemanticSimilarity, SpamAResult } from './spamA';
import { analyzeRelevance } from './spamB';
import { checkIntonationShift } from './spamD';
import { analyzePronunciation } from './pronunciation';
import { IntonationWarning } from '../../types/intonation';

/**
 * Input for the feedback pipeline — called directly, no HTTP indirection.
 */
export interface FeedbackPipelineInput {
  userInput: string;
  expectedResponse?: string;
  inputType: 'text' | 'speech';
  userId: string;
  sessionId: string;
  context?: string;
  audioFile?: File | null;
  stressPatterns?: Array<{ word: string; stress: string }>;
}

/**
 * Result from the feedback pipeline.
 */
export interface FeedbackPipelineResult {
  report: AggregatedReport;
  errorPatterns: ExtractedErrorPattern[];
  overallScore: number;
  componentStatus: ComponentStatus;
}

/**
 * Run the full feedback analysis pipeline directly (no HTTP fetch).
 * This is the single source of truth for analyzing user responses.
 * Modality is preserved end-to-end since there's no serialization boundary.
 */
export async function runFeedbackPipeline(input: FeedbackPipelineInput): Promise<FeedbackPipelineResult> {
  const { userInput, expectedResponse, inputType, userId, sessionId, context, audioFile, stressPatterns } = input;

  console.log(`[FeedbackPipeline] Processing ${inputType} input for user ${userId}`);

  // Step 1: Grammar analysis (all inputs)
  const grammarResult = await analyzeGrammar(userInput.trim());
  console.log(`[FeedbackPipeline] Grammar: score ${grammarResult.grammarScore}`);

  // Step 2: Semantic analysis
  let semanticResult;
  if (expectedResponse?.trim()) {
    semanticResult = await compareSemanticSimilarity(userInput.trim(), expectedResponse.trim(), 0.75);
    console.log(`[FeedbackPipeline] Semantic: similarity ${semanticResult.similarity}`);
  } else {
    semanticResult = { similarity: 1.0, semanticMatch: true, threshold: 0.75, fallbackUsed: false };
  }

  // Step 3: Speech-only components (pronunciation + intonation)
  let pronunciationResult = undefined;
  let intonationResult = undefined;

  if (inputType === 'speech') {
    if (audioFile) {
      try {
        const pronResult = await analyzePronunciation(audioFile, expectedResponse?.trim(), 0.70);
        pronunciationResult = {
          phonemeScore: pronResult.pronunciationScore ? pronResult.pronunciationScore * 100 : 0,
          stressAccuracy: pronResult.pronunciationScore ? pronResult.pronunciationScore * 100 : 0,
          overallPronunciationScore: pronResult.pronunciationScore ? pronResult.pronunciationScore * 100 : 0,
          detectedErrors: !pronResult.isAccurate ? [{
            phoneme: 'general',
            expected: expectedResponse?.trim() || '',
            actual: pronResult.transcribedText || '',
            severity: 'medium' as const,
            position: 0,
          }] : [],
        };
        console.log(`[FeedbackPipeline] Pronunciation: score ${pronunciationResult.overallPronunciationScore}`);
      } catch (err) {
        console.error('[FeedbackPipeline] Pronunciation failed:', err);
      }
    }

    if (stressPatterns && stressPatterns.length > 0) {
      intonationResult = checkIntonationShift(userInput.trim(), stressPatterns);
    } else {
      intonationResult = { warnings: [] };
    }
  }

  // Step 4: Relevance analysis (SPAM-B)
  let relevanceResult = undefined;
  if (context?.trim()) {
    try {
      relevanceResult = await analyzeRelevance(userInput.trim(), {
        main_topics: [],
        full_content: context.trim(),
      });
      console.log(`[FeedbackPipeline] Relevance: ${relevanceResult.relevance_score} (${relevanceResult.interpretation})`);
    } catch (err) {
      console.error('[FeedbackPipeline] SPAM-B failed:', err);
    }
  }

  // Step 5: Aggregate
  const aggregatorInput: AggregatorInput = {
    inputType,
    userId,
    sessionId,
    grammarResult,
    semanticResult,
    pronunciationResult,
    intonationResult,
    relevanceResult,
    enableSpamB: true,
  };

  const report = await FeedbackAggregator.aggregateFeedback(aggregatorInput);
  console.log(`[FeedbackPipeline] Done: score ${report.overallScore}, ${report.errorPatterns.length} errors`);

  return {
    report,
    errorPatterns: report.errorPatterns,
    overallScore: report.overallScore,
    componentStatus: report.componentResults,
  };
}

/**
 * Feedback Aggregator - Component 9 of ChaosLimbă AI Ensemble
 * 
 * Combines outputs from all active diagnostic components into unified grading reports
 * with adaptive scoring based on input type (speech vs text).
 */
export class FeedbackAggregator {
  /**
   * Main aggregation function that processes component outputs and generates unified report
   */
  static async aggregateFeedback(input: AggregatorInput): Promise<AggregatedReport> {
    const startTime = Date.now();
    console.log(`[FeedbackAggregator] Processing ${input.inputType} input`);

    // Validate required inputs
    this.validateInput(input);

    // Determine component status
    const componentResults = this.determineComponentStatus(input);

    // Extract error patterns for Error Garden
    const errorPatterns = this.extractErrorPatterns(input);

    // Calculate weighted overall score
    const overallScore = this.calculateOverallScore(input);

    const processingTime = Date.now() - startTime;

    const report: AggregatedReport = {
      inputType: input.inputType,
      overallScore,
      grammar: input.grammarResult!,
      pronunciation: input.pronunciationResult,
      semantic: input.semanticResult!,
      intonation: input.intonationResult,
      relevance: input.relevanceResult,  // Include SPAM-B if provided
      errorPatterns,
      processingTime,
      componentResults,
      metadata: {
        timestamp: new Date().toISOString(),
        userId: input.userId,
        sessionId: input.sessionId
      }
    };

    console.log(`[FeedbackAggregator] Report generated in ${processingTime}ms, overall score: ${overallScore}`);
    return report;
  }

  /**
   * Validates that required components are present for the input type
   */
  private static validateInput(input: AggregatorInput): void {
    if (!input.grammarResult) {
      throw new Error('Grammar result is required for all input types');
    }

    if (!input.semanticResult) {
      throw new Error('Semantic result is required for all input types');
    }

    if (input.inputType === 'speech' && !input.pronunciationResult) {
      console.warn('[FeedbackAggregator] Speech input missing pronunciation result');
    }

    if (input.inputType === 'speech' && !input.intonationResult) {
      console.warn('[FeedbackAggregator] Speech input missing intonation result');
    }
  }

  /**
   * Determines which components were successful, failed, or skipped
   */
  private static determineComponentStatus(input: AggregatorInput): ComponentStatus {
    return {
      grammar: input.grammarResult ? 'success' : 'error',
      pronunciation: input.inputType === 'speech'
        ? (input.pronunciationResult ? 'success' : 'error')
        : 'skipped',
      semantic: input.semanticResult ? 'success' : 'error',
      intonation: input.inputType === 'speech'
        ? (input.intonationResult ? 'success' : 'error')
        : 'skipped',
      relevance: input.enableSpamB
        ? (input.relevanceResult ? 'success' : 'error')
        : 'skipped'
    };
  }

  /**
   * Extracts and standardizes error patterns from all components for Error Garden
   */
  private static extractErrorPatterns(input: AggregatorInput): ExtractedErrorPattern[] {
    const patterns: ExtractedErrorPattern[] = [];

    // Extract grammar errors
    if (input.grammarResult?.errors) {
      input.grammarResult.errors.forEach((error: GrammarError) => {
        patterns.push({
          type: 'grammar',
          category: error.category || 'unknown',
          pattern: error.type,
          learnerProduction: error.learner_production,
          correctForm: error.correct_form,
          confidence: error.confidence,
          severity: this.mapConfidenceToSeverity(error.confidence),
          inputType: input.inputType,
          feedbackType: error.feedbackType // Pass through feedbackType from grammar analysis
        });
      });
    }

    // Extract pronunciation errors
    if (input.pronunciationResult?.detectedErrors) {
      input.pronunciationResult.detectedErrors.forEach(error => {
        patterns.push({
          type: 'pronunciation',
          category: 'phonology',
          pattern: `${error.phoneme}_mispronunciation`,
          learnerProduction: error.actual,
          correctForm: error.expected,
          confidence: 0.8, // Placeholder - would come from pronunciation model
          severity: error.severity,
          inputType: input.inputType
        });
      });
    }

    // Extract semantic mismatch (low similarity)
    if (input.semanticResult && !input.semanticResult.semanticMatch) {
      patterns.push({
        type: 'semantic',
        category: 'meaning',
        pattern: 'semantic_mismatch',
        learnerProduction: input.userText || 'unknown',
        correctForm: input.expectedText || 'unknown',
        confidence: 1 - input.semanticResult.similarity,
        severity: this.mapSimilarityToSeverity(input.semanticResult.similarity),
        inputType: input.inputType
      });
    }

    // Extract intonation warnings
    if (input.intonationResult?.warnings) {
      input.intonationResult.warnings.forEach(warning => {
        patterns.push({
          type: 'intonation',
          category: 'stress_pattern',
          pattern: `${warning.word}_stress_error`,
          learnerProduction: warning.user_stress,
          correctForm: warning.expected_stress,
          confidence: 0.9, // High confidence for stress-based meaning changes
          severity: warning.severity,
          inputType: input.inputType
        });
      });
    }

    // Extract off-topic patterns (SPAM-B)
    if (input.relevanceResult && input.relevanceResult.interpretation !== 'on_topic') {
      patterns.push({
        type: 'relevance',
        category: 'off_topic',
        pattern: `${input.relevanceResult.interpretation}_drift`,
        learnerProduction: input.relevanceResult.topic_analysis.user_topics.join(', '),
        correctForm: input.relevanceResult.topic_analysis.content_topics.join(', '),
        confidence: 1 - input.relevanceResult.relevance_score,
        severity: this.mapRelevanceToSeverity(input.relevanceResult.interpretation),
        inputType: input.inputType
      });
    }

    return patterns;
  }

  /**
   * Calculates weighted overall score based on input type and available components
   */
  private static calculateOverallScore(input: AggregatorInput): number {
    const weights = DEFAULT_WEIGHTS[input.inputType];
    let totalScore = 0;
    let totalWeight = 0;

    // Grammar score (always present)
    if (input.grammarResult) {
      totalScore += input.grammarResult.grammarScore * weights.grammar;
      totalWeight += weights.grammar;
    }

    // Pronunciation score (speech only)
    if (input.pronunciationResult && input.inputType === 'speech') {
      totalScore += input.pronunciationResult.overallPronunciationScore * weights.pronunciation;
      totalWeight += weights.pronunciation;
    }

    // Semantic score (always present)
    if (input.semanticResult) {
      const semanticScore = input.semanticResult.similarity * 100; // Convert 0-1 to 0-100
      totalScore += semanticScore * weights.semantic;
      totalWeight += weights.semantic;
    }

    // Handle case where totalWeight is 0 (shouldn't happen with proper validation)
    if (totalWeight === 0) {
      return 0;
    }

    return Math.round(totalScore / totalWeight);
  }

  /**
   * Maps confidence scores (0-1) to severity levels
   */
  private static mapConfidenceToSeverity(confidence: number): 'low' | 'medium' | 'high' {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Maps similarity scores to severity levels (inverse relationship)
   */
  private static mapSimilarityToSeverity(similarity: number): 'low' | 'medium' | 'high' {
    if (similarity >= 0.8) return 'low';   // High similarity = low severity
    if (similarity >= 0.5) return 'medium';
    return 'high';  // Low similarity = high severity
  }

  /**
   * Maps relevance interpretation to severity levels
   */
  private static mapRelevanceToSeverity(interpretation: string): 'low' | 'medium' | 'high' {
    if (interpretation === 'off_topic') return 'high';
    if (interpretation === 'partially_relevant') return 'medium';
    return 'low';
  }

}
