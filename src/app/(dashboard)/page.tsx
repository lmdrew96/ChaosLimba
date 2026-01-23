"use client"

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
  Shield,
} from "lucide-react"
import Link from "next/link"

const stats = [
  {
    label: "Words Collected",
    value: "47",
    icon: BookOpen,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    label: "Practice Streak",
    value: "5 days",
    icon: Zap,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  {
    label: "Error Patterns",
    value: "4",
    icon: Flower2,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    label: "Time Today",
    value: "23 min",
    icon: Clock,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
]

const quickActions = [
  {
    name: "Mystery Shelf",
    description: "2 new words to explore",
    href: "/mystery-shelf",
    icon: BookOpen,
    gradient: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-400",
  },
  {
    name: "Deep Fog Mode",
    description: "Immerse in advanced content",
    href: "/deep-fog",
    icon: Cloud,
    gradient: "from-indigo-500/20 to-purple-500/10",
    iconColor: "text-indigo-400",
  },
  {
    name: "Chaos Window",
    description: "Start a practice session",
    href: "/chaos-window",
    icon: Sparkles,
    gradient: "from-pink-500/20 to-rose-500/10",
    iconColor: "text-pink-400",
  },
  {
    name: "Error Garden",
    description: "Review your patterns",
    href: "/error-garden",
    icon: Flower2,
    gradient: "from-green-500/20 to-emerald-500/10",
    iconColor: "text-green-400",
  },
  {
    name: "SPAM-A Test",
    description: "Test Romanian spam analysis",
    href: "/spam-a-test",
    icon: Shield,
    gradient: "from-red-500/20 to-orange-500/10",
    iconColor: "text-red-400",
  },
]

const recentActivity = [
  {
    action: "Collected",
    item: "îndoielnic",
    context: "from Deep Fog reading",
    time: "10 min ago",
  },
  {
    action: "Practiced",
    item: "Genitive case",
    context: "in Chaos Window",
    time: "2 hours ago",
  },
  {
    action: "Explored",
    item: "răbdător",
    context: "etymology and usage",
    time: "Yesterday",
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 via-violet-600/10 to-background p-8 border border-purple-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-300 via-violet-300 to-purple-400 bg-clip-text text-transparent">
            Bună ziua, Chaos Learner!
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Ready to embrace some productive confusion? Your learning journey
            continues with structured chaos and exploratory discovery.
          </p>
          <div className="flex gap-3 mt-6">
            <Button
              asChild
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 rounded-xl shadow-lg shadow-purple-500/20"
            >
              <Link href="/chaos-window">
                <Sparkles className="mr-2 h-4 w-4" />
                Start Chaos Session
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-purple-500/30 hover:bg-purple-500/10"
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
        {stats.map((stat) => (
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
                  <p className="text-2xl font-bold">{stat.value}</p>
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
              <Target className="h-5 w-5 text-purple-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className={`group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${action.gradient} border border-transparent hover:border-purple-500/30 transition-all duration-200 hover:scale-[1.02]`}
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
              <TrendingUp className="h-5 w-5 text-green-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 pb-4 border-b border-border/40 last:border-0 last:pb-0"
                >
                  <div className="mt-1 h-2 w-2 rounded-full bg-purple-400" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">
                        {activity.action}
                      </span>{" "}
                      <span className="font-medium text-purple-300">
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-violet-500/5">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Today's Mantra</h3>
          <p className="text-xl italic text-muted-foreground">
            "Productive confusion is the threshold of understanding."
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
