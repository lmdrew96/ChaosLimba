import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { learningNarratives } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const narratives = await db
            .select()
            .from(learningNarratives)
            .where(eq(learningNarratives.userId, userId))
            .orderBy(desc(learningNarratives.periodEnd));

        return NextResponse.json({ narratives });
    } catch (error) {
        console.error("[Journey API] Failed to fetch narratives:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
