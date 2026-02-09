/**
 * CEFR Proficiency Calculation
 *
 * Calculates user's CEFR level based on assessment scores across 4 skills.
 * Also provides recordSessionProficiency() for logging session performance.
 */

import { db } from '@/lib/db';
import { errorLogs, proficiencyHistory, sessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface ProficiencyInput {
    selfAssessment?: 'complete_beginner' | 'some_basics' | 'intermediate' | 'advanced';
    readingScore?: number;    // 0-100
    listeningScore?: number;  // 0-100
    writingScore?: number;    // 0-100
    speakingScore?: number;   // 0-100
}

/**
 * Score thresholds for each CEFR level
 * These are calibrated based on the question difficulty in our tests
 */
const LEVEL_THRESHOLDS = {
    A1: { min: 0, max: 25 },
    A2: { min: 25, max: 45 },
    B1: { min: 45, max: 65 },
    B2: { min: 65, max: 80 },
    C1: { min: 80, max: 90 },
    C2: { min: 90, max: 100 },
};

/**
 * Map self-assessment to starting score modifier
 */
const SELF_ASSESSMENT_MODIFIERS = {
    complete_beginner: 0,
    some_basics: 10,
    intermediate: 20,
    advanced: 30,
};

/**
 * Calculate overall CEFR level from individual skill scores
 */
export function calculateCEFRLevel(input: ProficiencyInput): CEFRLevel {
    // Get individual scores with defaults
    const reading = input.readingScore ?? 50;
    const listening = input.listeningScore ?? 50;
    const writing = input.writingScore ?? 50;
    const speaking = input.speakingScore ?? 50;

    // Calculate weighted average
    // All skills weighted equally (25% each)
    let weightedScore = (reading + listening + writing + speaking) / 4;

    // Apply self-assessment modifier (slight adjustment based on user's perception)
    if (input.selfAssessment) {
        const modifier = SELF_ASSESSMENT_MODIFIERS[input.selfAssessment] || 0;
        // Self-assessment contributes 20% to final score
        weightedScore = weightedScore * 0.8 + modifier * 0.2;
    }

    // Map score to CEFR level
    if (weightedScore >= LEVEL_THRESHOLDS.C2.min) return 'C2';
    if (weightedScore >= LEVEL_THRESHOLDS.C1.min) return 'C1';
    if (weightedScore >= LEVEL_THRESHOLDS.B2.min) return 'B2';
    if (weightedScore >= LEVEL_THRESHOLDS.B1.min) return 'B1';
    if (weightedScore >= LEVEL_THRESHOLDS.A2.min) return 'A2';
    return 'A1';
}

/**
 * Get a numeric proficiency score (1-10 scale for Proficiency Tracker)
 */
export function calculateProficiencyScore(input: ProficiencyInput): number {
    const reading = input.readingScore ?? 50;
    const listening = input.listeningScore ?? 50;
    const writing = input.writingScore ?? 50;
    const speaking = input.speakingScore ?? 50;

    // Average and convert to 1-10 scale
    const average = (reading + listening + writing + speaking) / 4;
    return Math.round((average / 10) * 10) / 10; // Round to 1 decimal
}

/**
 * Get detailed skill breakdown for proficiency display
 */
export interface SkillBreakdown {
    reading: { score: number; level: CEFRLevel };
    listening: { score: number; level: CEFRLevel };
    writing: { score: number; level: CEFRLevel };
    speaking: { score: number; level: CEFRLevel };
    overall: { score: number; level: CEFRLevel };
}

export function getSkillBreakdown(input: ProficiencyInput): SkillBreakdown {
    const getLevel = (score: number): CEFRLevel => {
        return calculateCEFRLevel({ readingScore: score, listeningScore: score, writingScore: score, speakingScore: score });
    };

    const reading = input.readingScore ?? 50;
    const listening = input.listeningScore ?? 50;
    const writing = input.writingScore ?? 50;
    const speaking = input.speakingScore ?? 50;
    const overall = (reading + listening + writing + speaking) / 4;

    return {
        reading: { score: reading, level: getLevel(reading) },
        listening: { score: listening, level: getLevel(listening) },
        writing: { score: writing, level: getLevel(writing) },
        speaking: { score: speaking, level: getLevel(speaking) },
        overall: { score: overall, level: calculateCEFRLevel(input) },
    };
}

/**
 * Record proficiency from a completed session.
 * Reads errors for the session, calculates skill scores, and inserts a proficiency_history record.
 * Used by session complete API route + Mystery Shelf practice route.
 */
export async function recordSessionProficiency(userId: string, sessionId: string) {
    // Verify session belongs to user
    const session = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
        .limit(1);

    if (!session || session.length === 0) {
        throw new Error(`Session ${sessionId} not found for user`);
    }

    const sessionData = session[0];

    // Fetch all errors for this session
    const sessionErrors = await db
        .select()
        .from(errorLogs)
        .where(eq(errorLogs.sessionId, sessionId));

    console.log(`[Proficiency] Processing ${sessionErrors.length} errors for session ${sessionId} (${sessionData.sessionType})`);

    // Calculate component scores: start at 10.0, deduct 0.5 per error, min 1.0
    const calculateScore = (errors: typeof sessionErrors, errorType: string): number => {
        const relevantErrors = errors.filter(e => e.errorType === errorType);
        let score = 10.0;
        score -= relevantErrors.length * 0.5;
        return Math.max(1.0, Math.min(10.0, score));
    };

    const grammarScore = calculateScore(sessionErrors, 'grammar');
    const pronunciationScore = calculateScore(sessionErrors, 'pronunciation');
    const vocabularyScore = calculateScore(sessionErrors, 'vocabulary');
    const wordOrderScore = calculateScore(sessionErrors, 'word_order');

    const writingScore = grammarScore;
    const speakingScore = pronunciationScore;
    const readingScore = (vocabularyScore + wordOrderScore) / 2;

    // Listening score based on session type
    const listeningScore = sessionData.sessionType === 'chaos_window' ? 7.0 : null;

    const overallScore = (
        (writingScore * 0.3) +
        (speakingScore * 0.3) +
        (readingScore * 0.2) +
        ((listeningScore || 0) * 0.2)
    );

    const proficiencyRecord = await db.insert(proficiencyHistory).values({
        userId,
        overallScore: overallScore.toFixed(1),
        listeningScore: listeningScore?.toFixed(1) || null,
        readingScore: readingScore.toFixed(1),
        speakingScore: speakingScore.toFixed(1),
        writingScore: writingScore.toFixed(1),
        period: 'daily',
    }).returning();

    console.log(`[Proficiency] Updated: Overall ${overallScore.toFixed(1)} for ${sessionData.sessionType}`);

    return {
        overall: overallScore.toFixed(1),
        listening: listeningScore?.toFixed(1),
        reading: readingScore.toFixed(1),
        speaking: speakingScore.toFixed(1),
        writing: writingScore.toFixed(1),
        errorsProcessed: sessionErrors.length,
    };
}
