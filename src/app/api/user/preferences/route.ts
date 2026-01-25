import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Default preferences for new users
const DEFAULT_PREFERENCES = {
    languageLevel: 'A1' as const,
    defaultChaosWindowDuration: 300, // 5 minutes
    emailNotifications: false,
    analyticsEnabled: false,
    dataCollectionEnabled: false,
};

// GET /api/user/preferences - Get user preferences (create with defaults if not exists)
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Try to fetch existing preferences
        const existing = await db
            .select()
            .from(userPreferences)
            .where(eq(userPreferences.userId, userId))
            .limit(1);

        // If preferences exist, return them
        if (existing.length > 0) {
            return NextResponse.json({ preferences: existing[0] });
        }

        // Otherwise, create with defaults
        const newPreferences = await db
            .insert(userPreferences)
            .values({
                userId,
                ...DEFAULT_PREFERENCES,
            })
            .returning();

        return NextResponse.json({ preferences: newPreferences[0] });
    } catch (error) {
        console.error('Failed to fetch user preferences:', error);
        return NextResponse.json(
            { error: 'Failed to fetch preferences' },
            { status: 500 }
        );
    }
}

// PATCH /api/user/preferences - Update user preferences
export async function PATCH(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // Validate input
        const allowedFields = [
            'languageLevel',
            'defaultChaosWindowDuration',
            'emailNotifications',
            'analyticsEnabled',
            'dataCollectionEnabled',
        ];

        const updates: Partial<typeof userPreferences.$inferInsert> = {};

        for (const field of allowedFields) {
            if (field in body) {
                updates[field as keyof typeof updates] = body[field];
            }
        }

        // Validate language level if provided
        if (updates.languageLevel) {
            const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
            if (!validLevels.includes(updates.languageLevel)) {
                return NextResponse.json(
                    { error: 'Invalid language level' },
                    { status: 400 }
                );
            }
        }

        // Validate chaos window duration if provided
        if (updates.defaultChaosWindowDuration !== undefined) {
            const duration = updates.defaultChaosWindowDuration;
            if (typeof duration !== 'number' || duration < 300 || duration > 600) {
                return NextResponse.json(
                    { error: 'Duration must be between 300 and 600 seconds (5-10 minutes)' },
                    { status: 400 }
                );
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        // Update timestamp
        updates.updatedAt = new Date();

        // Update preferences
        const updated = await db
            .update(userPreferences)
            .set(updates)
            .where(eq(userPreferences.userId, userId))
            .returning();

        if (updated.length === 0) {
            // Preferences don't exist yet, create them
            const newPreferences = await db
                .insert(userPreferences)
                .values({
                    userId,
                    ...DEFAULT_PREFERENCES,
                    ...updates,
                })
                .returning();

            return NextResponse.json({ preferences: newPreferences[0] });
        }

        return NextResponse.json({ preferences: updated[0] });
    } catch (error) {
        console.error('Failed to update user preferences:', error);
        return NextResponse.json(
            { error: 'Failed to update preferences' },
            { status: 500 }
        );
    }
}
