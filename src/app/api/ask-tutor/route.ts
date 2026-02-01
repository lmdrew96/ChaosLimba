import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { callGroq, ChatMessage } from "@/lib/ai/groq";

const TUTOR_SYSTEM_PROMPT = `You are the ChaosLimbă Tutor, a brilliant Romanian language expert with a warm, encouraging personality.
The learner is asking you a question about the Romanian language.

Rules:
- Respond in English with Romanian examples inline (use quotes for Romanian words/phrases)
- Be clear, concise, and encouraging
- Use examples liberally to illustrate grammar rules, vocabulary, and usage
- When showing Romanian text, include the English translation in parentheses
- Keep responses focused: 2-4 paragraphs max
- If the learner asks about something beyond Romanian language, gently redirect them
- You love etymology and cultural context — share it when relevant
- Format important terms with emphasis when helpful`;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { question, conversationHistory } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return new NextResponse("Question is required", { status: 400 });
    }

    if (question.trim().length > 1000) {
      return new NextResponse("Question too long (max 1000 characters)", { status: 400 });
    }

    // Build messages array with conversation history
    const messages: ChatMessage[] = [
      { role: "system", content: TUTOR_SYSTEM_PROMPT },
    ];

    // Include up to 10 recent messages for context
    if (Array.isArray(conversationHistory)) {
      const recent = conversationHistory.slice(-10);
      for (const msg of recent) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({
            role: msg.role,
            content: typeof msg.content === "string" ? msg.content : "",
          });
        }
      }
    }

    messages.push({ role: "user", content: question.trim() });

    const response = await callGroq(messages, 0.7, false);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("[ASK_TUTOR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
