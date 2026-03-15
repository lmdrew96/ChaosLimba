import { NextRequest, NextResponse } from "next/server";
import { callGroq, type ChatMessage } from "@/lib/ai/groq";
import type { CEFRLevel } from "@/lib/proficiency";

interface OnboardingChatMessage {
    id: string;
    role: "tutor" | "user";
    content: string;
}

interface OnboardingTutorRequest {
    conversationHistory: OnboardingChatMessage[];
    selfAssessment: string;
}

// Self-assessment to initial level guess mapping
const SELF_ASSESSMENT_LEVELS: Record<string, CEFRLevel> = {
    complete_beginner: "A1",
    some_basics: "A2",
    intermediate: "B1",
    advanced: "B2",
};

const SYSTEM_PROMPT = `You are the ChaosLimbă Tutor conducting a friendly initial assessment conversation.

YOUR GOAL: Determine the user's Romanian proficiency level (A1, A2, B1, B2, C1, or C2) through natural chat.

GUIDELINES:
- Be warm, encouraging, and conversational - NOT like a formal test
- ALL your conversational responses must be in English. You may include Romanian words/phrases as examples, but your feedback and questions should be in English.
- Adapt your language to their comfort level:
  - For beginners: Mostly English, sprinkle in basic Romanian (bună, mulțumesc, da/nu)
  - For intermediate: Mix of Romanian and English, increase Romanian gradually
  - For advanced: Primarily Romanian, complex topics
- Ask about their learning journey, motivations, experiences with Romanian
- Naturally probe their abilities through conversation, not direct testing
- Watch for: vocabulary range, grammar accuracy, comprehension, confidence

ASSESSMENT CRITERIA:
- A1: Cannot produce Romanian beyond memorized words/phrases (bună, mulțumesc, da/nu). Responds entirely or almost entirely in English. If the user never attempts Romanian or only knows isolated words, they are A1 — no exceptions.
- A2: Can construct basic ORIGINAL sentences in Romanian (not just repeat memorized phrases). Attempts Romanian even if full of errors. Must have produced at least one original Romanian sentence to qualify.
- B1: Can discuss familiar topics with some complexity. Noticeable but manageable errors.
- B2: Discusses abstract topics, expresses opinions. Good grammar with occasional errors.
- C1: Near-native fluency, complex grammar, nuanced vocabulary.
- C2: Essentially native-level in all areas.

CRITICAL RULE: If the user has NOT produced at least one original Romanian sentence during the conversation, the maximum level is A1 regardless of other signals (knowledge about Romania, understanding Romanian, etc.). Receptive knowledge alone does not qualify for A2+.

After 4-6 exchanges, you should have enough data to assess confidently.

RESPOND IN THIS EXACT JSON FORMAT:
{
  "response": "Your conversational reply to the user",
  "inferredLevel": "A1|A2|B1|B2|C1|C2",
  "confidence": 0.0-1.0,
  "reasoning": "Brief internal reasoning about assessment",
  "assessmentComplete": boolean
}

Set assessmentComplete to true when you have enough data (usually after 4-6 exchanges).`;

export async function POST(req: NextRequest) {
    try {
        const { conversationHistory, selfAssessment }: OnboardingTutorRequest = await req.json();

        if (!conversationHistory || !Array.isArray(conversationHistory)) {
            return NextResponse.json(
                { error: "conversationHistory is required" },
                { status: 400 }
            );
        }

        // Format conversation for Groq - explicitly typed as ChatMessage[]
        const formattedMessages: ChatMessage[] = [
            { role: "system", content: SYSTEM_PROMPT },
            // Add context about self-assessment
            {
                role: "user",
                content: `[CONTEXT: User self-assessed as "${selfAssessment}". Use this as a STARTING HYPOTHESIS, not a floor — adjust downward or upward based solely on their demonstrated Romanian ability. Exchange ${Math.floor(conversationHistory.length / 2) + 1} of the conversation.]`,
            },
        ];

        // Add conversation history
        for (const msg of conversationHistory) {
            formattedMessages.push({
                role: msg.role === "tutor" ? "assistant" : "user",
                content: msg.content,
            });
        }

        // Call Groq
        const output = await callGroq(formattedMessages);

        // Parse JSON response
        const cleanJson = output
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .replace(/<think>[\s\S]*?<\/think>/g, "")
            .trim();

        let parsed;
        try {
            parsed = JSON.parse(cleanJson);
        } catch (parseError) {
            // If JSON parsing fails, try to extract the response
            console.error("[Onboarding Tutor] JSON parse failed, raw output:", output);

            // Create a fallback response
            return NextResponse.json({
                response: "I'm having a bit of trouble - let me try again! Tell me more about your Romanian learning journey.",
                inferredLevel: SELF_ASSESSMENT_LEVELS[selfAssessment] || "A1",
                confidence: 0.3,
                reasoning: "JSON parse failed, using fallback",
                assessmentComplete: false,
            });
        }

        let inferredLevel: CEFRLevel = parsed.inferredLevel || SELF_ASSESSMENT_LEVELS[selfAssessment] || "A1";

        // Hard-floor: if user self-assessed as complete beginner and produced no Romanian, cap at A1
        if (selfAssessment === "complete_beginner" && inferredLevel !== "A1") {
            const userMessages = conversationHistory
                .filter((msg) => msg.role === "user")
                .map((msg) => msg.content);

            const romanianIndicators = /[ăâîșț]|(?:^|\s)(?:sunt|este|eu|tu|el|ea|noi|voi|ei|ele|cum|unde|care|acest|această|pot|vreau|trebuie|am|avem|aveți|nu\s+\w{3,}|mă\s+numesc|îmi\s+place|aș\s+vrea|nu\s+știu|da,?\s+\w{3,})(?:\s|$|[.,!?])/im;

            const hasRomanianProduction = userMessages.some((msg) =>
                romanianIndicators.test(msg)
            );

            if (!hasRomanianProduction) {
                console.log(
                    `[Onboarding Tutor] Hard-floor override: ${inferredLevel} → A1 (complete_beginner with no Romanian production)`
                );
                inferredLevel = "A1";
            }
        }

        // Validate and return
        return NextResponse.json({
            response: parsed.response || "Could you tell me more?",
            inferredLevel,
            confidence: parsed.confidence || 0.5,
            reasoning: parsed.reasoning || "",
            assessmentComplete: parsed.assessmentComplete || false,
        });

    } catch (error) {
        console.error("[Onboarding Tutor] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate tutor response" },
            { status: 500 }
        );
    }
}
