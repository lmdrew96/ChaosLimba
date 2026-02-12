import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { errorLogs, sessions, mysteryItems, userPreferences, proficiencyHistory } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete all user data (no transaction support in neon-http driver)
    await db.delete(errorLogs).where(eq(errorLogs.userId, userId))
    await db.delete(sessions).where(eq(sessions.userId, userId))
    await db.delete(mysteryItems).where(eq(mysteryItems.userId, userId))
    await db.delete(proficiencyHistory).where(eq(proficiencyHistory.userId, userId))
    await db.delete(userPreferences).where(eq(userPreferences.userId, userId))

    // Create fresh preferences with defaults
    await db.insert(userPreferences).values({
      userId,
      languageLevel: "A1",
      onboardingCompleted: false,
      defaultChaosWindowDuration: 300,
      emailNotifications: false,
      analyticsEnabled: false,
      dataCollectionEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: "All progress reset. Ready for fresh start!",
      redirectTo: "/onboarding",
    })
  } catch (error) {
    console.error("[DEV] Failed to reset progress:", error)
    return NextResponse.json(
      {
        error: "Failed to reset progress",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
