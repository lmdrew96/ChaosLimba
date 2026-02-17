import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import {
  userPreferences,
  sessions,
  errorLogs,
  mysteryItems,
  proficiencyHistory,
  ttsUsage,
  learningNarratives,
  generatedContent,
  userFeatureExposure,
  adaptationInterventions,
} from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Query all user-linked tables in parallel
    const [
      preferences,
      userSessions,
      errors,
      mystery,
      proficiency,
      tts,
      narratives,
      generated,
      featureExposure,
      interventions,
    ] = await Promise.all([
      db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1),
      db.select().from(sessions).where(eq(sessions.userId, userId)).orderBy(desc(sessions.startedAt)),
      db.select().from(errorLogs).where(eq(errorLogs.userId, userId)).orderBy(desc(errorLogs.createdAt)),
      db.select().from(mysteryItems).where(eq(mysteryItems.userId, userId)).orderBy(desc(mysteryItems.createdAt)),
      db.select().from(proficiencyHistory).where(eq(proficiencyHistory.userId, userId)).orderBy(desc(proficiencyHistory.recordedAt)),
      db.select().from(ttsUsage).where(eq(ttsUsage.userId, userId)).orderBy(desc(ttsUsage.createdAt)),
      db.select().from(learningNarratives).where(eq(learningNarratives.userId, userId)).orderBy(desc(learningNarratives.createdAt)),
      db.select().from(generatedContent).where(eq(generatedContent.userId, userId)).orderBy(desc(generatedContent.createdAt)),
      db.select().from(userFeatureExposure).where(eq(userFeatureExposure.userId, userId)).orderBy(desc(userFeatureExposure.createdAt)),
      db.select().from(adaptationInterventions).where(eq(adaptationInterventions.userId, userId)).orderBy(desc(adaptationInterventions.createdAt)),
    ])

    const exportData = {
      exportMetadata: {
        exportDate: new Date().toISOString(),
        userId,
        version: "1.0",
        platform: "ChaosLimbă",
      },
      preferences: preferences[0] || null,
      sessions: userSessions,
      errorLogs: errors,
      mysteryShelfItems: mystery,
      proficiencyHistory: proficiency,
      ttsUsage: tts,
      learningNarratives: narratives,
      generatedContent: generated,
      featureExposure: featureExposure,
      adaptationInterventions: interventions,
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error("[Data Export] Failed:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}
