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

    console.log("[DEV] Resetting progress for user:", userId)

    // Delete all user data (no transaction support in neon-http driver)
    // Delete all error logs
    console.log("[DEV] Deleting error logs...")
    await db.delete(errorLogs).where(eq(errorLogs.userId, userId))

    // Delete all sessions
    console.log("[DEV] Deleting sessions...")
    await db.delete(sessions).where(eq(sessions.userId, userId))

    // Delete all mystery items
    console.log("[DEV] Deleting mystery items...")
    await db.delete(mysteryItems).where(eq(mysteryItems.userId, userId))

    // Delete proficiency history
    console.log("[DEV] Deleting proficiency history...")
    await db.delete(proficiencyHistory).where(eq(proficiencyHistory.userId, userId))

    // Delete existing preferences
    console.log("[DEV] Deleting user preferences...")
    await db.delete(userPreferences).where(eq(userPreferences.userId, userId))

    // Create fresh preferences with defaults
    console.log("[DEV] Creating fresh user preferences...")
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

    console.log("[DEV] Reset complete!")

    return NextResponse.json({
      success: true,
      message: "All progress reset. Ready for fresh start!",
      redirectTo: "/onboarding",
    })
  } catch (error) {
    console.error("[DEV] Failed to reset progress:", error)
    // Log the full error details
    if (error instanceof Error) {
      console.error("[DEV] Error message:", error.message)
      console.error("[DEV] Error stack:", error.stack)
    }
    return NextResponse.json(
      {
        error: "Failed to reset progress",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
