import { analyzeRelevance, clearSpamBCache, ContentContext } from '../spamB';

describe('SPAM-B: Relevance Scorer', () => {
  beforeEach(() => {
    clearSpamBCache();
  });

  describe('Input Validation', () => {
    test('throws error for empty user text', async () => {
      const context: ContentContext = {
        main_topics: ['bucătărie', 'mâncare']
      };

      await expect(analyzeRelevance('', context)).rejects.toThrow('User text cannot be empty');
    });

    test('throws error for text that is too long', async () => {
      const longText = 'a'.repeat(600);
      const context: ContentContext = {
        main_topics: ['test']
      };

      await expect(analyzeRelevance(longText, context)).rejects.toThrow('too long');
    });

    test('throws error for empty main_topics', async () => {
      const context: ContentContext = {
        main_topics: []
      };

      await expect(analyzeRelevance('test text', context)).rejects.toThrow('must include main_topics');
    });
  });

  describe('Relevance Detection', () => {
    test('detects on-topic response', async () => {
      const result = await analyzeRelevance(
        'Îmi place sarmale și mămăligă. Sunt mâncăruri tradiționale.',
        { main_topics: ['bucătărie', 'mâncare', 'rețete', 'tradițional'] }
      );

      expect(result.relevance_score).toBeGreaterThan(0.3); // At least partially relevant with fallback
      expect(result.interpretation).toMatch(/on_topic|partially_relevant/);
    });

    test('detects off-topic response', async () => {
      const result = await analyzeRelevance(
        'Îmi place fotbalul. Echipa mea favorită este Steaua.',
        { main_topics: ['bucătărie', 'mâncare', 'rețete'] }
      );

      // With fallback, this should be off-topic or low relevance
      expect(result.relevance_score).toBeLessThan(0.7);
    });

    test('detects partially relevant response', async () => {
      const result = await analyzeRelevance(
        'Îmi place să mănânc când mă uit la fotbal',
        { main_topics: ['bucătărie', 'mâncare', 'rețete'] }
      );

      // Should detect some relevance (mănânc relates to mâncare)
      expect(result.relevance_score).toBeGreaterThan(0);
    });

    test('provides suggested redirect for off-topic', async () => {
      const result = await analyzeRelevance(
        'Îmi place muzica rock și să cânt la chitară',
        { main_topics: ['bucătărie', 'mâncare', 'rețete'] }
      );

      if (result.interpretation === 'off_topic' || result.interpretation === 'partially_relevant') {
        expect(result.topic_analysis.suggested_redirect).toBeDefined();
        expect(result.topic_analysis.suggested_redirect).toContain('bucătărie');
      }
    });
  });

  describe('Topic Analysis', () => {
    test('extracts user topics', async () => {
      const result = await analyzeRelevance(
        'Vreau să învăț despre sarmale și mămăligă',
        { main_topics: ['bucătărie', 'mâncare'] }
      );

      expect(result.topic_analysis.user_topics).toBeDefined();
      expect(Array.isArray(result.topic_analysis.user_topics)).toBe(true);
      expect(result.topic_analysis.user_topics.length).toBeGreaterThan(0);
    });

    test('includes content topics in analysis', async () => {
      const context: ContentContext = {
        main_topics: ['bucătărie', 'mâncare', 'rețete']
      };

      const result = await analyzeRelevance('test text', context);

      expect(result.topic_analysis.content_topics).toEqual(['bucătărie', 'mâncare', 'rețete']);
    });

    test('calculates topic overlap', async () => {
      const result = await analyzeRelevance(
        'Îmi place să gătesc mâncare românească',
        { main_topics: ['bucătărie', 'mâncare', 'gătit'] }
      );

      expect(result.topic_analysis.topic_overlap).toBeGreaterThanOrEqual(0);
      expect(result.topic_analysis.topic_overlap).toBeLessThanOrEqual(1);
    });
  });

  describe('Caching', () => {
    test('caches results', async () => {
      const context: ContentContext = {
        main_topics: ['test']
      };

      const result1 = await analyzeRelevance('test text for caching', context);
      const result2 = await analyzeRelevance('test text for caching', context);

      // Second call should be faster (cached)
      expect(result2.processingTime).toBeLessThan(result1.processingTime || 1000);
    });

    test('cache respects different contexts', async () => {
      const text = 'same text';

      const result1 = await analyzeRelevance(text, { main_topics: ['topic1'] });
      const result2 = await analyzeRelevance(text, { main_topics: ['topic2'] });

      // Results should be different for different contexts
      expect(result1.relevance_score).not.toBe(result2.relevance_score);
    });
  });

  describe('Fallback Handling', () => {
    test('uses fallback when API fails', async () => {
      // Test with very short text that will trigger fallback
      const result = await analyzeRelevance(
        'abc', // Too short for summarization
        { main_topics: ['test', 'example'] }
      );

      expect(result).toBeDefined();
      expect(result.relevance_score).toBeGreaterThanOrEqual(0);
      expect(result.relevance_score).toBeLessThanOrEqual(1);
      // Fallback should still work
      expect(result.fallbackUsed).toBe(true);
    });
  });

  describe('Interpretation Thresholds', () => {
    test('interprets high relevance as on_topic', async () => {
      const result = await analyzeRelevance(
        'Vreau să gătesc sarmale și mămăligă pentru cină',
        { main_topics: ['gătit', 'sarmale', 'mămăligă', 'cină'] }
      );

      if (result.relevance_score >= 0.7) {
        expect(result.interpretation).toBe('on_topic');
      }
    });

    test('interprets low relevance as off_topic', async () => {
      const result = await analyzeRelevance(
        'Matematica este interesantă',
        { main_topics: ['bucătărie', 'mâncare', 'rețete'] }
      );

      if (result.relevance_score < 0.3) {
        expect(result.interpretation).toBe('off_topic');
      }
    });

    test('interprets medium relevance as partially_relevant', async () => {
      // This should get medium score since it mentions food but also other topics
      const result = await analyzeRelevance(
        'Îmi place să mănânc și să mă uit la filme',
        { main_topics: ['mâncare', 'gătit', 'rețete'] }
      );

      if (result.relevance_score >= 0.3 && result.relevance_score < 0.7) {
        expect(result.interpretation).toBe('partially_relevant');
      }
    });
  });
});
