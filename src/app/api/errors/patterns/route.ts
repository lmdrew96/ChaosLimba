import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { errorLogs, ErrorLog } from '@/lib/db/schema';
import { eq, sql, desc, and, gte } from 'drizzle-orm';
import { getAdaptationProfile, type AdaptationPriority } from '@/lib/ai/adaptation';
import { mlClusterErrors, type MLCluster } from '@/lib/ai/error-clustering';

export type TrendDirection = 'improving' | 'stable' | 'worsening';

export type ErrorExample = {
  id: string;
  incorrect: string;
  correct: string | null;
  context: string | null;
  timestamp: string;
};

export type ErrorPattern = {
  id: string; // unique key for UI
  errorType: string;
  category: string;
  count: number;
  frequency: number; // 0-100
  recentContext: string | null;
  lastOccurred: Date;
  isFossilizing: boolean; // frequency >= 70%
  // Adaptation Engine data
  tier: 0 | 1 | 2 | 3; // 0 = not tracked, 1 = nudge, 2 = push, 3 = destabilize
  trendDirection: TrendDirection;
  interventionCount: number;
  lastInterventionAt: Date | null;
  interventionSuccesses: number;
  // Detailed fields
  trend: (number | null)[]; // last 5 weeks frequency (0-1), null = no data
  trendLabels: string[];
  examples: ErrorExample[];
  interlanguageRule: string;
  transferSource: string;
  intervention: string;
  theoreticalBasis: string;
  incorrectUsage: number;
  correctUsage: number;
};

/**
 * Normalize category string to snake_case for lookup.
 * Handles variations like "verb conjugation", "Verb Conjugation", "verbConjugation"
 */
function normalizeCategory(category: string): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
    .replace(/^_|_$/g, '')       // Trim leading/trailing underscores
    .replace(/_+/g, '_');        // Collapse multiple underscores
}

/**
 * Get specific interlanguage analysis for an error pattern.
 * Returns pedagogically-grounded descriptions based on SLA theory.
 */
