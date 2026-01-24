import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { analyzePronunciation, ValidationError } from "@/lib/ai/pronunciation";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const expectedText = formData.get('expectedText') as string | null;
    const thresholdStr = formData.get('threshold') as string | null;
    const threshold = thresholdStr ? parseFloat(thresholdStr) : 0.70;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert File to Blob (File extends Blob, so this works directly)
    const result = await analyzePronunciation(
      audioFile,
      expectedText ?? undefined,
      threshold
    );

    return NextResponse.json({ result });

  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Pronunciation analysis API error:", error);
    return NextResponse.json(
      { error: "Failed to analyze pronunciation" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
