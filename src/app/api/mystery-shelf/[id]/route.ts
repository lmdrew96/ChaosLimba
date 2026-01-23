import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { mysteryItems } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const { isExplored, definition, examples } = body;

        const updatedItem = await db.update(mysteryItems)
            .set({
                ...(isExplored !== undefined && { isExplored }),
                ...(definition !== undefined && { definition }),
                ...(examples !== undefined && { examples }),
            })
            .where(and(
                eq(mysteryItems.id, id),
                eq(mysteryItems.userId, userId)
            ))
            .returning();

        if (!updatedItem.length) {
            return new NextResponse("Not found", { status: 404 });
        }

        return NextResponse.json(updatedItem[0]);
    } catch (error) {
        console.error("[MYSTERY_SHELF_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    try {
        const deletedItem = await db.delete(mysteryItems)
            .where(and(
                eq(mysteryItems.id, id),
                eq(mysteryItems.userId, userId)
            ))
            .returning();

        if (!deletedItem.length) {
            return new NextResponse("Not found", { status: 404 });
        }

        return NextResponse.json(deletedItem[0]);
    } catch (error) {
        console.error("[MYSTERY_SHELF_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
