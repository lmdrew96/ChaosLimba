/**
 * Groq API Client
 * Uses the OpenAI-compatible API format provided by Groq
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Switching to Llama 3.3 70B (DeepSeek R1 Distill was decommissioned)
export const GROQ_MODEL = "llama-3.3-70b-versatile";

export type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

export async function callGroq(
    messages: ChatMessage[],
    temperature: number = 0.6
): Promise<string> {
    if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not set");
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages,
                temperature,
                max_tokens: 2048, // Generous limit for R1 reasoning traces
                response_format: { type: "json_object" } // Force JSON
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Groq API Error: ${response.status} ${err}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;

    } catch (error) {
        console.error("[Groq] Call failed:", error);
        throw error;
    }
}
