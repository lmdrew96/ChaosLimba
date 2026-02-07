"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Cloud,
  Sparkles,
  Flower2,
  TrendingUp,
  Clock,
  Target,
  Zap,
  CircleQuestionMark,
  GraduationCap,
  Speech,
  Brain,
  Loader2,
} from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  wordsCollected: number
  practiceStreak: number
  errorPatterns: number
  timeTodayMinutes: number
  featuresDiscovered: number
}

interface RecentActivityItem {
  action: string
  item: string
  context: string
  time: string
}

const quickActions = [
  {
    name: "Ask Tutor",
    description: "Get a linguistic explanation",
    href: "/ask-tutor",
    icon: GraduationCap,
    gradient: "from-foreground/20 to-foreground/10",
    iconColor: "text-foreground",
  },
  {
    name: "Ce înseamnă?",
    description: "Quick translations and definitions",
    href: "/ce-inseamna",
    icon: CircleQuestionMark,
    gradient: "from-primary/20 to-primary/10",
    iconColor: "text-primary",
  },
  {
    name: "Cum se pronunță?",
    description: "Listen to Romanian pronunciation",
    href: "/cum-se-pronunta",
    icon: Speech,
    gradient: "from-accent/20 to-accent/10",
    iconColor: "text-accent",
  },
  {
    name: "ADHDesigns",
    description: "Get to know creatorul ChaosLimbă",
    href: "https://adhdesigns.dev",
    icon: Brain,
    gradient: "from-destructive/20 to-destructive/10",
    iconColor: "text-destructive",
  },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/dashboard/stats", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setStats(data.stats)
          setRecentActivity(data.recentActivity)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
      } finally {
        setIsLoading(false)
      }
    }
    void fetchDashboardData()
  }, [])

  const statCards = [
    {
      label: "Words Collected",
      value: stats ? String(stats.wordsCollected) : "—",
      icon: BookOpen,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      label: "Practice Streak",
      value: stats ? `${stats.practiceStreak} day${stats.practiceStreak !== 1 ? "s" : ""}` : "—",
      icon: Zap,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Error Patterns",
      value: stats ? String(stats.errorPatterns) : "—",
      icon: Flower2,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      label: "Time Today",
      value: stats ? `${stats.timeTodayMinutes} min` : "—",
      icon: Clock,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Features Discovered",
      value: stats ? String(stats.featuresDiscovered) : "—",
      icon: Sparkles,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-background via-primary/10 to-background p-8 border border-borders">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/10 rounded-full blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-bold mb-2 bg-linear-to-r from-foreground via-primary to-primary/50 bg-clip-text text-transparent">
            Bună ziua, Chaos Learner!
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Ready to embrace some productive confusion? Your learning journey
            continues with structured chaos and exploratory discovery.
          </p>
          <div className="flex gap-3 mt-6">
            <Button
              asChild
              className="bg-linear-to-r from-primary to-primary/70 hover:from-primary hover:to-primary/80 rounded-xl shadow-lg shadow-primary/20"
            >
              <Link href="/chaos-window">
                <Sparkles className="mr-2 h-4 w-4" />
                Start Chaos Session
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-muted-foreground/30 hover:bg-muted-foreground/10"
            >
              <Link href="/deep-fog">
                <Cloud className="mr-2 h-4 w-4" />
                Enter Deep Fog
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="rounded-xl border-border/40 bg-card/50 backdrop-blur"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <p className="text-2xl font-bold">{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className={`group flex items-center gap-4 p-4 rounded-xl bg-linear-to-r ${action.gradient} border border-transparent hover:border-primary/30 transition-all duration-200 hover:scale-[1.02]`}
              >
                <div
                  className={`p-2 rounded-lg bg-background/50 ${action.iconColor}`}
                >
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{action.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                  →
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-chart-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activity yet. Start a Chaos Session to get going!
                </p>
              ) : (
                recentActivity.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 pb-4 border-b border-border/40 last:border-0 last:pb-0"
                  >
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          {activity.action}
                        </span>{" "}
                        <span className="font-medium text-primary">
                          {activity.item}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.context}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-borders bg-linear-to-r from-secondary/20 to-muted/20">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Today&apos;s Mantra</h3>
          <p className="text-xl italic text-muted-foreground">
            &ldquo;Productive confusion is the threshold of understanding.&rdquo;
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