function getInterlanguageAnalysis(errorType: string, category: string): {
  interlanguageRule: string;
  transferSource: string;
  intervention: string;
  theoreticalBasis: string;
} {
  const categoryNorm = normalizeCategory(category);

  // Grammar-specific rules (with aliases for common variations)
  const grammarRules: Record<string, { rule: string; transfer: string; intervention: string }> = {
    // Verb conjugation (+ aliases)
    'verb_conjugation': {
      rule: 'Applying infinitive or base form where conjugated form required',
      transfer: 'L1 verb paradigm (English lacks person/number marking)',
      intervention: 'Conjugation drills with high-frequency verbs',
    },
    'conjugation': {
      rule: 'Applying infinitive or base form where conjugated form required',
      transfer: 'L1 verb paradigm (English lacks person/number marking)',
      intervention: 'Conjugation drills with high-frequency verbs',
    },
    'verb': {
      rule: 'Applying infinitive or base form where conjugated form required',
      transfer: 'L1 verb paradigm (English lacks person/number marking)',
      intervention: 'Conjugation drills with high-frequency verbs',
    },
    // Noun declension
    'noun_declension': {
      rule: 'Using nominative form in oblique case positions',
      transfer: 'L1 lacks grammatical case (English)',
      intervention: 'Case-function mapping exercises',
    },
    'declension': {
      rule: 'Using nominative form in oblique case positions',
      transfer: 'L1 lacks grammatical case (English)',
      intervention: 'Case-function mapping exercises',
    },
    'case': {
      rule: 'Using nominative form in oblique case positions',
      transfer: 'L1 lacks grammatical case (English)',
      intervention: 'Case-function mapping exercises',
    },
    // Gender agreement
    'gender_agreement': {
      rule: 'Default masculine assignment or adjective-noun mismatch',
      transfer: 'L1 lacks grammatical gender (English)',
      intervention: 'Noun-adjective pairing with gender cues',
    },
    'gender': {
      rule: 'Default masculine assignment or adjective-noun mismatch',
      transfer: 'L1 lacks grammatical gender (English)',
      intervention: 'Noun-adjective pairing with gender cues',
    },
    'agreement': {
      rule: 'Default masculine assignment or adjective-noun mismatch',
      transfer: 'L1 lacks grammatical gender (English)',
      intervention: 'Noun-adjective pairing with gender cues',
    },
    // Article usage
    'article_usage': {
      rule: 'Omitting definite article or incorrect enclitic placement',
      transfer: 'L1 proclitic article position (English "the")',
      intervention: 'Article attachment pattern practice',
    },
    'article': {
      rule: 'Omitting definite article or incorrect enclitic placement',
      transfer: 'L1 proclitic article position (English "the")',
      intervention: 'Article attachment pattern practice',
    },
    'definite_article': {
      rule: 'Omitting definite article or incorrect enclitic placement',
      transfer: 'L1 proclitic article position (English "the")',
      intervention: 'Article attachment pattern practice',
    },
    // Tense/aspect
    'tense_aspect': {
      rule: 'Confusing perfective/imperfective or compound past forms',
      transfer: 'L1 aspect marking differs (English progressive)',
      intervention: 'Aspectual contrast in context',
    },
    'tense': {
      rule: 'Confusing perfective/imperfective or compound past forms',
      transfer: 'L1 aspect marking differs (English progressive)',
      intervention: 'Aspectual contrast in context',
    },
    'aspect': {
      rule: 'Confusing perfective/imperfective or compound past forms',
      transfer: 'L1 aspect marking differs (English progressive)',
      intervention: 'Aspectual contrast in context',
    },
    // Preposition
    'preposition': {
      rule: 'Direct translation of L1 preposition without case governance',
      transfer: 'L1 preposition-noun collocations',
      intervention: 'Preposition + case combination drills',
    },
    'preposition_error': {
      rule: 'Direct translation of L1 preposition without case governance',
      transfer: 'L1 preposition-noun collocations',
      intervention: 'Preposition + case combination drills',
    },
    // Word formation
    'word_formation': {
      rule: 'Incorrect derivational suffix or prefix application',
      transfer: 'L1 word formation patterns',
      intervention: 'Morphological family exploration',
    },
    'morphology': {
      rule: 'Incorrect derivational suffix or prefix application',
      transfer: 'L1 word formation patterns',
      intervention: 'Morphological family exploration',
    },
    // Negation
    'negation': {
      rule: 'Single negation where double negation required',
      transfer: 'L1 single negation rule (English)',
      intervention: 'Negative concord pattern practice',
    },
    'double_negation': {
      rule: 'Single negation where double negation required',
      transfer: 'L1 single negation rule (English)',
      intervention: 'Negative concord pattern practice',
    },
    // Clitic placement
    'clitic_placement': {
      rule: 'Incorrect position of object pronouns in verb complex',
      transfer: 'L1 fixed word order (English SVO)',
      intervention: 'Clitic climbing and placement rules',
    },
    'clitic': {
      rule: 'Incorrect position of object pronouns in verb complex',
      transfer: 'L1 fixed word order (English SVO)',
      intervention: 'Clitic climbing and placement rules',
    },
    'pronoun': {
      rule: 'Incorrect position of object pronouns in verb complex',
      transfer: 'L1 fixed word order (English SVO)',
      intervention: 'Clitic climbing and placement rules',
    },
    // Subjunctive
    'subjunctive': {
      rule: 'Using indicative where subjunctive mood required',
      transfer: 'L1 lacks productive subjunctive (English)',
      intervention: 'Subjunctive trigger recognition',
    },
    'mood': {
      rule: 'Using indicative where subjunctive mood required',
      transfer: 'L1 lacks productive subjunctive (English)',
      intervention: 'Subjunctive trigger recognition',
    },
    // Diacritics / spelling
    'diacritics': {
      rule: 'Missing or incorrect Romanian diacritical marks (ă, â, î, ș, ț)',
      transfer: 'L1 lacks diacritics (English ASCII)',
      intervention: 'Diacritic awareness and typing practice',
    },
    'spelling': {
      rule: 'Orthographic error in Romanian word',
      transfer: 'L1 spelling conventions',
      intervention: 'Spelling pattern recognition',
    },
    // General
    'general': {
      rule: 'Systematic deviation in grammatical structure',
      transfer: 'L1 grammatical transfer',
      intervention: 'Targeted grammar practice',
    },
    'grammar_correction': {
      rule: 'Systematic deviation in grammatical structure',
      transfer: 'L1 grammatical transfer',
      intervention: 'Targeted grammar practice',
    },
  };

  // Pronunciation-specific rules
  const pronunciationRules: Record<string, { rule: string; transfer: string; intervention: string }> = {
    'vowel': {
      rule: 'Substituting L1 vowel quality for Romanian vowels',
      transfer: 'L1 vowel inventory (English has different set)',
      intervention: 'Minimal pair discrimination (ă/a, î/i)',
    },
    'consonant': {
      rule: 'Devoicing final consonants or incorrect palatalization',
      transfer: 'L1 phonotactic constraints',
      intervention: 'Consonant contrast drills',
    },
    'stress': {
      rule: 'Applying L1 stress patterns to Romanian words',
      transfer: 'L1 stress rules (English stress timing)',
      intervention: 'Stress pattern listening and repetition',
    },
    'intonation': {
      rule: 'Using L1 intonation contours in Romanian sentences',
      transfer: 'L1 prosodic patterns',
      intervention: 'Intonation shadowing exercises',
    },
    'diphthong': {
      rule: 'Monophthongizing Romanian diphthongs',
      transfer: 'L1 diphthong inventory differs',
      intervention: 'Diphthong glide practice',
    },
  };

  // Vocabulary-specific rules
  const vocabularyRules: Record<string, { rule: string; transfer: string; intervention: string }> = {
    'false_friend': {
      rule: 'Assuming cognate has same meaning as L1 equivalent',
      transfer: 'L1 lexical form similarity',
      intervention: 'False friend contrast pairs',
    },
    'collocation': {
      rule: 'Direct translation of L1 word combinations',
      transfer: 'L1 collocational patterns',
      intervention: 'Romanian collocation exposure',
    },
    'register': {
      rule: 'Using informal vocabulary in formal contexts or vice versa',
      transfer: 'L1 register boundaries differ',
      intervention: 'Register-appropriate vocabulary sorting',
    },
    'semantic_range': {
      rule: 'Over-extending word meaning beyond Romanian usage',
      transfer: 'L1 semantic boundaries',
      intervention: 'Semantic field mapping',
    },
  };

  // Word order specific rules
  const wordOrderRules: Record<string, { rule: string; transfer: string; intervention: string }> = {
    'adjective_position': {
      rule: 'Placing adjective before noun (L1 pattern)',
      transfer: 'L1 prenominal adjective rule (English)',
      intervention: 'Adjective-noun order practice',
    },
    'clitic_order': {
      rule: 'Incorrect sequencing of pronominal clitics',
      transfer: 'L1 lacks clitic clusters',
      intervention: 'Clitic ordering drills',
    },
    'topic_focus': {
      rule: 'Using rigid SVO where topic-fronting expected',
      transfer: 'L1 fixed word order',
      intervention: 'Information structure exercises',
    },
  };

  // Helper: fuzzy match - find a key that's contained in the category
  function fuzzyMatch(rules: Record<string, any>, cat: string): string | null {
    // Priority keywords to check (longer/more specific first)
    const priorityKeys = [
      'verb_conjugation', 'conjugation', 'verb',
      'noun_declension', 'declension', 'case',
      'gender_agreement', 'gender', 'agreement',
      'article_usage', 'article', 'definite',
      'tense_aspect', 'tense', 'aspect',
      'preposition',
      'diacritics', 'spelling',
      'subjunctive', 'mood',
      'clitic', 'pronoun',
      'negation',
    ];

    for (const key of priorityKeys) {
      if (cat.includes(key) && rules[key]) {
        return key;
      }
    }
    return null;
  }

  // Look up specific rule or return default for error type
  if (errorType === 'grammar') {
    // Try direct lookup first
    let specific = grammarRules[categoryNorm];

    // Try fuzzy match if direct lookup fails
    if (!specific) {
      const fuzzyKey = fuzzyMatch(grammarRules, categoryNorm);
      if (fuzzyKey) specific = grammarRules[fuzzyKey];
    }

    if (specific) {
      return {
        interlanguageRule: specific.rule,
        transferSource: specific.transfer,
        intervention: specific.intervention,
        theoreticalBasis: 'Interlanguage Theory (Selinker, 1972)',
      };
    }
    return {
      interlanguageRule: 'Systematic deviation in grammatical structure',
      transferSource: 'L1 grammatical transfer',
      intervention: 'Targeted grammar practice',
      theoreticalBasis: 'Interlanguage Theory (Selinker, 1972)',
    };
  }

  if (errorType === 'pronunciation') {
    const specific = pronunciationRules[categoryNorm];
    if (specific) {
      return {
        interlanguageRule: specific.rule,
        transferSource: specific.transfer,
        intervention: specific.intervention,
        theoreticalBasis: 'Contrastive Analysis (Lado, 1957)',
      };
    }
    return {
      interlanguageRule: 'L1 phonological pattern applied to Romanian',
      transferSource: 'L1 sound system',
      intervention: 'Pronunciation focused practice',
      theoreticalBasis: 'Contrastive Analysis (Lado, 1957)',
    };
  }

  if (errorType === 'vocabulary') {
    const specific = vocabularyRules[categoryNorm];
    if (specific) {
      return {
        interlanguageRule: specific.rule,
        transferSource: specific.transfer,
        intervention: specific.intervention,
        theoreticalBasis: 'Lexical Transfer Theory',
      };
    }
    return {
      interlanguageRule: 'L1 lexical concept mapped to Romanian',
      transferSource: 'L1 semantic system',
      intervention: 'Contextual vocabulary practice',
      theoreticalBasis: 'Lexical Transfer Theory',
    };
  }

  if (errorType === 'word_order') {
    const specific = wordOrderRules[categoryNorm];
    if (specific) {
      return {
        interlanguageRule: specific.rule,
        transferSource: specific.transfer,
        intervention: specific.intervention,
        theoreticalBasis: 'Processability Theory (Pienemann, 1998)',
      };
    }
    return {
      interlanguageRule: 'L1 word order applied to Romanian syntax',
      transferSource: 'L1 syntactic structure',
      intervention: 'Word order manipulation exercises',
      theoreticalBasis: 'Processability Theory (Pienemann, 1998)',
    };
  }

  // Default fallback
  return {
    interlanguageRule: 'Systematic deviation from target language norm',
    transferSource: 'L1 interference',
    intervention: 'Focused practice with feedback',
    theoreticalBasis: 'Interlanguage Theory (Selinker, 1972)',
  };
}

