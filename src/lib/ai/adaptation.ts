// src/lib/ai/adaptation.ts
// Adaptation Engine: fossilization-aware targeting with 3 escalation tiers
//
// Closes the Error Garden → content/challenge feedback loop.
// When patterns persist despite exposure, the system progressively
// increases pressure: nudge → push → destabilize.

import { db } from '@/lib/db';
import {
  errorLogs,
  adaptationInterventions,
  type ErrorType,
  type AdaptationTier,
  type AdaptationSource,
  type NewAdaptationIntervention,
} from '@/lib/db/schema';
import { eq, and, gte, isNull, lte, desc } from 'drizzle-orm';

// ─── Types ───

export interface AdaptationPriority {
  patternKey: string; // "grammar|verb_conjugation"
  errorType: ErrorType;
  category: string;
  frequency: number; // 0-100, current
  tier: AdaptationTier;
  trending: 'improving' | 'stable' | 'worsening';
  interventionCount: number; // how many times we've targeted this
  interventionSuccesses: number; // how many interventions showed improvement
  lastInterventionAt: Date | null;
  examples: Array<{ incorrect: string; correct: string | null }>;
}

export interface ContentWeights {
  unseen: number;
  weak: number;
  fossilizing: number;
  random: number;
}

export interface AdaptationProfile {
  userId: string;
  priorities: AdaptationPriority[];
  highestTier: AdaptationTier | 0;
  contentWeights: ContentWeights;
  workshopWeights: ContentWeights; // same shape, potentially different values
  fossilizingPatterns: AdaptationPriority[]; // tier 2+
}

export interface FossilizationAlert {
  pattern: string;
  tier: AdaptationTier;
  examples: Array<{ incorrect: string; correct: string }>;
}

// ─── Constants ───

const FOSSILIZATION_THRESHOLD = 70; // frequency % to be considered fossilizing
const NUDGE_THRESHOLD = 40; // frequency % to start nudging
const TIER2_INTERVENTION_COUNT = 2; // interventions without improvement to escalate to tier 2
const TIER3_INTERVENTION_COUNT = 4; // interventions without improvement to escalate to tier 3
const MEASUREMENT_WINDOW_DAYS = 3; // days before measuring intervention outcomes
const TRENDING_WINDOW_WEEKS = 2; // compare current week to N weeks ago

// Default weights (no fossilizing patterns)
const DEFAULT_WEIGHTS: ContentWeights = { unseen: 0.50, weak: 0.30, fossilizing: 0, random: 0.20 };
const TIER2_WEIGHTS: ContentWeights = { unseen: 0.40, weak: 0.15, fossilizing: 0.25, random: 0.20 };
const TIER3_WEIGHTS: ContentWeights = { unseen: 0.30, weak: 0.15, fossilizing: 0.35, random: 0.20 };

// Workshop weights are the same shape but nudge uses slightly more fossilizing
const TIER1_WORKSHOP_WEIGHTS: ContentWeights = { unseen: 0.40, weak: 0.40, fossilizing: 0, random: 0.20 };
const TIER2_WORKSHOP_WEIGHTS: ContentWeights = { unseen: 0.30, weak: 0.15, fossilizing: 0.35, random: 0.20 };
const TIER3_WORKSHOP_WEIGHTS: ContentWeights = { unseen: 0.20, weak: 0.10, fossilizing: 0.50, random: 0.20 };

// ─── Core Functions ───

/**
 * Main entry point. Computes the full adaptation profile for a user:
 * - Analyzes error patterns and their frequencies
 * - Determines escalation tiers based on intervention history
 * - Computes trending (improving/stable/worsening)
 * - Returns dynamic weights for content and workshop selection
 *
 * Also lazily measures outcomes of past interventions older than 3 days.
 */
