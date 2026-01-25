/**
 * CEFR Proficiency Calculation
 * 
 * Calculates user's CEFR level based on assessment scores across 4 skills.
 */

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
