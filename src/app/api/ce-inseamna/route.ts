import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { analyzeMysteryItem } from "@/lib/ai/tutor";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { word, context } = body;

    if (!word || typeof word !== "string" || !word.trim()) {
      return new NextResponse("Word is required", { status: 400 });
    }

    if (word.trim().length > 200) {
      return new NextResponse("Input too long (max 200 characters)", { status: 400 });
    }

    const result = await analyzeMysteryItem(word.trim(), context || null);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[CE_INSEAMNA]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