export async function getAdaptationProfile(userId: string): Promise<AdaptationProfile> {
  // Parallel: fetch error logs + intervention history
  const [allErrors, interventions] = await Promise.all([
    db.select().from(errorLogs).where(eq(errorLogs.userId, userId)),
    db.select().from(adaptationInterventions)
      .where(eq(adaptationInterventions.userId, userId))
      .orderBy(desc(adaptationInterventions.createdAt)),
  ]);

  if (allErrors.length === 0) {
    return {
      userId,
      priorities: [],
      highestTier: 0,
      contentWeights: DEFAULT_WEIGHTS,
      workshopWeights: TIER1_WORKSHOP_WEIGHTS,
      fossilizingPatterns: [],
    };
  }

  // Lazily measure unmeasured interventions older than 3 days (fire-and-forget)
  measureInterventionOutcomes(userId, allErrors, interventions).catch(err =>
    console.error('[Adaptation] Lazy measurement failed:', err)
  );

  // Group errors by patternKey
  const groups: Record<string, typeof allErrors> = {};
  for (const log of allErrors) {
    const key = `${log.errorType}|${log.category || 'general'}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(log);
  }

  // Build priorities
  const priorities: AdaptationPriority[] = [];

  for (const [patternKey, logs] of Object.entries(groups)) {
    const [errorType, category] = patternKey.split('|');
    const frequency = Math.round((logs.length / allErrors.length) * 100);

    // Skip patterns below nudge threshold
    if (frequency < NUDGE_THRESHOLD) continue;

    // Get intervention history for this pattern
    const patternInterventions = interventions.filter(i => i.patternKey === patternKey);
    const interventionCount = patternInterventions.length;
    const lastInterventionAt = patternInterventions[0]?.createdAt || null;

    // Count successful interventions (frequency decreased after intervention)
    const successfulInterventions = patternInterventions.filter(i =>
      i.frequencyAfterWindow !== null &&
      i.frequencyAfterWindow < i.frequencyAtIntervention
    );
    const interventionSuccesses = successfulInterventions.length;
    const hasImprovement = interventionSuccesses > 0;

    // Determine tier
    let tier: AdaptationTier = 1;
    if (frequency >= FOSSILIZATION_THRESHOLD && interventionCount >= TIER3_INTERVENTION_COUNT && !hasImprovement) {
      tier = 3;
    } else if (frequency >= FOSSILIZATION_THRESHOLD && interventionCount >= TIER2_INTERVENTION_COUNT && !hasImprovement) {
      tier = 2;
    }

    // Compute trending
    const trending = computeTrending(logs);

    // Get recent examples
    const sortedLogs = [...logs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const examples = sortedLogs.slice(0, 5).map(log => ({
      incorrect: log.context || '',
      correct: log.correction,
    }));

    priorities.push({
      patternKey,
      errorType: errorType as ErrorType,
      category,
      frequency,
      tier,
      trending,
      interventionCount,
      interventionSuccesses,
      lastInterventionAt,
      examples,
    });
  }

  // Sort by tier desc, then frequency desc
  priorities.sort((a, b) => b.tier - a.tier || b.frequency - a.frequency);

  const fossilizingPatterns = priorities.filter(p => p.tier >= 2);
  const highestTier = priorities.length > 0 ? priorities[0].tier : 0;

  // Compute dynamic weights based on highest tier
  let contentWeights: ContentWeights;
  let workshopWeights: ContentWeights;

  if (highestTier >= 3) {
    contentWeights = TIER3_WEIGHTS;
    workshopWeights = TIER3_WORKSHOP_WEIGHTS;
  } else if (highestTier >= 2) {
    contentWeights = TIER2_WEIGHTS;
    workshopWeights = TIER2_WORKSHOP_WEIGHTS;
  } else if (priorities.length > 0) {
    // Tier 1: nudge — bump weak weight slightly
    contentWeights = { unseen: 0.40, weak: 0.40, fossilizing: 0, random: 0.20 };
    workshopWeights = TIER1_WORKSHOP_WEIGHTS;
  } else {
    contentWeights = DEFAULT_WEIGHTS;
    workshopWeights = TIER1_WORKSHOP_WEIGHTS;
  }

  return {
    userId,
    priorities,
    highestTier: highestTier as AdaptationTier | 0,
    contentWeights,
    workshopWeights,
    fossilizingPatterns,
  };
}

/**
 * Records that we targeted a pattern via content selection, workshop, or tutor prompt.
 * Append-only insert into adaptation_interventions.
 */
export async function recordIntervention(
  userId: string,
  priority: AdaptationPriority,
  source: AdaptationSource
): Promise<void> {
  const intervention: NewAdaptationIntervention = {
    userId,
    patternKey: priority.patternKey,
    errorType: priority.errorType,
    category: priority.category === 'general' ? null : priority.category,
    tier: priority.tier,
    source,
    frequencyAtIntervention: priority.frequency,
  };

  try {
    await db.insert(adaptationInterventions).values(intervention);
    console.log(`[Adaptation] Recorded ${source} intervention for "${priority.patternKey}" at tier ${priority.tier}`);
  } catch (error) {
    console.error('[Adaptation] Failed to record intervention:', error);
  }
}

/**
 * Lazy evaluation: for unmeasured interventions older than 3 days,
 * compute the current frequency of that pattern and store it.
 * This tells us whether our targeting actually helped.
 */
async function measureInterventionOutcomes(
  userId: string,
  allErrors: typeof errorLogs.$inferSelect[],
  interventions: typeof adaptationInterventions.$inferSelect[]
): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MEASUREMENT_WINDOW_DAYS);

  // Find unmeasured interventions older than 3 days
  const unmeasured = interventions.filter(
    i => i.measuredAt === null && i.createdAt <= cutoff
  );

  if (unmeasured.length === 0) return;

  const totalErrors = allErrors.length;
  if (totalErrors === 0) return;

  // Group current errors for frequency calculation
  const currentGroups: Record<string, number> = {};
  for (const log of allErrors) {
    const key = `${log.errorType}|${log.category || 'general'}`;
    currentGroups[key] = (currentGroups[key] || 0) + 1;
  }

  const now = new Date();

  for (const intervention of unmeasured) {
    const currentCount = currentGroups[intervention.patternKey] || 0;
    const currentFrequency = Math.round((currentCount / totalErrors) * 100);
    const isResolved = currentFrequency < NUDGE_THRESHOLD;

    try {
      await db
        .update(adaptationInterventions)
        .set({
          frequencyAfterWindow: currentFrequency,
          measuredAt: now,
          isResolved,
        })
        .where(eq(adaptationInterventions.id, intervention.id));
    } catch (error) {
      console.error(`[Adaptation] Failed to measure intervention ${intervention.id}:`, error);
    }
  }

  console.log(`[Adaptation] Measured ${unmeasured.length} intervention outcomes for user ${userId}`);
}

/**
 * Compare current week's error frequency to 2 weeks ago.
 */
function computeTrending(
  logs: typeof errorLogs.$inferSelect[]
): 'improving' | 'stable' | 'worsening' {
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

/**
 * Build fossilization alerts for tutor prompts from an adaptation profile.
 * Only returns alerts for tier 2+ patterns.
 */
export function buildFossilizationAlerts(profile: AdaptationProfile): FossilizationAlert[] {
  return profile.fossilizingPatterns
    .filter(p => p.tier >= 2)
    .slice(0, 3) // max 3 alerts to avoid prompt bloat
    .map(p => ({
      pattern: `${p.errorType}: ${p.category}`,
      tier: p.tier,
      examples: p.examples
        .filter(e => e.incorrect && e.correct)
        .slice(0, 2)
        .map(e => ({ incorrect: e.incorrect, correct: e.correct! })),
    }));
}
