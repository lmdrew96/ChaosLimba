import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userPreferences, proficiencyHistory } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import {
    type CEFRLevel,
    calculateProficiencyScore,
    getSkillBreakdown
} from '@/lib/proficiency';

// CEFR level ordering for progress calculation
const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Default 0-100 scores per onboarding CEFR level (starting baseline)
const ONBOARDING_DEFAULTS: Record<CEFRLevel, number> = {
    'A1': 10,
    'A2': 30,
    'B1': 50,
    'B2': 70,
    'C1': 85,
    'C2': 95,
};

// Recency weights: [most recent, 2nd most recent, ...]
const WEIGHTS = [4, 3, 2, 1, 1, 1, 1, 1, 1, 1];

/**
 * Weighted average of recent records. Most recent record counts 4x, next 3x, etc.
 */
function weightedAvg(values: (number | null)[]): number | null {
    let sum = 0;
    let totalWeight = 0;
    for (let i = 0; i < values.length; i++) {
        const v = values[i];
        if (v === null) continue;
        const w = WEIGHTS[i] ?? 1;
        sum += v * w;
        totalWeight += w;
    }
    return totalWeight > 0 ? sum / totalWeight : null;
}

/**
 * Compute trend from last 3 data points: 'improving' | 'declining' | 'stable'
 */
function computeTrend(values: (number | null)[]): 'improving' | 'declining' | 'stable' {
    const valid = values.filter((v): v is number => v !== null).slice(0, 3);
    if (valid.length < 2) return 'stable';

    // Compare most recent vs oldest in the window
    const diff = valid[0] - valid[valid.length - 1];
    if (diff > 0.3) return 'improving';
    if (diff < -0.3) return 'declining';
    return 'stable';
}

/**
 * GET /api/proficiency
 * Returns current proficiency with skill breakdown, computed from real session data.
 */
export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user preferences (contains onboarding languageLevel)
        const prefs = await db.select()
            .from(userPreferences)
            .where(eq(userPreferences.userId, userId))
            .limit(1);

        const userPref = prefs[0];
        const onboardingLevel = (userPref?.languageLevel as CEFRLevel) || 'A1';

        // Fetch recent proficiency history (up to 10 records, newest first)
        const history = await db.select()
            .from(proficiencyHistory)
            .where(eq(proficiencyHistory.userId, userId))
            .orderBy(desc(proficiencyHistory.recordedAt))
            .limit(10);

        let scores: {
            readingScore: number;
            listeningScore: number;
            writingScore: number;
            speakingScore: number;
        };
        let lastUpdated: string | null = null;
        let trends: Record<string, 'improving' | 'declining' | 'stable'> = {
            listening: 'stable',
            reading: 'stable',
            speaking: 'stable',
            writing: 'stable',
        };

        if (history.length > 0) {
            lastUpdated = history[0].recordedAt.toISOString();

            // Extract per-skill score arrays (1.0-10.0 scale from DB)
            const listeningRaw = history.map(h => h.listeningScore ? parseFloat(h.listeningScore) : null);
            const readingRaw = history.map(h => h.readingScore ? parseFloat(h.readingScore) : null);
            const speakingRaw = history.map(h => h.speakingScore ? parseFloat(h.speakingScore) : null);
            const writingRaw = history.map(h => h.writingScore ? parseFloat(h.writingScore) : null);

            // Weighted averages (1.0-10.0 scale)
            const listeningAvg = weightedAvg(listeningRaw);
            const readingAvg = weightedAvg(readingRaw);
            const speakingAvg = weightedAvg(speakingRaw);
            const writingAvg = weightedAvg(writingRaw);

            // Convert to 0-100 scale for proficiency lib (score * 10)
            const fallback = ONBOARDING_DEFAULTS[onboardingLevel];
            scores = {
                listeningScore: listeningAvg !== null ? listeningAvg * 10 : fallback,
                readingScore: readingAvg !== null ? readingAvg * 10 : fallback,
                speakingScore: speakingAvg !== null ? speakingAvg * 10 : fallback,
                writingScore: writingAvg !== null ? writingAvg * 10 : fallback,
            };

            // Compute trends per skill
            trends = {
                listening: computeTrend(listeningRaw),
                reading: computeTrend(readingRaw),
                speaking: computeTrend(speakingRaw),
                writing: computeTrend(writingRaw),
            };
        } else {
            // No history — use onboarding level defaults
            const fallback = ONBOARDING_DEFAULTS[onboardingLevel];
            scores = {
                readingScore: fallback,
                listeningScore: fallback,
                writingScore: fallback,
                speakingScore: fallback,
            };
        }

        // Get skill breakdown using proficiency library (0-100 scale input)
        const breakdown = getSkillBreakdown(scores);
        const overallScore = calculateProficiencyScore(scores);

        const currentLevel = breakdown.overall.level;
        const currentLevelIndex = CEFR_ORDER.indexOf(currentLevel);
        const nextLevel = CEFR_ORDER[currentLevelIndex + 1] || 'C2';

        // Progress within current level (0-100%)
        const levelScoreRanges: Record<CEFRLevel, { min: number; max: number }> = {
            'A1': { min: 0, max: 25 },
            'A2': { min: 25, max: 45 },
            'B1': { min: 45, max: 65 },
            'B2': { min: 65, max: 80 },
            'C1': { min: 80, max: 90 },
            'C2': { min: 90, max: 100 },
        };

        const range = levelScoreRanges[currentLevel];
        const rawProgress = ((breakdown.overall.score - range.min) / (range.max - range.min)) * 100;
        const progress = Math.min(100, Math.max(0, Math.round(rawProgress)));

        return NextResponse.json({
            overall: {
                score: overallScore,
                level: currentLevel,
            },
            skills: {
                listening: { ...breakdown.listening, trend: trends.listening },
                reading: { ...breakdown.reading, trend: trends.reading },
                speaking: { ...breakdown.speaking, trend: trends.speaking },
                writing: { ...breakdown.writing, trend: trends.writing },
            },
            nextMilestone: {
                level: nextLevel,
                progress,
            },
            lastUpdated,
            sessionsTracked: history.length,
        });
    } catch (error) {
        console.error('Failed to fetch proficiency:', error);
        return NextResponse.json(
            { error: 'Failed to fetch proficiency data' },
            { status: 500 }
        );
    }
}
