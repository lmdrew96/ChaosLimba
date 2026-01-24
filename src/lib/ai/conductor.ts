import { analyzeMysteryItem, MysteryAnalysis } from "./tutor";
import { compareSemanticSimilarity, SpamAResult } from "./spamA";
import { checkIntonationShift } from "./spamD";
import { analyzePronunciation, PronunciationResult } from "./pronunciation";
import { IntonationWarning } from "../../types/intonation";
import { FeedbackAggregator, AggregatorInput, AggregatedReport } from "./aggregator";

/**
 * The AI Conductor - Orchestrates Component Activation
 *
 * Routes requests to appropriate AI components based on input type and intent.
 * Handles dual-path orchestration for speech vs text input.
 */

export type AIIntent =
    | "analyze_mystery_item"
    | "semantic_similarity"
    | "intonation_analysis"
    | "pronunciation_analysis"
    | "feedback_aggregator"
    | "chaos_tutor_chat"; // Future

type AIPayload = {
    [key: string]: any;
};

export class AIConductor {
    static async process(intent: AIIntent, payload: AIPayload): Promise<any> {
        console.log(`[AIConductor] Processing intent: ${intent}`);

        switch (intent) {
            case "analyze_mystery_item":
                return this.handleMysteryAnalysis(payload);

            case "semantic_similarity":
                return this.handleSemanticSimilarity(payload);

            case "intonation_analysis":
                return this.handleIntonationAnalysis(payload);

            case "pronunciation_analysis":
                return this.handlePronunciationAnalysis(payload);

            case "feedback_aggregator":
                return this.handleFeedbackAggregation(payload);

            default:
                throw new Error(`Unknown AI intent: ${intent}`);
        }
    }

    private static async handleMysteryAnalysis(payload: AIPayload): Promise<MysteryAnalysis> {
        const { word, context } = payload;
        if (!word) throw new Error("Word is required for mystery analysis");

        return analyzeMysteryItem(word, context || null);
    }

    private static async handleSemanticSimilarity(payload: AIPayload): Promise<SpamAResult> {
        const { userText, expectedText } = payload;
        return compareSemanticSimilarity(userText, expectedText);
    }

    private static async handleIntonationAnalysis(payload: AIPayload): Promise<{ warnings: IntonationWarning[] }> {
        const { transcript, stressPatterns } = payload;
        if (!transcript || !stressPatterns) {
            throw new Error("Transcript and stressPatterns are required for intonation analysis");
        }

        return checkIntonationShift(transcript, stressPatterns);
    }

    private static async handlePronunciationAnalysis(payload: AIPayload): Promise<PronunciationResult> {
        const { audioData, expectedText, threshold } = payload;
        if (!audioData) {
            throw new Error("Audio data is required for pronunciation analysis");
        }

        return analyzePronunciation(audioData, expectedText, threshold);
    }

    private static async handleFeedbackAggregation(payload: AIPayload): Promise<AggregatedReport> {
        const { inputType, grammarResult, pronunciationResult, semanticResult, intonationResult, userId, sessionId } = payload;
        
        if (!inputType) {
            throw new Error("inputType is required for feedback aggregation");
        }

        const aggregatorInput: AggregatorInput = {
            inputType,
            grammarResult,
            pronunciationResult,
            semanticResult,
            intonationResult,
            userId,
            sessionId
        };

        return FeedbackAggregator.aggregateFeedback(aggregatorInput);
    }
}
