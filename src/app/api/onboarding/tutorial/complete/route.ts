import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await db
            .insert(userPreferences)
            .values({
                userId,
                tutorialCompleted: true,
            })
            .onConflictDoUpdate({
                target: userPreferences.userId,
                set: {
                    tutorialCompleted: true,
                },
            });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Tutorial completion failed:', error);
        return NextResponse.json(
            { error: 'Failed to complete tutorial' },
            { status: 500 }
        );
    }
}
