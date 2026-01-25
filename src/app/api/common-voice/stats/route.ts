import { db } from "@/lib/db";
import { commonVoiceClips } from "@/lib/db/schema";
import { count } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/common-voice/stats - Get stats about available clips
export async function GET() {
    try {
        const [totalResult] = await db
            .select({ count: count() })
            .from(commonVoiceClips);

        return NextResponse.json({
            totalClips: totalResult.count,
            status: totalResult.count > 0 ? "ready" : "empty",
            message: totalResult.count > 0
                ? `${totalResult.count} clips available for listening exercises`
                : "No clips uploaded yet. Run: npx tsx scripts/upload-common-voice.ts --batch=1"
        });
    } catch (error) {
        console.error("[COMMON_VOICE_STATS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
