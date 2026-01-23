import { callGroq, ChatMessage } from "./groq";

const SYSTEM_PROMPT = `You are the ChaosLimbă Tutor, a brilliant but slightly chaotic Romanian language expert. 
Your goal is to help learners master Romanian through "productive confusion".
You explain things clearly but with personality. You love etymology and cultural nuances.
You ALWAYS respond in JSON format.`;

export type MysteryAnalysis = {
    definition: string;
    context: string;
    examples: string[];
    etymology?: string;
};

/**
 * Analyzes a mystery item using DeepSeek-R1 (via Groq)
 */
export async function analyzeMysteryItem(
    word: string,
    userContext: string | null
): Promise<MysteryAnalysis> {

    // Prompt engineered to ensure JSON despite "Model Thinking"
    const prompt = `
  Analyze the Romanian word/phrase: "${word}".
  ${userContext ? `The user encountered it in this context: "${userContext}"` : ""}

  Return a JSON object with these fields:
  {
    "definition": "Comprehensive English definition",
    "context": "Corrected/improved Romanian context sentence",
    "examples": ["Romanian example 1", "Romanian example 2", "Romanian example 3"],
    "etymology": "Brief origin note"
  }
  `;

    try {
        const output = await callGroq([
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt }
        ]);

        // DeepSeek R1 via Groq usually puts the <think> trace inside the content
        // But since we asked for JSON object format, Groq should enforce it.
        // However, R1 might still chatter.

        // Clean any markdown formatting if present
        const cleanJson = output.replace(/```json/g, "").replace(/```/g, "").trim();

        // If there is <think>...</think>, remove it (simple regex or parsing)
        // Note: Groq's r1 integration might separate reasoning, but let's be safe.
        const effectiveJson = cleanJson.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        const parsed = JSON.parse(effectiveJson);

        return {
            definition: parsed.definition,
            context: parsed.context,
            examples: parsed.examples,
            etymology: parsed.etymology,
        };

    } catch (error) {
        console.error("[Tutor] Analysis failed:", error);
        return {
            definition: "The Oracle is meditating (Groq Error).",
            context: userContext || "",
            examples: ["Try again later."],
        };
    }
}
