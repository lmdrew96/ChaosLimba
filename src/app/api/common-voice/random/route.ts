import { db } from "@/lib/db";
import { commonVoiceClips } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/common-voice/random?count=5&minDuration=2000&maxDuration=8000
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const count = Math.min(parseInt(searchParams.get("count") || "5"), 20);
        const minDuration = parseInt(searchParams.get("minDuration") || "2000");
        const maxDuration = parseInt(searchParams.get("maxDuration") || "10000");

        // Fetch random clips using PostgreSQL RANDOM()
        const clips = await db
            .select({
                id: commonVoiceClips.id,
                clipPath: commonVoiceClips.clipPath,
                sentence: commonVoiceClips.sentence,
                r2Url: commonVoiceClips.r2Url,
                durationMs: commonVoiceClips.durationMs,
                age: commonVoiceClips.age,
                gender: commonVoiceClips.gender,
                accent: commonVoiceClips.accent,
            })
            .from(commonVoiceClips)
            .where(
                sql`${commonVoiceClips.durationMs} >= ${minDuration} 
            AND ${commonVoiceClips.durationMs} <= ${maxDuration}`
            )
            .orderBy(sql`RANDOM()`)
            .limit(count);

        // If no clips with duration filter, fallback to any clips
        if (clips.length === 0) {
            const fallbackClips = await db
                .select({
                    id: commonVoiceClips.id,
                    clipPath: commonVoiceClips.clipPath,
                    sentence: commonVoiceClips.sentence,
                    r2Url: commonVoiceClips.r2Url,
                    durationMs: commonVoiceClips.durationMs,
                    age: commonVoiceClips.age,
                    gender: commonVoiceClips.gender,
                    accent: commonVoiceClips.accent,
                })
                .from(commonVoiceClips)
                .orderBy(sql`RANDOM()`)
                .limit(count);

            return NextResponse.json({
                clips: fallbackClips,
                totalAvailable: fallbackClips.length,
                filter: "none",
            });
        }

        return NextResponse.json({
            clips,
            totalAvailable: clips.length,
            filter: { minDuration, maxDuration },
        });
    } catch (error) {
        console.error("[COMMON_VOICE_RANDOM]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
