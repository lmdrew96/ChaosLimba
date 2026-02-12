import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { errorLogs, adaptationInterventions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const DEV_PASSCODE = process.env.DEV_PASSCODE || "chaoslimba-dev"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    if (body.passcode !== DEV_PASSCODE) {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 403 })
    }

    // Delete error logs and adaptation interventions (no transaction in neon-http)
    await db.delete(adaptationInterventions).where(eq(adaptationInterventions.userId, userId))
    await db.delete(errorLogs).where(eq(errorLogs.userId, userId))

    return NextResponse.json({
      success: true,
      message: "All error data cleared. Error Garden and adaptation state reset.",
    })
  } catch (error) {
    console.error("[DEV] Failed to reset errors:", error)
    return NextResponse.json(
      {
        error: "Failed to reset errors",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
