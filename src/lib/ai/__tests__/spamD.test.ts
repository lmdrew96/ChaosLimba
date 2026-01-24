import { 
  checkIntonationShift, 
  hasMinimalPairs, 
  getStressVariants, 
  getStressErrorSeverity,
  STRESS_MINIMAL_PAIRS 
} from '../spamD';
import { IntonationWarning } from '@/types/intonation';

describe('SPAM-D: Intonation-Meaning Mapper', () => {
  describe('STRESS_MINIMAL_PAIRS data structure', () => {
    it('should contain all 10 documented minimal pairs', () => {
      const expectedWords = [
        'torturi', 'masa', 'copii', 'cara', 'acum', 
        'mintea', 'politica', 'orice', 'vedere', 'omul'
      ];
      
      expectedWords.forEach(word => {
        expect(STRESS_MINIMAL_PAIRS[word]).toBeDefined();
        expect(Object.keys(STRESS_MINIMAL_PAIRS[word])).toHaveLength(2);
      });
    });

    it('should have proper structure for each minimal pair', () => {
      const torturi = STRESS_MINIMAL_PAIRS['torturi'];
      
      expect(torturi['TOR-tu-ri']).toMatchObject({
        meaning: 'cakes',
        category: 'food',
        ipa: 'ˈtor.tu.ri',
        severity: 'high'
      });
      
      expect(torturi['tor-TU-ri']).toMatchObject({
        meaning: 'tortures',
        category: 'violence',
        ipa: 'tor.ˈtu.ri',
        severity: 'high'
      });
    });
  });

  describe('hasMinimalPairs', () => {
    it('should return true for words with minimal pairs', () => {
      expect(hasMinimalPairs('torturi')).toBe(true);
      expect(hasMinimalPairs('copii')).toBe(true);
      expect(hasMinimalPairs('masa')).toBe(true);
    });

    it('should return false for words without minimal pairs', () => {
      expect(hasMinimalPairs('carte')).toBe(false);
      expect(hasMinimalPairs('casă')).toBe(false);
      expect(hasMinimalPairs('randomword')).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(hasMinimalPairs('TORTURI')).toBe(true);
      expect(hasMinimalPairs('Copii')).toBe(true);
      expect(hasMinimalPairs('MASA')).toBe(true);
    });
  });

  describe('getStressVariants', () => {
    it('should return all stress variants for a word', () => {
      const variants = getStressVariants('torturi');
      
      expect(variants).toBeDefined();
      expect(variants!['TOR-tu-ri']).toBeDefined();
      expect(variants!['tor-TU-ri']).toBeDefined();
      expect(variants!['TOR-tu-ri'].meaning).toBe('cakes');
      expect(variants!['tor-TU-ri'].meaning).toBe('tortures');
    });

    it('should return null for words without minimal pairs', () => {
      expect(getStressVariants('carte')).toBeNull();
    });

    it('should be case insensitive', () => {
      const variants1 = getStressVariants('torturi');
      const variants2 = getStressVariants('TORTURI');
      
      expect(variants1).toEqual(variants2);
    });
  });

  describe('getStressErrorSeverity', () => {
    it('should return correct severity for known stress errors', () => {
      expect(getStressErrorSeverity('torturi', 'tor-TU-ri', 'TOR-tu-ri')).toBe('high');
      expect(getStressErrorSeverity('masa', 'ma-SA', 'MA-sa')).toBe('medium');
      expect(getStressErrorSeverity('acum', 'a-CUM', 'A-cum')).toBe('low');
    });

    it('should return null for unknown words', () => {
      expect(getStressErrorSeverity('carte', 'CAR-te', 'car-TE')).toBeNull();
    });

    it('should return null for unknown stress patterns', () => {
      expect(getStressErrorSeverity('torturi', 'INVALID-stress', 'TOR-tu-ri')).toBeNull();
    });
  });

  describe('checkIntonationShift', () => {
    it('should detect stress-based meaning changes', () => {
      const result = checkIntonationShift(
        'Vreau torturi',
        [{ word: 'torturi', stress: 'tor-TU-ri' }]
      );

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatchObject({
        word: 'torturi',
        position: 0,
        expected_stress: 'TOR-tu-ri',
        user_stress: 'tor-TU-ri',
        expected_meaning: 'cakes',
        actual_meaning: 'tortures',
        severity: 'high'
      });
      expect(result.warnings[0].explanation).toContain('changes the meaning');
    });

    it('should detect multiple stress errors in one transcript', () => {
      const result = checkIntonationShift(
        'Copii masa',
        [
          { word: 'Copii', stress: 'co-PII' },
          { word: 'masa', stress: 'ma-SA' }
        ]
      );

      expect(result.warnings).toHaveLength(2);
      expect(result.warnings[0].word).toBe('copii');
      expect(result.warnings[1].word).toBe('masa');
    });

    it('should not generate warnings for correct stress', () => {
      const result = checkIntonationShift(
        'Vreau torturi',
        [{ word: 'torturi', stress: 'TOR-tu-ri' }]
      );

      expect(result.warnings).toHaveLength(0);
    });

    it('should not generate warnings for words without minimal pairs', () => {
      const result = checkIntonationShift(
        'Vreau carte',
        [{ word: 'carte', stress: 'CAR-te' }]
      );

      expect(result.warnings).toHaveLength(0);
    });

    it('should handle mixed case and punctuation', () => {
      const result = checkIntonationShift(
        'Vreau torturi!',
        [{ word: 'torturi', stress: 'tor-TU-ri' }]
      );

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].word).toBe('torturi');
    });

    it('should handle empty stress patterns array', () => {
      const result = checkIntonationShift('Vreau torturi', []);
      expect(result.warnings).toHaveLength(0);
    });

    it('should be case insensitive for word matching', () => {
      const result = checkIntonationShift(
        'Vreau TORTURI',
        [{ word: 'TORTURI', stress: 'tor-TU-ri' }]
      );

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].word).toBe('torturi');
    });

    it('should not generate warnings for unknown stress patterns', () => {
      const result = checkIntonationShift(
        'Vreau torturi',
        [{ word: 'torturi', stress: 'INVALID-stress' }]
      );

      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Performance characteristics', () => {
    it('should process quickly (<10ms)', () => {
      const startTime = performance.now();
      
      checkIntonationShift(
        'Vreau torturi copii masa',
        [
          { word: 'torturi', stress: 'tor-TU-ri' },
          { word: 'copii', stress: 'co-PII' },
          { word: 'masa', stress: 'ma-SA' }
        ]
      );
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(10);
    });

    it('should handle large transcripts efficiently', () => {
      const longTranscript = 'Vreau '.repeat(100) + 'torturi';
      const stressPatterns = Array(101).fill({ word: 'vreau', stress: 'VREAU' });
      stressPatterns.push({ word: 'torturi', stress: 'tor-TU-ri' });

      const startTime = performance.now();
      const result = checkIntonationShift(longTranscript, stressPatterns);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty transcript', () => {
      const result = checkIntonationShift('', []);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle transcript with only spaces', () => {
      const result = checkIntonationShift('   ', []);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle stress patterns with special characters', () => {
      const result = checkIntonationShift(
        'Vreau torturi',
        [{ word: 'torturi', stress: 'tor-TU-ri!' }]
      );

      expect(result.warnings).toHaveLength(0);
    });

    it('should handle words with diacritics', () => {
      const result = checkIntonationShift(
        'Vreau copiii',
        [{ word: 'copiii', stress: 'co-PII-i' }]
      );

      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Real-world scenarios', () => {
    it('should catch dangerous meaning changes (torturi example)', () => {
      const result = checkIntonationShift(
        'Vreau două torturi de ciocolată',
        [{ word: 'torturi', stress: 'tor-TU-ri' }]
      );

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].severity).toBe('high');
      expect(result.warnings[0].expected_meaning).toBe('cakes');
      expect(result.warnings[0].actual_meaning).toBe('tortures');
    });

    it('should catch confusion between children and copies', () => {
      const result = checkIntonationShift(
        'Copiii se joacă în parc',
        [{ word: 'Copiii', stress: 'co-PII' }]
      );

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].severity).toBe('high');
      expect(result.warnings[0].expected_meaning).toBe('children');
      expect(result.warnings[0].actual_meaning).toBe('copies');
    });

    it('should handle politics vs policy confusion', () => {
      const result = checkIntonationShift(
        'Politica în România e complicată',
        [{ word: 'Politica', stress: 'po-li-TI-ca' }]
      );

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].severity).toBe('high');
      expect(result.warnings[0].expected_meaning).toBe('politics');
      expect(result.warnings[0].actual_meaning).toBe('the policy');
    });
  });
});
