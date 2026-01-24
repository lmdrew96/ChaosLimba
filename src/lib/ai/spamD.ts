import { StressVariant, MinimalPair, IntonationWarning, StressPattern } from '../../types/intonation';

// Romanian stress-based minimal pairs lookup table
// Each word maps to stress patterns and their distinct meanings
export const STRESS_MINIMAL_PAIRS: Record<string, MinimalPair> = {
  "torturi": {
    "TOR-tu-ri": {
      meaning: "cakes",
      category: "food",
      ipa: "ˈtor.tu.ri",
      severity: "high",
      example_sentence: "Vreau două torturi de ciocolată."
    },
    "tor-TU-ri": {
      meaning: "tortures",
      category: "violence",
      ipa: "tor.ˈtu.ri",
      severity: "high",
      example_sentence: "Torturile din război au fost oribile."
    }
  },

  "masa": {
    "MA-sa": {
      meaning: "table",
      category: "furniture",
      ipa: "ˈma.sa",
      severity: "medium",
      example_sentence: "Pune cartea pe masă."
    },
    "ma-SA": {
      meaning: "mass/crowd",
      category: "collective",
      ipa: "ma.ˈsa",
      severity: "medium",
      example_sentence: "Masa de oameni se aduna în piață."
    }
  },

  "copii": {
    "CO-pii": {
      meaning: "children",
      category: "people",
      ipa: "ˈko.pi.i",
      severity: "high",
      example_sentence: "Copiii se joacă în parc."
    },
    "co-PII": {
      meaning: "copies",
      category: "documents",
      ipa: "ko.ˈpi.i",
      severity: "high",
      example_sentence: "Fă trei copii ale documentului."
    }
  },

  "cara": {
    "CA-ra": {
      meaning: "face (noun)",
      category: "body",
      ipa: "ˈka.ra",
      severity: "medium",
      example_sentence: "Are o față frumoasă."
    },
    "ca-RA": {
      meaning: "gray (color)",
      category: "color",
      ipa: "ka.ˈra",
      severity: "low",
      example_sentence: "Cerul e cărăși gri astăzi."
    }
  },

  "acum": {
    "A-cum": {
      meaning: "now",
      category: "time",
      ipa: "ˈa.kum",
      severity: "medium",
      example_sentence: "Trebuie să plec acum."
    },
    "a-CUM": {
      meaning: "emphasis/really",
      category: "emphasis",
      ipa: "a.ˈkum",
      severity: "low",
      example_sentence: "Acum chiar trebuie să plec!"
    }
  },

  "mintea": {
    "MIN-tea": {
      meaning: "the mind",
      category: "cognition",
      ipa: "ˈmin.te̯a",
      severity: "medium",
      example_sentence: "Îmi pierd mintea."
    },
    "min-TEA": {
      meaning: "the mint (plant)",
      category: "plants",
      ipa: "min.ˈte̯a",
      severity: "low",
      example_sentence: "Mentă pentru ceai."
    }
  },

  "politica": {
    "po-LI-ti-ca": {
      meaning: "politics",
      category: "governance",
      ipa: "po.ˈli.ti.ka",
      severity: "high",
      example_sentence: "Politica în România e complicată."
    },
    "po-li-TI-ca": {
      meaning: "the policy",
      category: "rules",
      ipa: "po.li.ˈti.ka",
      severity: "high",
      example_sentence: "Politica companiei interzice fumatul."
    }
  },

  "orice": {
    "O-ri-ce": {
      meaning: "anything",
      category: "quantifier",
      ipa: "ˈo.ri.tʃe",
      severity: "medium",
      example_sentence: "Poți lua orice vrei."
    },
    "o-RI-ce": {
      meaning: "any hour/time",
      category: "time",
      ipa: "o.ˈri.tʃe",
      severity: "low",
      example_sentence: "Orice ar fi ora, te ajut."
    }
  },

  "vedere": {
    "ve-DE-re": {
      meaning: "sight/vision",
      category: "sense",
      ipa: "ve.ˈde.re",
      severity: "medium",
      example_sentence: "Am probleme de vedere."
    },
    "VE-de-re": {
      meaning: "opinion/point of view",
      category: "cognition",
      ipa: "ˈve.de.re",
      severity: "medium",
      example_sentence: "Din punctul meu de vedere..."
    }
  },

  "omul": {
    "O-mul": {
      meaning: "the man/person",
      category: "people",
      ipa: "ˈo.mul",
      severity: "high",
      example_sentence: "Omul acela e doctorul meu."
    },
    "o-MUL": {
      meaning: "the edge/border",
      category: "boundary",
      ipa: "o.ˈmul",
      severity: "medium",
      example_sentence: "Stai pe malul râului."
    }
  }
};

