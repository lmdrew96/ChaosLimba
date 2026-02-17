import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getAutobiographyData } from "@/lib/db/queries";
import { sendWeeklySummary } from "@/lib/email";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ error: "No email address found" }, { status: 400 });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5001";

    const stats = await getAutobiographyData(userId, weekAgo, now);

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
      return NextResponse.json({ success: true, sentTo: email });
    }

    return NextResponse.json(
      { error: "Failed to send", details: result.error },
      { status: 500 }
    );
  } catch (error) {
    console.error("[Weekly Summary Test] Failed:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}
