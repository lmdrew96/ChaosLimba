import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { learningNarratives } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { narrativeId, reflection } = await req.json();

        if (!narrativeId || typeof reflection !== "string") {
            return new NextResponse("narrativeId and reflection are required", { status: 400 });
        }

        await db
            .update(learningNarratives)
            .set({ reflection: reflection.trim() || null })
            .where(and(
                eq(learningNarratives.id, narrativeId),
                eq(learningNarratives.userId, userId)
            ));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Journey Reflect API]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