/**
 * Main function to detect intonation shifts that change meaning
 * @param transcript - The user's spoken text
 * @param stressPatterns - Array of words with their detected stress patterns
 * @returns Object containing intonation warnings
 */
export function checkIntonationShift(
  transcript: string,
  stressPatterns: Array<{ word: string; stress: string }>
): { warnings: IntonationWarning[] } {
  const warnings: IntonationWarning[] = [];
  const words = transcript.toLowerCase().split(' ');

  stressPatterns.forEach((pattern, index) => {
    const word = pattern.word.toLowerCase();

    // Check if this word has minimal pairs
    if (STRESS_MINIMAL_PAIRS[word]) {
      const pairs = STRESS_MINIMAL_PAIRS[word];
      const userStress = pattern.stress;

      // Determine expected stress from context
      const expectedStress = determineExpectedStress(word, transcript, index);

      // Compare user stress with expected
      if (userStress !== expectedStress && pairs[userStress] && pairs[expectedStress]) {
        const expectedVariant = pairs[expectedStress];
        const actualVariant = pairs[userStress];

        warnings.push({
          word,
          position: index,
          expected_stress: expectedStress,
          user_stress: userStress,
          expected_meaning: expectedVariant.meaning,
          actual_meaning: actualVariant.meaning,
          severity: actualVariant.severity || 'medium',
          explanation: `Your stress pattern changes the meaning from '${expectedVariant.meaning}' to '${actualVariant.meaning}'`
        });
      }
    }
  });

  return { warnings };
}

/**
 * Helper function to determine expected stress from context
 * Version 1 (MVP): Uses most common stress pattern
 * Version 2 (Future): Analyzes surrounding words for context
 * @param word - The word to analyze
 * @param fullTranscript - Complete user transcript
 * @param wordIndex - Position of word in transcript
 * @returns Expected stress pattern string
 */
function determineExpectedStress(
  word: string,
  fullTranscript: string,
  wordIndex: number
): string {
  const pairs = STRESS_MINIMAL_PAIRS[word];
  if (!pairs) return '';

  // For MVP, return the first (most common) pattern
  // TODO: Implement context analysis for V2
  return Object.keys(pairs)[0];
}

/**
 * Check if a word has stress-based minimal pairs
 * @param word - Word to check
 * @returns True if word has minimal pairs
 */
export function hasMinimalPairs(word: string): boolean {
  return word.toLowerCase() in STRESS_MINIMAL_PAIRS;
}

/**
 * Get all stress variants for a word
 * @param word - Word to get variants for
 * @returns Object with all stress patterns and their meanings
 */
export function getStressVariants(word: string): MinimalPair | null {
  return STRESS_MINIMAL_PAIRS[word.toLowerCase()] || null;
}

/**
 * Get severity level for a stress-based meaning change
 * @param word - Word to check
 * @param userStress - User's stress pattern
 * @param expectedStress - Expected stress pattern
 * @returns Severity level or null if not found
 */
export function getStressErrorSeverity(
  word: string,
  userStress: string,
  expectedStress: string
): 'low' | 'medium' | 'high' | null {
  const pairs = STRESS_MINIMAL_PAIRS[word.toLowerCase()];
  if (!pairs || !pairs[userStress]) return null;
  
  return pairs[userStress].severity || 'medium';
}
