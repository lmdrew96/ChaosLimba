import { GrammarResult } from '../lib/ai/grammar';
import { SpamAResult } from '../lib/ai/spamA';
import { SpamBResult } from '../lib/ai/spamB';
import { IntonationWarning } from './intonation';

// Pronunciation analysis result (placeholder until implemented)
export interface PronunciationResult {
  phonemeScore: number;        // 0-100
  stressAccuracy: number;      // 0-100
  overallPronunciationScore: number; // 0-100
  detectedErrors: PronunciationError[];
}

export interface PronunciationError {
  phoneme: string;
  expected: string;
  actual: string;
  severity: 'low' | 'medium' | 'high';
  position: number;
}

// Component status tracking
export interface ComponentStatus {
  grammar: 'success' | 'error' | 'skipped';
  pronunciation: 'success' | 'error' | 'skipped';
  semantic: 'success' | 'error' | 'skipped';
  intonation: 'success' | 'error' | 'skipped';
  relevance: 'success' | 'error' | 'skipped';
}

// Error pattern for Error Garden integration
export interface ExtractedErrorPattern {
  type: 'grammar' | 'pronunciation' | 'semantic' | 'intonation' | 'relevance';
  category: string;
  pattern: string;
  learnerProduction: string;
  correctForm?: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  inputType: 'speech' | 'text';
}

// Main aggregated report interface
export interface AggregatedReport {
  inputType: 'speech' | 'text';
  overallScore: number;        // 0-100
  grammar: GrammarResult;
  pronunciation?: PronunciationResult;  // Speech only
  semantic: SpamAResult;
  intonation?: { warnings: IntonationWarning[] };  // Speech only
  relevance?: SpamBResult;     // Optional (when enabled)
  errorPatterns: ExtractedErrorPattern[];  // For Error Garden
  processingTime: number;      // ms
  componentResults: ComponentStatus;
  metadata: {
    timestamp: string;
    userId?: string;
    sessionId?: string;
  };
}

// Input types for the aggregator
export interface AggregatorInput {
  inputType: 'speech' | 'text';
  grammarResult?: GrammarResult;
  pronunciationResult?: PronunciationResult;
  semanticResult?: SpamAResult;
  intonationResult?: { warnings: IntonationWarning[] };
  relevanceResult?: SpamBResult;  // Optional SPAM-B
  userId?: string;
  sessionId?: string;
  enableSpamB?: boolean;  // Feature flag
}

// Scoring weights configuration
export interface ScoringWeights {
  grammar: number;
  pronunciation: number;
  semantic: number;
}

// Default weights for each input type
export const DEFAULT_WEIGHTS: Record<'speech' | 'text', ScoringWeights> = {
  speech: {
    grammar: 0.4,
    pronunciation: 0.3,
    semantic: 0.3
  },
  text: {
    grammar: 0.6,
    pronunciation: 0,
    semantic: 0.4
  }
};
