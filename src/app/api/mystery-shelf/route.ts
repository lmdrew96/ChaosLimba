import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { mysteryItems } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const items = await db.select()
            .from(mysteryItems)
            .where(eq(mysteryItems.userId, userId))
            .orderBy(desc(mysteryItems.createdAt));

        return NextResponse.json(items);
    } catch (error) {
        console.error("[MYSTERY_SHELF_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { word, context, definition, source } = body;

        if (!word) {
            return new NextResponse("Word is required", { status: 400 });
        }

        const newItem = await db.insert(mysteryItems).values({
            userId,
            word,
            context,
            definition,
            source: source || 'manual',
        }).returning();

        return NextResponse.json(newItem[0]);
    } catch (error) {
        console.error("[MYSTERY_SHELF_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
