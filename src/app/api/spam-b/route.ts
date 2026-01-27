import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { analyzeRelevance, ValidationError, ContentContext } from "@/lib/ai/spamB";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const userText = typeof body?.userText === "string" ? body.userText : "";
    const contentContext: ContentContext = body?.contentContext || {};

    // Validate content context
    if (!contentContext.main_topics || !Array.isArray(contentContext.main_topics) || contentContext.main_topics.length === 0) {
      return NextResponse.json(
        { error: "contentContext must include main_topics array" },
        { status: 400 }
      );
    }

    const result = await analyzeRelevance(userText, contentContext);

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("SPAM-B API error:", error);
    return NextResponse.json({ error: "Failed to analyze relevance" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
