import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { mysteryItems } from "@/lib/db/schema";
import { AIConductor } from "@/lib/ai/conductor";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { itemId } = await req.json();

        if (!itemId) {
            return new NextResponse("Item ID is required", { status: 400 });
        }

        // 1. Fetch the item
        const items = await db.select()
            .from(mysteryItems)
            .where(and(
                eq(mysteryItems.id, itemId),
                eq(mysteryItems.userId, userId)
            ));

        if (!items.length) {
            return new NextResponse("Item not found", { status: 404 });
        }

        const item = items[0];

        // 2. Call AI Conductor
        const analysis = await AIConductor.process("analyze_mystery_item", {
            word: item.word,
            context: item.context
        });

        // 3. Update DB
        const updated = await db.update(mysteryItems)
            .set({
                definition: analysis.definition,
                examples: analysis.examples,
                // If the AI found a better context or we didn't have one, update it.
                // But respect user's original context if it exists and is good? 
                // For now, let's append the AI context if user's context is significantly different 
                // or just overwrite if it was empty.
                // Actually, let's keep user context as primary source of truth for *where* they found it,
                // but maybe add a "notes" field later.
                // For now: Only update context if it was empty.
                ...(item.context ? {} : { context: analysis.context }),
            })
            .where(eq(mysteryItems.id, itemId))
            .returning();

        return NextResponse.json(updated[0]);

    } catch (error) {
        console.error("[AI Analysis API]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