/**
 * Simple clustering by errorType + category (fallback when ML disabled).
 */
function simpleClusterErrors(errors: typeof errorLogs.$inferSelect[]): Record<string, typeof errors> {
  const clusters: Record<string, typeof errors> = {};

  errors.forEach(error => {
    // Simple key: errorType + category
    const key = `${error.errorType}|${error.category || 'general'}`;

    if (clusters[key]) {
      clusters[key].push(error);
    } else {
      clusters[key] = [error];
    }
  });

  return clusters;
}

/**
 * Convert ML clusters to the simple Record format for compatibility.
 */
function mlClustersToRecord(clusters: MLCluster[]): Record<string, typeof errorLogs.$inferSelect[]> {
  const result: Record<string, typeof errorLogs.$inferSelect[]> = {};

  for (const cluster of clusters) {
    result[cluster.key] = cluster.logs;
  }

  return result;
}

/**
 * Get the start of a week for a given date (Monday-based).
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate real weekly trend from historical error data.
 * Returns frequency values for the last 5 weeks.
 */
function calculateWeeklyTrend(
  patternLogs: typeof errorLogs.$inferSelect[],
  allLogs: typeof errorLogs.$inferSelect[]
): { trend: (number | null)[]; labels: string[] } {
  const now = new Date();
  const weeks: { start: Date; label: string }[] = [];

  // Generate last 5 weeks
  for (let i = 4; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    weeks.push({
      start: weekStart,
      label: i === 0 ? 'This week' : i === 1 ? 'Last week' : `${i} weeks ago`
    });
  }

  // Count errors per week
  const trend: (number | null)[] = weeks.map(({ start }) => {
    const weekEnd = new Date(start);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Count pattern errors in this week
    const patternCount = patternLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      return logDate >= start && logDate < weekEnd;
    }).length;

    // Count total errors in this week
    const totalCount = allLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      return logDate >= start && logDate < weekEnd;
    }).length;

    // Return frequency or null if no data
    if (totalCount === 0) return null;
    return patternCount / totalCount;
  });

  const labels = weeks.map(w => w.label);

  return { trend, labels };
}

