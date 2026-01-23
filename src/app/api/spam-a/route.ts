import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { compareSemanticSimilarity, ValidationError } from "@/lib/ai/spamA";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const userText = typeof body?.userText === "string" ? body.userText : "";
    const expectedText = typeof body?.expectedText === "string" ? body.expectedText : "";
    const threshold = typeof body?.threshold === "number" ? body.threshold : 0.75;

    const result = await compareSemanticSimilarity(userText, expectedText, threshold);

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("SPAM-A API error:", error);
    return NextResponse.json({ error: "Failed to analyze semantic similarity" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
