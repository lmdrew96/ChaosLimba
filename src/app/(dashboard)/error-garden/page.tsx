"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Flower2, AlertTriangle, TrendingUp, Lightbulb, Sparkles } from "lucide-react"

const errorPatterns = [
  {
    type: "Genitive Case",
    category: "Grammar",
    frequency: 0.7,
    color: "from-red-500 to-orange-500",
    description: "Errors in genitive case formation and usage",
    examples: ["al casei → casei", "a lui → al lui"],
    improvement: "+5% this week",
  },
  {
    type: "Pronunciation: î/â",
    category: "Phonology",
    frequency: 0.6,
    color: "from-amber-500 to-yellow-500",
    description: "Confusion between î and â sounds",
    examples: ["în vs. ân", "România vs. romîn"],
    improvement: "+12% this week",
  },
  {
    type: "Verb Conjugation",
    category: "Morphology",
    frequency: 0.5,
    color: "from-blue-500 to-cyan-500",
    description: "Errors in verb endings across tenses",
    examples: ["eu merg → eu mergă", "ei merg → ei merge"],
    improvement: "+8% this week",
  },
  {
    type: "Word Order",
    category: "Syntax",
    frequency: 0.4,
    color: "from-purple-500 to-violet-500",
    description: "Non-native word ordering patterns",
    examples: ["Nu eu știu → Eu nu știu"],
    improvement: "+15% this week",
  },
]

export default function ErrorGardenPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flower2 className="h-7 w-7 text-green-400" />
          Error Garden
        </h1>
        <p className="text-muted-foreground">
          Your mistakes transformed into a personalized learning curriculum
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="rounded-xl border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/5">
          <CardContent className="p-5 text-center">
            <Flower2 className="h-8 w-8 mx-auto mb-2 text-green-400" />
            <p className="text-3xl font-bold">4</p>
            <p className="text-sm text-muted-foreground">Active Patterns</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5">
          <CardContent className="p-5 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-amber-400" />
            <p className="text-3xl font-bold">+10%</p>
            <p className="text-sm text-muted-foreground">Overall Improvement</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-violet-500/5">
          <CardContent className="p-5 text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-400" />
            <p className="text-3xl font-bold">127</p>
            <p className="text-sm text-muted-foreground">Errors Harvested</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-red-500/5">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/20">
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-300 mb-1">
              Fossilization Risk Detected
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Genitive case errors appear in 70% of your production. The system
              will inject targeted "chaos" to destabilize this pattern.
            </p>
            <Button
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 rounded-lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Start Targeted Practice
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          Your Error Patterns
        </h2>

        {errorPatterns.map((pattern, idx) => (
          <Card
            key={idx}
            className="rounded-xl border-border/40 hover:border-green-500/30 transition-colors"
          >
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{pattern.type}</h3>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
                      {pattern.category}
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                      {pattern.improvement}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {pattern.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pattern.examples.map((ex, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs rounded-lg bg-muted/50 text-muted-foreground font-mono"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="md:w-48">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Frequency</span>
                    <span className="font-medium">
                      {(pattern.frequency * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${pattern.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pattern.frequency * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Flower2 className="h-5 w-5 text-green-400" />
            Garden Philosophy
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p className="italic text-center text-lg">
            "Every error is a seed. With care and attention, it blossoms into
            understanding."
          </p>
          <p className="text-center text-sm mt-4">
            Your mistakes aren't failures—they're the most valuable data points
            for your personalized learning journey.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