/**
 * Compute trending direction locally (fallback when not in adaptation engine).
 * Compares current week errors to previous week.
 */
function computeLocalTrending(
  logs: typeof errorLogs.$inferSelect[]
): TrendDirection {
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const currentWeek = logs.filter(l => l.createdAt >= oneWeekAgo).length;
  const previousWeek = logs.filter(l => l.createdAt >= twoWeeksAgo && l.createdAt < oneWeekAgo).length;

  // Need some data in the previous window to compare
  if (previousWeek === 0) return 'stable';

  const ratio = currentWeek / previousWeek;
  if (ratio < 0.7) return 'improving';
  if (ratio > 1.3) return 'worsening';
  return 'stable';
}

// GET /api/errors/patterns - Get aggregated error patterns for Error Garden
// Query params:
//   ?ml=true - Enable ML-based semantic clustering (slower but smarter)
//   ?threshold=0.65 - Similarity threshold for ML clustering (0.0-1.0)
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params for ML clustering
    const { searchParams } = new URL(req.url);
    const useML = searchParams.get('ml') === 'true';
    const threshold = parseFloat(searchParams.get('threshold') || '0.65');

    // Parallel: fetch error logs + adaptation profile
    const [allLogs, adaptProfile] = await Promise.all([
      db
        .select()
        .from(errorLogs)
        .where(eq(errorLogs.userId, userId))
        .orderBy(desc(errorLogs.createdAt)),
      getAdaptationProfile(userId),
    ]);

    const totalErrors = allLogs.length;

    if (totalErrors === 0) {
      return NextResponse.json({
        patterns: [],
        stats: {
          totalErrors: 0,
          patternCount: 0,
          fossilizingCount: 0,
          tier2PlusCount: 0,
          mlEnabled: useML,
        },
      });
    }

    // Build lookup map from adaptation priorities for quick matching
    const adaptationLookup = new Map<string, AdaptationPriority>();
    for (const priority of adaptProfile.priorities) {
      adaptationLookup.set(priority.patternKey, priority);
    }

    // Cluster errors - use ML or simple clustering based on query param
    let clusteredErrors: Record<string, typeof allLogs>;
    let clusteringMethod = 'simple';

    if (useML) {
      try {
        console.log('[Patterns API] Using ML clustering with threshold:', threshold);
        const mlClusters = await mlClusterErrors(allLogs, {
          similarityThreshold: threshold,
          minClusterSize: 1,
        });
        clusteredErrors = mlClustersToRecord(mlClusters);
        clusteringMethod = 'ml';
        console.log(`[Patterns API] ML clustering created ${Object.keys(clusteredErrors).length} clusters`);
      } catch (error) {
        console.error('[Patterns API] ML clustering failed, falling back to simple:', error);
        clusteredErrors = simpleClusterErrors(allLogs);
      }
    } else {
      clusteredErrors = simpleClusterErrors(allLogs);
    }

    const patterns: ErrorPattern[] = Object.keys(clusteredErrors).map((key, index) => {
      const logs = clusteredErrors[key];
      const count = logs.length;
      const frequency = Math.round((count / totalErrors) * 100);
      const isFossilizing = frequency >= 70;

      const latestLog = logs[0];
      const errorType = latestLog.errorType;
      const category = latestLog.category || 'General';

      // Match with adaptation engine data
      const adaptationKey = `${errorType}|${category.toLowerCase()}`;
      const adaptPriority = adaptationLookup.get(adaptationKey);

      // Get tier and trending from adaptation engine (or compute fallback)
      const tier: 0 | 1 | 2 | 3 = adaptPriority?.tier || 0;
      const trendDirection: TrendDirection = adaptPriority?.trending || computeLocalTrending(logs);
      const interventionCount = adaptPriority?.interventionCount || 0;
      const lastInterventionAt = adaptPriority?.lastInterventionAt || null;
      const interventionSuccesses = adaptPriority?.interventionSuccesses || 0;

      // Calculate real weekly trend
      const { trend, labels: trendLabels } = calculateWeeklyTrend(logs, allLogs);

      // Extract examples
      const examples: ErrorExample[] = logs.slice(0, 5).map(log => ({
        id: log.id,
        incorrect: log.context || 'Unknown context',
        correct: log.correction,
        context: log.source === 'chaos_window' ? 'Chaos Window Practice' : 'Content Interaction',
        timestamp: log.createdAt.toISOString().split('T')[0],
      }));

      // Get specific interlanguage analysis based on error type + category
      const analysis = getInterlanguageAnalysis(errorType, category);
      const { interlanguageRule, transferSource, intervention, theoreticalBasis } = analysis;

      return {
        id: `pattern-${index}`,
        errorType,
        category,
        count,
        frequency,
        recentContext: latestLog.context,
        lastOccurred: latestLog.createdAt,
        isFossilizing,
        tier,
        trendDirection,
        interventionCount,
        lastInterventionAt,
        interventionSuccesses,
        trend,
        trendLabels,
        examples,
        interlanguageRule,
        transferSource,
        intervention,
        theoreticalBasis,
        incorrectUsage: count,
        // Estimate correct usage based on session data (would be more accurate with tracked successes)
        correctUsage: Math.max(1, Math.round(count * (1 / (frequency / 100) - 1))),
      };
    });

    const fossilizingCount = patterns.filter((p) => p.isFossilizing).length;
    const tier2PlusCount = patterns.filter((p) => p.tier >= 2).length;

    // Sort by frequency by default
    patterns.sort((a, b) => b.frequency - a.frequency);

    return NextResponse.json({
      patterns,
      stats: {
        totalErrors,
        patternCount: patterns.length,
        fossilizingCount,
        tier2PlusCount,
        mlEnabled: clusteringMethod === 'ml',
        clusteringMethod,
      },
    });
  } catch (error) {
    console.error('Failed to fetch error patterns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error patterns' },
      { status: 500 }
    );
  }
}
