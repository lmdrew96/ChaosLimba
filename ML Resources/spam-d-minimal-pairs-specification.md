# SPAM-D: Intonation-Meaning Mapper - Minimal Pairs Specification

**Component:** #5 - SPAM-D (Semantic/Pragmatic Analysis Module - Dialectal/Intonation)
**Type:** Rule-based lookup system
**Purpose:** Detect stress pattern shifts that change word meaning in Romanian
**Target:** 50-100 stress-based minimal pairs
**Status:** 🔧 Research & Implementation Required

---

## Overview

SPAM-D is a rule-based component that identifies cases where incorrect stress patterns change the meaning of Romanian words. Unlike other components that use machine learning, SPAM-D uses a curated lookup table of minimal pairs where stress placement is meaning-distinctive.

### What Are Stress-Based Minimal Pairs?

Minimal pairs are words that differ by only one phonological element (in this case, stress placement) but have different meanings. In Romanian, incorrect stress can completely change what you're saying:

**Example:**
- **TOR-tu-ri** (stress on first syllable) = "cakes"
- **tor-TU-ri** (stress on second syllable) = "tortures"

Saying "Vreau torturi" (I want cakes) with the wrong stress could mean "I want tortures"!

---

## Component Architecture

### Data Structure

```javascript
// File: /lib/spam-d-minimal-pairs.ts

export interface StressVariant {
  meaning: string;           // English translation
  category: string;          // Semantic category (food, violence, furniture, etc.)
  ipa: string;              // IPA notation with stress marker
  severity?: 'low' | 'medium' | 'high';  // Importance of getting it right
  example_sentence?: string; // Example usage
}

export interface MinimalPair {
  [stressPattern: string]: StressVariant;
}

export const STRESS_MINIMAL_PAIRS: Record<string, MinimalPair> = {
  // Each word maps to an object of stress patterns and their meanings
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
  // ... 49-99 more pairs to be researched and added
};
```

### Function Logic

```javascript
export interface IntonationWarning {
  word: string;
  position: number;              // Word index in sentence
  expected_stress: string;       // Context-appropriate stress
  user_stress: string;           // What user actually said
  expected_meaning: string;      // What they meant to say
  actual_meaning: string;        // What they actually said
  severity: 'low' | 'medium' | 'high';
  explanation: string;           // User-friendly explanation
}

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

      // Determine expected stress from context (simplified for now)
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

// Helper function to determine expected stress from context
function determineExpectedStress(
  word: string,
  fullTranscript: string,
  wordIndex: number
): string {
  // Version 1 (MVP): Use most common stress pattern
  // Version 2 (Future): Analyze surrounding words for context

  const pairs = STRESS_MINIMAL_PAIRS[word];
  if (!pairs) return '';

  // For now, return the first (most common) pattern
  // TODO: Implement context analysis
  return Object.keys(pairs)[0];
}
```

---

## Research Phase: Building the Minimal Pairs Database

### Goal: 50-100 Minimal Pairs

The research phase involves identifying Romanian words where stress placement is meaning-distinctive. This requires:

1. **Linguistic Research**: Consult Romanian phonology resources
2. **Native Speaker Consultation**: Validate pairs with Romanian speakers
3. **Frequency Analysis**: Prioritize common words learners will encounter
4. **Categorization**: Organize by semantic domain and severity

### Research Sources

#### Academic Resources
- **Romanian Phonology Textbooks**:
  - Chitoran, I. (2001). *The Phonology of Romanian: A Constraint-based Approach*
  - Dindelegan, G. P. (2013). *The Grammar of Romanian*

- **Romanian Linguistics Papers**:
  - Papers on Romanian prosody and stress patterns
  - Studies on minimal pairs in Romance languages

- **Linguistic Databases**:
  - RoWordNet (semantic relationships)
  - Romanian pronunciation dictionaries with IPA

#### Online Resources
- **Dexonline.ro**: Romanian dictionary with pronunciation guides
- **Forvo.com**: Audio pronunciations from native speakers
- **Romanian Language Forums**: Native speaker discussions of confusing words

#### Consultation
- **Native Romanian Linguists**: Academic experts in Romanian phonology
- **Language Teachers**: Instructors who know common learner errors
- **Romanian Speakers**: Crowdsourcing from native speaker community

### Categorization Strategy

Organize minimal pairs by **severity of misunderstanding**:

#### High Severity (Critical to Get Right)
Words where stress error causes:
- Completely opposite meanings (positive ↔ negative)
- Potentially offensive/inappropriate meaning
- Serious miscommunication in practical contexts

**Example**: torturi (cakes vs. tortures) - confusing these in a restaurant would be problematic!

#### Medium Severity (Important but Context Usually Helps)
Words where stress error causes:
- Different but related meanings
- Confusion that context can usually resolve
- Less dramatic but still noticeable errors

#### Low Severity (Minor Confusion)
Words where stress error causes:
- Subtle meaning shifts
- Dialectal variations
- Rarely leads to serious misunderstanding

---

## Initial Minimal Pairs (Starter Set)

Below is a starter set to illustrate the data structure. Research is needed to expand this to 50-100 pairs.

### Documented Pairs (10 examples)

