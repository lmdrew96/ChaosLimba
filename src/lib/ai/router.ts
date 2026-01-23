import { analyzeMysteryItem, MysteryAnalysis } from "./tutor";
import { compareSemanticSimilarity, SpamAResult } from "./spamA";

/**
 * The Central Brain of ChaosLimbă
 * Routes requests to the appropriate specialized AI module
 */

export type AIIntent =
    | "analyze_mystery_item"
    | "semantic_similarity"
    | "chaos_tutor_chat"; // Future

type AIPayload = {
    [key: string]: any;
};

export class AIRouter {
    static async process(intent: AIIntent, payload: AIPayload): Promise<any> {
        console.log(`[AIRouter] Processing intent: ${intent}`);

        switch (intent) {
            case "analyze_mystery_item":
                return this.handleMysteryAnalysis(payload);

            case "semantic_similarity":
                return this.handleSemanticSimilarity(payload);

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
}
