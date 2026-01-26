import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
    type CEFRLevel,
    calculateProficiencyScore,
    getSkillBreakdown
} from '@/lib/proficiency';

// CEFR level ordering for progress calculation
const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/**
 * GET /api/proficiency
 * Returns current proficiency with skill breakdown
 */
export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user preferences (contains languageLevel from onboarding)
        const prefs = await db.select()
            .from(userPreferences)
            .where(eq(userPreferences.userId, userId))
            .limit(1);

        const userPref = prefs[0];

        // Default scores if no onboarding data exists
        // In the future, these would come from accumulated session data
        const defaultScores = {
            readingScore: 50,
            listeningScore: 50,
            writingScore: 50,
            speakingScore: 50,
        };

        // Get skill breakdown using proficiency library
        const breakdown = getSkillBreakdown(defaultScores);
        const overallScore = calculateProficiencyScore(defaultScores);

        // Use calculated level from skill scores (not stored DB value which may be stale)
        const currentLevel = breakdown.overall.level;
        const currentLevelIndex = CEFR_ORDER.indexOf(currentLevel);
        const nextLevel = CEFR_ORDER[currentLevelIndex + 1] || 'C2';

        // Progress within current level (0-100%)
        // Based on score within the level's threshold range
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
                listening: breakdown.listening,
                reading: breakdown.reading,
                speaking: breakdown.speaking,
                writing: breakdown.writing,
            },
            nextMilestone: {
                level: nextLevel,
                progress,
            },
        });
    } catch (error) {
        console.error('Failed to fetch proficiency:', error);
        return NextResponse.json(
            { error: 'Failed to fetch proficiency data' },
            { status: 500 }
        );
    }
}
