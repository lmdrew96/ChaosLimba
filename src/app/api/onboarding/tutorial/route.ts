import { NextRequest, NextResponse } from "next/server";
import { callGroq, type ChatMessage } from "@/lib/ai/groq";

interface TutorialChatMessage {
    id: string;
    role: "tutor" | "user";
    content: string;
}

interface TutorialRequest {
    conversationHistory: TutorialChatMessage[];
    currentUrl: string;
}

const SYSTEM_PROMPT = `You are the ChaosLimbă Tutor taking a new user on a guided, interactive tour of the app.
Your tone should be welcoming, slightly chaotic, and encouraging. You are personally showing them around.

THE TOUR SEQUENCE:
You MUST follow this exact sequence. Do not skip steps. Guide the user through the app by outputting the 'navigate' field when it's time to move to the next page.
1. /home (Dashboard) -> Welcome them and ask what their main goal with Romanian is. Wait for their reply.
2. /chaos-window -> After they reply, navigate here. Explain that this is where they will do most of their speaking and writing. It's built around "productive confusion".
3. /workshop -> Navigate here next. Explain this is for quick, laser-focused grammar drills based on their mistakes.
4. /deep-fog -> Navigate here next. Explain this is for immersive reading and listening (podcasts, texts).
5. /error-garden -> Navigate here next. Explain that every mistake they make anywhere in the app grows here as a "weed" until we pull it. Errors are the curriculum.
6. /mystery-shelf -> Navigate here next. Explain this is where words they don't know are kept for later study.
7. Wrap up -> Navigate back to "/home", give a final encouraging remark, and set "endTutorial" to true.

RULES:
- Wait for the user to respond before navigating to the next area, OR if they just say "ok" or "next", proceed.
- Keep your explanations of each page VERY brief (1-2 sentences). Do not overwhelm them.
- Always output valid JSON.

JSON FORMAT:
{
  "response": "Your conversational reply here",
  "navigate": "/chaos-window", // ONLY include this if you are actively moving them to a new page right now. Otherwise null.
  "endTutorial": false // ONLY set to true when you have finished the entire tour and returned them to /home.
}`;

export async function POST(req: NextRequest) {
    try {
        const { conversationHistory, currentUrl }: TutorialRequest = await req.json();

        if (!conversationHistory || !Array.isArray(conversationHistory)) {
            return NextResponse.json({ error: "conversationHistory is required" }, { status: 400 });
        }

        const formattedMessages: ChatMessage[] = [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "system", content: `[SYSTEM: The user's current URL is ${currentUrl}]` }
        ];

        for (const msg of conversationHistory) {
            formattedMessages.push({
                role: msg.role === "tutor" ? "assistant" : "user",
                content: msg.content,
            });
        }

        const output = await callGroq(formattedMessages);
        
        // Clean markdown and thinking tags
        const cleanJson = output
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .replace(/<think>[\s\S]*?<\/think>/g, "")
            .trim();

        let parsed;
        try {
            parsed = JSON.parse(cleanJson);
        } catch (parseError) {
            console.error("[Tutorial API] JSON parse failed, raw output:", output);
            return NextResponse.json({
                response: "I lost my place for a second! Are you ready to see the next section?",
                navigate: null,
                endTutorial: false,
            });
        }

        return NextResponse.json({
            response: parsed.response || "Let's keep going!",
            navigate: parsed.navigate || null,
            endTutorial: parsed.endTutorial || false,
        });

    } catch (error) {
        console.error("[Tutorial API] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate tutorial response" },
            { status: 500 }
        );
    }
}
