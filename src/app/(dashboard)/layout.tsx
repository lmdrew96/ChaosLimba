import type { Metadata } from "next"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { UmamiAnalytics } from "@/components/umami-analytics"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { userPreferences } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your ChaosLimba learning dashboard - track progress and explore features",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user has completed onboarding
  const { userId } = await auth()
  let analyticsEnabled = false

  if (userId) {
    const prefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1)

    // If no preferences exist or onboarding not completed, redirect
    if (prefs.length === 0 || !prefs[0].onboardingCompleted) {
      redirect("/onboarding")
    }

    analyticsEnabled = prefs[0]?.analyticsEnabled ?? false
  }

  return (
    <div className="min-h-screen bg-background">
      <UmamiAnalytics enabled={analyticsEnabled} />
      <Sidebar />
      <div className="md:pl-64">
        <TopBar />
        <main id="main-content" className="p-6">{children}</main>
      </div>
    </div>
  )
}
