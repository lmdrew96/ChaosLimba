import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ttsUsage } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { generateSpeech, TTSProviderError, TTSValidationError } from "@/lib/ai/elevenlabs";

const DAILY_CHAR_LIMIT = 2000;
const MAX_TEXT_LENGTH = 200;

function isUsageTrackingConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

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

    let usageTrackingEnabled = isUsageTrackingConfigured();
    let currentUsage = 0;
    let remaining = DAILY_CHAR_LIMIT;

    // If DB is missing/unavailable, keep TTS functional and skip quota tracking.
    if (usageTrackingEnabled) {
      try {
        currentUsage = await getDailyUsage(userId);
        remaining = DAILY_CHAR_LIMIT - currentUsage;
      } catch (usageError) {
        usageTrackingEnabled = false;
        console.error("[TTS_USAGE_READ_ERROR]", usageError);
      }

      if (usageTrackingEnabled && remaining <= 0) {
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

      if (usageTrackingEnabled && trimmed.length > remaining) {
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
    }

    // Validate speed
    const speechSpeed = typeof speed === "number" ? Math.max(0.5, Math.min(2.0, speed)) : 1.0;

    // Generate speech
    const audioBuffer = await generateSpeech(trimmed, { speed: speechSpeed });

    // Record usage, but don't fail TTS on usage-write errors.
    if (usageTrackingEnabled) {
      try {
        await recordUsage(userId, trimmed.length);
      } catch (usageError) {
        usageTrackingEnabled = false;
        console.error("[TTS_USAGE_WRITE_ERROR]", usageError);
      }
    }

    // Return audio with usage headers
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "X-TTS-Characters-Used": String(usageTrackingEnabled ? currentUsage + trimmed.length : 0),
        "X-TTS-Characters-Remaining": String(usageTrackingEnabled ? remaining - trimmed.length : DAILY_CHAR_LIMIT),
        "X-TTS-Daily-Limit": String(DAILY_CHAR_LIMIT),
        "X-TTS-Usage-Tracking": usageTrackingEnabled ? "enabled" : "disabled",
      },
    });
  } catch (error) {
    if (error instanceof TTSValidationError) {
      console.error("[TTS_VALIDATION_ERROR]", error.message);
      return new NextResponse(error.message, { status: 400 });
    }
    if (error instanceof TTSProviderError) {
      console.error("[TTS_PROVIDER_ERROR]", error.message);
      if (error.statusCode === 429) {
        return new NextResponse("TTS provider rate limit reached. Please try again soon.", { status: 429 });
      }
      if (error.statusCode >= 500) {
        return new NextResponse("TTS provider is temporarily unavailable. Please try again.", { status: 503 });
      }
      return new NextResponse(error.message, { status: 502 });
    }
    console.error("[TTS_ERROR]", error instanceof Error ? error.message : String(error), error);
    return new NextResponse(
      `TTS generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}

// GET endpoint to check current usage
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    if (!isUsageTrackingConfigured()) {
      return NextResponse.json({
        dailyLimit: DAILY_CHAR_LIMIT,
        used: 0,
        remaining: DAILY_CHAR_LIMIT,
        usageTracking: "disabled",
      });
    }

    const currentUsage = await getDailyUsage(userId);

    return NextResponse.json({
      dailyLimit: DAILY_CHAR_LIMIT,
      used: currentUsage,
      remaining: Math.max(0, DAILY_CHAR_LIMIT - currentUsage),
      usageTracking: "enabled",
    });
  } catch (error) {
    console.error("[TTS_USAGE_ERROR]", error);
    return NextResponse.json({
      dailyLimit: DAILY_CHAR_LIMIT,
      used: 0,
      remaining: DAILY_CHAR_LIMIT,
      usageTracking: "disabled",
    });
  }
}
