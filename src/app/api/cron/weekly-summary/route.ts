import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getWeeklySummaryUsers, getAutobiographyData } from "@/lib/db/queries";
import { sendWeeklySummary } from "@/lib/email";

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userIds = await getWeeklySummaryUsers();

    if (userIds.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 0, message: "No opted-in users" });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://chaoslimba.vercel.app";

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];
    const clerk = await clerkClient();

    // Process sequentially to respect Resend rate limits
    for (const userId of userIds) {
      try {
        // Get user email from Clerk
        const user = await clerk.users.getUser(userId);
        const email = user.emailAddresses[0]?.emailAddress;

        if (!email) {
          skipped++;
          continue;
        }

        // Get weekly stats
        const stats = await getAutobiographyData(userId, weekAgo, now);

        // Send email
        const result = await sendWeeklySummary(email, {
          firstName: user.firstName || "",
          sessionCount: stats.sessionCount,
          totalMinutes: stats.totalMinutes,
          errorCount: stats.errorCount,
          wordsCollected: stats.wordsCollected,
          proficiencyDelta: stats.proficiencyDelta,
          topErrorType: stats.topErrorType,
          resolvedPatterns: stats.resolvedPatterns,
          appUrl,
        });

        if (result.success) {
          sent++;
        } else {
          errors.push(`${userId}: ${result.error}`);
        }
      } catch (err) {
        errors.push(`${userId}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    console.log(`[Weekly Summary] Sent: ${sent}, Skipped: ${skipped}, Errors: ${errors.length}`);

    return NextResponse.json({
      sent,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      total: userIds.length,
    });
  } catch (error) {
    console.error("[Weekly Summary] Cron failed:", error);
    return NextResponse.json(
      { error: "Failed to process weekly summaries" },
      { status: 500 }
    );
  }
}
