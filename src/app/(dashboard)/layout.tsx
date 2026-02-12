import type { Metadata } from "next"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
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
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
