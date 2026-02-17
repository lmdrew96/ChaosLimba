import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { userPreferences } from "@/lib/db/schema"
import { deleteAllUserData } from "@/lib/db/queries"

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete all user data from all 9 user-linked tables
    await deleteAllUserData(userId)

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