```javascript
export const STRESS_MINIMAL_PAIRS_V1 = {
  "torturi": {
    "TOR-tu-ri": {
      meaning: "cakes",
      category: "food",
      ipa: "ˈtor.tu.ri",
      severity: "high",
      example_sentence: "Am cumpărat torturi pentru petrecere."
    },
    "tor-TU-ri": {
      meaning: "tortures",
      category: "violence",
      ipa: "tor.ˈtu.ri",
      severity: "high",
      example_sentence: "Torturile aplicate prizonierilor sunt ilegale."
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
```

### Pairs Requiring Research (40-90 more needed)

The following categories likely contain stress-based minimal pairs that need to be researched:

1. **Food vs. Violence** (like torturi): Look for other food words with violent/negative stress variants
2. **Objects vs. Abstract Concepts**: Concrete nouns with abstract meaning variants
3. **Verb Forms**: Different tenses or moods distinguished by stress
4. **Diminutives vs. Base Forms**: -ul/-uș endings with stress differences
5. **Borrowed Words**: Foreign words adapted into Romanian with stress variants
6. **Regional Variations**: Dialectal stress differences with meaning changes
7. **Compound Words**: Multi-syllable compounds where stress matters
8. **Technical vs. Everyday**: Same spelling, different stress for specialized meaning

---

## Implementation Checklist

### Phase 1: Research (Days 1-3)
- [ ] Compile list of 50-100 candidate minimal pairs from linguistic sources
- [ ] Validate pairs with native Romanian speakers
- [ ] Obtain IPA transcriptions for each variant
- [ ] Categorize pairs by severity (high/medium/low)
- [ ] Create example sentences for context

### Phase 2: Data Entry (Day 4)
- [ ] Create TypeScript interface definitions
- [ ] Enter all pairs into STRESS_MINIMAL_PAIRS object
- [ ] Add metadata (category, severity, IPA, examples)
- [ ] Organize pairs by frequency of use

### Phase 3: Logic Implementation (Days 5-6)
- [ ] Write checkIntonationShift function
- [ ] Implement determineExpectedStress helper (context analysis)
- [ ] Create severity-based warning generation
- [ ] Add support for multi-syllable stress patterns

### Phase 4: Testing (Day 7)
- [ ] Unit tests for known minimal pairs
- [ ] Test with real pronunciation data
- [ ] Validate false positive rate (<5%)
- [ ] Ensure no false negatives on high-severity pairs

### Phase 5: Documentation (Day 8)
- [ ] Document all 50-100 pairs with sources
- [ ] Create user-facing explanations
- [ ] Write developer guide for adding new pairs
- [ ] Publish minimal pairs list for community feedback

---

## Performance Characteristics

### Expected Performance
- **Response Time**: <10ms (in-app, no API call)
- **Memory Usage**: ~50-200KB (lookup table in memory)
- **Accuracy**: >90% on known pairs, 0% false positives on unknown words
- **Coverage**: 50-100 most common stress-sensitive words

### Advantages of Rule-Based Approach
1. **Zero Cost**: No API calls, runs in-app
2. **Instant**: No network latency
3. **Deterministic**: Same input always gives same output
4. **Explainable**: Can show exactly why a warning was triggered
5. **No Training Required**: Just needs linguistic research

### Limitations
1. **Coverage**: Only works for words in the lookup table
2. **Context Sensitivity**: V1 doesn't analyze surrounding context
3. **Maintenance**: New pairs must be manually added
4. **Dialectal Variation**: May not capture all regional stress patterns

---

## Future Enhancements (Post-MVP)

### Version 2: Context-Aware Stress Detection
Instead of using the "most common" stress pattern, analyze surrounding words:
- Parse sentence grammar to determine if noun/verb expected
- Check semantic coherence (food context → likely TOR-tu-ri)
- Use SPAM-A semantic similarity to validate choice

### Version 3: Machine Learning Augmentation
Train a small classifier to:
- Predict expected stress from context
- Identify new minimal pair candidates from user errors
- Suggest additions to the minimal pairs database

### Version 4: Community Contributions
- Allow users to report new minimal pairs they've encountered
- Crowdsource severity ratings from learner experiences
- Build dialect-specific versions (Transylvania, Moldova, Bucharest)

---

## Resources for Researchers

### Citation Format
When documenting sources for minimal pairs, use:
```
Word: [romanian_word]
Pair: [stress_pattern_1] vs [stress_pattern_2]
Source: [Author, Year, Title, Page]
Validated by: [Native speaker name/credentials]
Date added: [YYYY-MM-DD]
```

### Example:
```
Word: torturi
Pair: TOR-tu-ri (cakes) vs tor-TU-ri (tortures)
Source: Chitoran, I. (2001). The Phonology of Romanian, p. 87
Validated by: Dr. Maria Popescu (Romanian linguist, University of Bucharest)
Date added: 2026-01-19
Additional validation: Confirmed in Dexonline.ro pronunciation guide
```

---

## Questions for Nae

Before proceeding with full research phase:

1. **Severity Thresholds**: Should high-severity warnings block progression, or just notify?
2. **User Experience**: How should intonation warnings be displayed in the UI?
3. **Native Speaker Access**: Do you have connections to Romanian linguists or can we crowdsource?
4. **Regional Focus**: Should we prioritize standard Romanian or include regional variations?
5. **Timeline**: Is the 7-8 day estimate for SPAM-D research + implementation realistic given other priorities?

---

**Next Steps**: Begin Phase 1 research to compile 50-100 minimal pairs from linguistic sources and native speaker consultation.
