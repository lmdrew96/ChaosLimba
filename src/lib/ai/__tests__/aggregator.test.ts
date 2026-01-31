import { FeedbackAggregator } from '../aggregator';
import { GrammarResult, GrammarError } from '../grammar';
import { SpamAResult } from '../spamA';
import { IntonationWarning } from '../../../types/intonation';
import { AggregatorInput, AggregatedReport } from '../../../types/aggregator';

describe('FeedbackAggregator', () => {
  // Mock data for testing
  const mockGrammarResult: GrammarResult = {
    correctedText: 'Eu merg la piață.',
    errors: [
      {
        type: 'preposition_error',
        learner_production: 'la',
        correct_form: 'la',
        confidence: 0.85,
        category: 'grammar',
        feedbackType: 'error'
      }
    ],
    grammarScore: 85
  };

  const mockSemanticResult: SpamAResult = {
    similarity: 0.9,
    semanticMatch: true,
    threshold: 0.75,
    fallbackUsed: false,
    modelUsed: 'test-model'
  };

  const mockPronunciationResult = FeedbackAggregator.createMockPronunciationResult(75);

  const mockIntonationResult = FeedbackAggregator.createMockIntonationResult(true);

  describe('Text Input Path', () => {
    it('should aggregate text input correctly', async () => {
      const input: AggregatorInput = {
        inputType: 'text',
        grammarResult: mockGrammarResult,
        semanticResult: mockSemanticResult,
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const result = await FeedbackAggregator.aggregateFeedback(input);

      expect(result.inputType).toBe('text');
      expect(result.grammar).toEqual(mockGrammarResult);
      expect(result.semantic).toEqual(mockSemanticResult);
      expect(result.pronunciation).toBeUndefined();
      expect(result.intonation).toBeUndefined();
      expect(result.componentResults.pronunciation).toBe('skipped');
      expect(result.componentResults.intonation).toBe('skipped');
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should calculate correct weighted scores for text input', async () => {
      const input: AggregatorInput = {
        inputType: 'text',
        grammarResult: { ...mockGrammarResult, grammarScore: 80 },
        semanticResult: { ...mockSemanticResult, similarity: 0.8 }
      };

      const result = await FeedbackAggregator.aggregateFeedback(input);

      // Text weights: Grammar 60% + Semantic 40%
      // Expected: (80 * 0.6) + (80 * 0.4) = 48 + 32 = 80
      expect(result.overallScore).toBe(80);
    });
  });

  describe('Speech Input Path', () => {
    it('should aggregate speech input correctly', async () => {
      const input: AggregatorInput = {
        inputType: 'speech',
        grammarResult: mockGrammarResult,
        pronunciationResult: mockPronunciationResult,
        semanticResult: mockSemanticResult,
        intonationResult: mockIntonationResult,
        userId: 'test-user',
        sessionId: 'test-session'
      };

      const result = await FeedbackAggregator.aggregateFeedback(input);

      expect(result.inputType).toBe('speech');
      expect(result.grammar).toEqual(mockGrammarResult);
      expect(result.semantic).toEqual(mockSemanticResult);
      expect(result.pronunciation).toEqual(mockPronunciationResult);
      expect(result.intonation).toEqual(mockIntonationResult);
      expect(result.componentResults.grammar).toBe('success');
      expect(result.componentResults.pronunciation).toBe('success');
      expect(result.componentResults.semantic).toBe('success');
      expect(result.componentResults.intonation).toBe('success');
    });

    it('should calculate correct weighted scores for speech input', async () => {
      const input: AggregatorInput = {
        inputType: 'speech',
        grammarResult: { ...mockGrammarResult, grammarScore: 80 },
        pronunciationResult: { ...mockPronunciationResult, overallPronunciationScore: 70 },
        semanticResult: { ...mockSemanticResult, similarity: 0.9 }
      };

      const result = await FeedbackAggregator.aggregateFeedback(input);

      // Speech weights: Grammar 40% + Pronunciation 30% + Semantic 30%
      // Expected: (80 * 0.4) + (70 * 0.3) + (90 * 0.3) = 32 + 21 + 27 = 80
      expect(result.overallScore).toBe(80);
    });

    it('should handle speech input without pronunciation result', async () => {
      const input: AggregatorInput = {
        inputType: 'speech',
        grammarResult: mockGrammarResult,
        semanticResult: mockSemanticResult
      };

      const result = await FeedbackAggregator.aggregateFeedback(input);

      expect(result.componentResults.pronunciation).toBe('error');
      expect(result.pronunciation).toBeUndefined();
    });
  });

  describe('Error Pattern Extraction', () => {
    it('should extract grammar errors correctly', async () => {
      const input: AggregatorInput = {
        inputType: 'text',
        grammarResult: mockGrammarResult,
        semanticResult: mockSemanticResult
      };

      const result = await FeedbackAggregator.aggregateFeedback(input);

      expect(result.errorPatterns).toHaveLength(1);
      expect(result.errorPatterns[0]).toMatchObject({
        type: 'grammar',
        category: 'grammar',
        pattern: 'preposition_error',
        learnerProduction: 'la',
        correctForm: 'la',
        confidence: 0.85,
        severity: 'high',
        inputType: 'text'
      });
    });

    it('should extract pronunciation errors correctly', async () => {
      const input: AggregatorInput = {
        inputType: 'speech',
        grammarResult: { ...mockGrammarResult, errors: [] },
        semanticResult: { ...mockSemanticResult, semanticMatch: true },
        pronunciationResult: mockPronunciationResult
      };

      const result = await FeedbackAggregator.aggregateFeedback(input);

      const pronunciationErrors = result.errorPatterns.filter(e => e.type === 'pronunciation');
      expect(pronunciationErrors.length).toBeGreaterThan(0);
      expect(pronunciationErrors[0]).toMatchObject({
        type: 'pronunciation',
        category: 'phonology',
        pattern: 'î_mispronunciation',
        severity: 'medium',
        inputType: 'speech'
      });
    });

    it('should extract semantic mismatches correctly', async () => {
      const input: AggregatorInput = {
        inputType: 'text',
        grammarResult: { ...mockGrammarResult, errors: [] },
        semanticResult: { ...mockSemanticResult, similarity: 0.3, semanticMatch: false }
      };

      const result = await FeedbackAggregator.aggregateFeedback(input);

      const semanticErrors = result.errorPatterns.filter(e => e.type === 'semantic');
      expect(semanticErrors).toHaveLength(1);
      expect(semanticErrors[0]).toMatchObject({
        type: 'semantic',
        category: 'meaning',
        pattern: 'semantic_mismatch',
        confidence: 0.7,
        severity: 'high',
        inputType: 'text'
      });
    });

    it('should extract intonation warnings correctly', async () => {
      const input: AggregatorInput = {
        inputType: 'speech',
        grammarResult: { ...mockGrammarResult, errors: [] },
        semanticResult: { ...mockSemanticResult, semanticMatch: true },
        intonationResult: mockIntonationResult
      };

      const result = await FeedbackAggregator.aggregateFeedback(input);

      const intonationErrors = result.errorPatterns.filter(e => e.type === 'intonation');
      expect(intonationErrors).toHaveLength(1);
      expect(intonationErrors[0]).toMatchObject({
        type: 'intonation',
        category: 'stress_pattern',
        pattern: 'torturi_stress_error',
        severity: 'high',
        inputType: 'speech'
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when grammar result is missing', async () => {
      const input: AggregatorInput = {
        inputType: 'text',
        semanticResult: mockSemanticResult
      };

      await expect(FeedbackAggregator.aggregateFeedback(input))
        .rejects.toThrow('Grammar result is required for all input types');
    });

    it('should throw error when semantic result is missing', async () => {
      const input: AggregatorInput = {
        inputType: 'text',
        grammarResult: mockGrammarResult
      };

      await expect(FeedbackAggregator.aggregateFeedback(input))
        .rejects.toThrow('Semantic result is required for all input types');
    });

    it('should handle empty results gracefully', async () => {
      const input: AggregatorInput = {
        inputType: 'text',
        grammarResult: { ...mockGrammarResult, errors: [], grammarScore: 100 },
        semanticResult: { ...mockSemanticResult, similarity: 1.0, semanticMatch: true }
      };

      const result = await FeedbackAggregator.aggregateFeedback(input);

      expect(result.errorPatterns).toHaveLength(0);
      expect(result.overallScore).toBe(100);
    });
  });

  describe('Performance', () => {
    it('should complete processing within reasonable time', async () => {
      const input: AggregatorInput = {
        inputType: 'text',
        grammarResult: mockGrammarResult,
        semanticResult: mockSemanticResult
      };

      const startTime = Date.now();
      await FeedbackAggregator.aggregateFeedback(input);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50); // Should complete in < 50ms
    });

    it('should track processing time correctly', async () => {
      const input: AggregatorInput = {
        inputType: 'text',
        grammarResult: mockGrammarResult,
        semanticResult: mockSemanticResult
      };

      const result = await FeedbackAggregator.aggregateFeedback(input);

      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.processingTime).toBeLessThan(50);
    });
  });

  describe('Mock Data Helpers', () => {
    it('should create mock pronunciation result with correct structure', () => {
      const result = FeedbackAggregator.createMockPronunciationResult(85);

      expect(result).toMatchObject({
        phonemeScore: 85,
        stressAccuracy: 85,
        overallPronunciationScore: 85
      });

      if (result.overallPronunciationScore < 80) {
        expect(result.detectedErrors).toHaveLength(1);
        expect(result.detectedErrors[0]).toMatchObject({
          phoneme: 'î',
          severity: 'medium'
        });
      }
    });

    it('should create mock intonation result with correct structure', () => {
      const result = FeedbackAggregator.createMockIntonationResult(true);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatchObject({
        word: 'torturi',
        severity: 'high'
      });
    });

    it('should create mock intonation result without warnings', () => {
      const result = FeedbackAggregator.createMockIntonationResult(false);

      expect(result.warnings).toHaveLength(0);
    });
  });
});
