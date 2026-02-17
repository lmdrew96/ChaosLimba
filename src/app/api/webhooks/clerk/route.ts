import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import { deleteAllUserData } from "@/lib/db/queries"

type ClerkWebhookEvent = {
  type: string
  data: {
    id: string
    [key: string]: unknown
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("[Webhook] CLERK_WEBHOOK_SECRET not configured")
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    )
  }

  // Get Svix headers for verification
  const svixId = req.headers.get("svix-id")
  const svixTimestamp = req.headers.get("svix-timestamp")
  const svixSignature = req.headers.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing webhook verification headers" },
      { status: 400 }
    )
  }

  // Get raw body for signature verification
  const body = await req.text()

  // Verify webhook signature
  const wh = new Webhook(webhookSecret)
  let event: ClerkWebhookEvent

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err)
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    )
  }

  // Handle user.deleted event
  if (event.type === "user.deleted") {
    const userId = event.data.id

    if (!userId) {
      console.error("[Webhook] user.deleted event missing user ID")
      return NextResponse.json(
        { error: "Missing user ID in event data" },
        { status: 400 }
      )
    }

    try {
      await deleteAllUserData(userId)
      console.log(`[Webhook] Deleted all data for user ${userId}`)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error(`[Webhook] Failed to delete data for user ${userId}:`, error)
      return NextResponse.json(
        { error: "Failed to delete user data" },
        { status: 500 }
      )
    }
  }

  // Acknowledge other event types
  return NextResponse.json({ received: true })
}
