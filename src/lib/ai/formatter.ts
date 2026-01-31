import { AggregatedReport, ExtractedErrorPattern } from '@/types/aggregator';
import { GrammarError } from './grammar';
import { SpamAResult } from './spamA';
import { PronunciationResult } from '@/types/aggregator';
import { IntonationWarning } from '@/types/intonation';

export interface FormattedFeedback {
  overallScore: number;
  summary: string;
  grammarErrors: FormattedGrammarError[];
  pronunciationFeedback: FormattedPronunciationFeedback | null;
  semanticFeedback: FormattedSemanticFeedback;
  intonationWarnings: FormattedIntonationWarning[];
}

export interface FormattedGrammarError {
  type: string;
  learnerProduction: string;
  correctForm: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  feedbackType: 'error' | 'suggestion'; // Distinguishes objective errors from contextual suggestions
}

export interface FormattedPronunciationFeedback {
  overallScore: number;
  message: string;
  errors: Array<{
    phoneme: string;
    expected: string;
    actual: string;
    severity: string;
  }>;
}

export interface FormattedSemanticFeedback {
  similarity: number;
  match: boolean;
  message: string;
}

export interface FormattedIntonationWarning {
  word: string;
  expectedMeaning: string;
  actualMeaning: string;
  message: string;
  severity: string;
}

/**
 * Formats raw AggregatedReport into user-friendly feedback
 * Uses simple template-based formatting (no AI costs)
 *
 * @param report - Raw aggregated report from FeedbackAggregator
 * @returns Formatted feedback ready for display
 */
export function formatFeedback(report: AggregatedReport): FormattedFeedback {
  return {
    overallScore: report.overallScore,
    summary: generateSummary(report.overallScore, report.errorPatterns),
    grammarErrors: formatGrammarErrors(report.grammar.errors),
    pronunciationFeedback: report.pronunciation
      ? formatPronunciationFeedback(report.pronunciation)
      : null,
    semanticFeedback: formatSemanticFeedback(report.semantic),
    intonationWarnings: report.intonation
      ? formatIntonationWarnings(report.intonation.warnings)
      : [],
  };
}

/**
 * Generates encouraging summary message based on overall score
 */
function generateSummary(score: number, errors: ExtractedErrorPattern[]): string {
  const errorCount = errors.length;

  if (score >= 90) {
    return errorCount === 0
      ? '🎉 Excellent work! Your Romanian is spot-on!'
      : `🎉 Excellent work! Just ${errorCount} small ${errorCount === 1 ? 'detail' : 'details'} to polish.`;
  }

  if (score >= 75) {
    return errorCount === 0
      ? '👍 Great job! Your response is very solid.'
      : `👍 Great job! Let's work on ${errorCount} ${errorCount === 1 ? 'pattern' : 'patterns'} to make it even better.`;
  }

  if (score >= 60) {
    return `💪 Good effort! You're making progress. Let's focus on ${errorCount} ${errorCount === 1 ? 'area' : 'areas'}.`;
  }

  if (score >= 40) {
    return `🌱 Keep practicing! We identified ${errorCount} ${errorCount === 1 ? 'pattern' : 'patterns'} to work on.`;
  }

  return `🌟 You're learning! Let's tackle these ${errorCount} ${errorCount === 1 ? 'concept' : 'concepts'} together.`;
}

/**
 * Formats grammar errors with user-friendly messages
 */
function formatGrammarErrors(errors: GrammarError[]): FormattedGrammarError[] {
  return errors.map(error => {
    const severity = mapConfidenceToSeverity(error.confidence);

    return {
      type: error.type,
      learnerProduction: error.learner_production,
      correctForm: error.correct_form,
      message: generateGrammarErrorMessage(error),
      severity,
      feedbackType: error.feedbackType, // Pass through feedbackType from grammar analysis
    };
  });
}

/**
 * Generates friendly error message for grammar errors
 */
function generateGrammarErrorMessage(error: GrammarError): string {
  const category = error.category || error.type;

  // Specific messages for common error types
  if (category.includes('verb') || category.includes('conjugation')) {
    return `Check the verb form: "${error.learner_production}" → "${error.correct_form}"`;
  }

  if (category.includes('genitive') || category.includes('dative') || category.includes('case')) {
    return `Case error: "${error.learner_production}" should be "${error.correct_form}"`;
  }

  if (category.includes('gender') || category.includes('agreement')) {
    return `Gender/agreement: "${error.learner_production}" → "${error.correct_form}"`;
  }

  if (category.includes('word_order')) {
    return `Word order: Try "${error.correct_form}" instead of "${error.learner_production}"`;
  }

  // Generic message
  return `"${error.learner_production}" → "${error.correct_form}"`;
}

/**
 * Formats pronunciation feedback
 */
function formatPronunciationFeedback(
  pronunciation: PronunciationResult
): FormattedPronunciationFeedback {
  const score = pronunciation.overallPronunciationScore;

  let message = '';
  if (score >= 85) {
    message = 'Your pronunciation is excellent!';
  } else if (score >= 70) {
    message = 'Good pronunciation! A few sounds need practice.';
  } else if (score >= 50) {
    message = 'Keep practicing these sounds!';
  } else {
    message = 'Let\'s work on pronunciation together.';
  }

  return {
    overallScore: score,
    message,
    errors: pronunciation.detectedErrors.map(err => ({
      phoneme: err.phoneme,
      expected: err.expected,
      actual: err.actual,
      severity: err.severity,
    })),
  };
}

/**
 * Formats semantic similarity feedback
 */
function formatSemanticFeedback(semantic: SpamAResult): FormattedSemanticFeedback {
  const percentage = Math.round(semantic.similarity * 100);

  let message = '';
  if (semantic.semanticMatch) {
    message = `✅ Your response matches the expected meaning (${percentage}% similarity)`;
  } else {
    message = `⚠️ Your response differs from the expected meaning (${percentage}% similarity). Make sure you understood the question.`;
  }

  return {
    similarity: semantic.similarity,
    match: semantic.semanticMatch,
    message,
  };
}

/**
 * Formats intonation warnings
 */
function formatIntonationWarnings(
  warnings: IntonationWarning[]
): FormattedIntonationWarning[] {
  return warnings.map(warning => ({
    word: warning.word,
    expectedMeaning: warning.expected_meaning,
    actualMeaning: warning.actual_meaning,
    message: `Watch the stress on "${warning.word}"! You said "${warning.user_stress}" (${warning.actual_meaning}), but it should be "${warning.expected_stress}" (${warning.expected_meaning}).`,
    severity: warning.severity,
  }));
}

/**
 * Maps confidence scores (0-1) to severity levels
 */
function mapConfidenceToSeverity(confidence: number): 'low' | 'medium' | 'high' {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}
