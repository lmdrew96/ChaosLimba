import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { mysteryItems, userPreferences } from "@/lib/db/schema";
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

        // 2. Get user's CEFR level for appropriate examples
        const prefs = await db.select()
            .from(userPreferences)
            .where(eq(userPreferences.userId, userId));
        const userLevel = prefs[0]?.languageLevel || 'B1';

        // 3. Call AI Conductor with user level
        const analysis = await AIConductor.process("analyze_mystery_item", {
            word: item.word,
            context: item.context,
            userLevel
        });

        // 4. Update DB with all new fields
        const updated = await db.update(mysteryItems)
            .set({
                definition: analysis.definition,
                examples: analysis.examples,
                grammarInfo: analysis.grammarInfo,
                relatedWords: analysis.relatedWords,
                practicePrompt: analysis.practicePrompt,
                pronunciation: analysis.pronunciation,
                etymology: analysis.etymology,
                // Only update context if it was empty
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
