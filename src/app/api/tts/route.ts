import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ttsUsage } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { generateSpeech, TTSValidationError } from "@/lib/ai/elevenlabs";

const DAILY_CHAR_LIMIT = 2000;
const MAX_TEXT_LENGTH = 200;

function getStartOfDay(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

async function getDailyUsage(userId: string): Promise<number> {
  const startOfDay = getStartOfDay();

  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${ttsUsage.charactersUsed}), 0)`,
    })
    .from(ttsUsage)
    .where(
      and(
        eq(ttsUsage.userId, userId),
        gte(ttsUsage.date, startOfDay)
      )
    );

  return Number(result[0]?.total ?? 0);
}

async function recordUsage(userId: string, characters: number): Promise<void> {
  await db.insert(ttsUsage).values({
    userId,
    charactersUsed: characters,
    date: getStartOfDay(),
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { text, speed } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return new NextResponse("Text is required", { status: 400 });
    }

    const trimmed = text.trim();
    if (trimmed.length > MAX_TEXT_LENGTH) {
      return new NextResponse(`Text too long (max ${MAX_TEXT_LENGTH} characters)`, {
        status: 400,
      });
    }

    // Check daily usage
    const currentUsage = await getDailyUsage(userId);
    const remaining = DAILY_CHAR_LIMIT - currentUsage;

    if (remaining <= 0) {
      return NextResponse.json(
        {
          error: "Daily limit reached",
          dailyLimit: DAILY_CHAR_LIMIT,
          used: currentUsage,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    if (trimmed.length > remaining) {
      return NextResponse.json(
        {
          error: "Would exceed daily limit",
          dailyLimit: DAILY_CHAR_LIMIT,
          used: currentUsage,
          remaining,
        },
        { status: 429 }
      );
    }

    // Validate speed
    const speechSpeed = typeof speed === "number" ? Math.max(0.5, Math.min(2.0, speed)) : 1.0;

    // Generate speech
    const audioBuffer = await generateSpeech(trimmed, { speed: speechSpeed });

    // Record usage
    await recordUsage(userId, trimmed.length);

    // Return audio with usage headers
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "X-TTS-Characters-Used": String(currentUsage + trimmed.length),
        "X-TTS-Characters-Remaining": String(remaining - trimmed.length),
        "X-TTS-Daily-Limit": String(DAILY_CHAR_LIMIT),
      },
    });
  } catch (error) {
    if (error instanceof TTSValidationError) {
      return new NextResponse(error.message, { status: 400 });
    }
    console.error("[TTS]", error);
    return new NextResponse("TTS generation failed", { status: 500 });
  }
}

// GET endpoint to check current usage
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const currentUsage = await getDailyUsage(userId);

    return NextResponse.json({
      dailyLimit: DAILY_CHAR_LIMIT,
      used: currentUsage,
      remaining: Math.max(0, DAILY_CHAR_LIMIT - currentUsage),
    });
  } catch (error) {
    console.error("[TTS_USAGE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
