"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Flower2, AlertTriangle, TrendingUp, Lightbulb, Sparkles, Loader2 } from "lucide-react"
import type { ErrorPattern } from "@/app/api/errors/patterns/route"

type PatternData = {
  patterns: ErrorPattern[]
  stats: {
    totalErrors: number
    patternCount: number
    fossilizingCount: number
  }
}

const errorTypeColors: Record<string, string> = {
  grammar: "from-red-500 to-orange-500",
  pronunciation: "from-amber-500 to-yellow-500",
  vocabulary: "from-blue-500 to-cyan-500",
  word_order: "from-purple-500 to-violet-500",
}

const errorTypeLabels: Record<string, string> = {
  grammar: "Grammar",
  pronunciation: "Phonology",
  vocabulary: "Vocabulary",
  word_order: "Syntax",
}

export default function ErrorGardenPage() {
  const [data, setData] = useState<PatternData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPatterns = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/errors/patterns")
      if (!response.ok) {
        throw new Error("Failed to fetch patterns")
      }
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      console.error("Failed to fetch error patterns:", err)
      setError("Failed to load error patterns")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPatterns()
  }, [fetchPatterns])

  const fossilizingPatterns = data?.patterns.filter((p) => p.isFossilizing) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    )
  }

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
            <p className="text-3xl font-bold">{data?.stats.patternCount || 0}</p>
            <p className="text-sm text-muted-foreground">Active Patterns</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5">
          <CardContent className="p-5 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-amber-400" />
            <p className="text-3xl font-bold">{data?.stats.fossilizingCount || 0}</p>
            <p className="text-sm text-muted-foreground">Fossilizing Risks</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-violet-500/5">
          <CardContent className="p-5 text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-400" />
            <p className="text-3xl font-bold">{data?.stats.totalErrors || 0}</p>
            <p className="text-sm text-muted-foreground">Errors Harvested</p>
          </CardContent>
        </Card>
      </div>

      {fossilizingPatterns.length > 0 && (
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
                {fossilizingPatterns[0].category || fossilizingPatterns[0].errorType} errors
                appear in {fossilizingPatterns[0].frequency}% of your production. The system
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
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-400" />
          Your Error Patterns
        </h2>

        {error && (
          <Card className="rounded-xl border-red-500/30">
            <CardContent className="p-5 text-center text-red-400">
              {error}
            </CardContent>
          </Card>
        )}

        {!error && data?.patterns.length === 0 && (
          <Card className="rounded-xl border-dashed border-2 border-muted">
            <CardContent className="p-8 text-center">
              <Flower2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-semibold text-lg mb-2">Your garden awaits its first seeds</h3>
              <p className="text-muted-foreground mb-2">
                Complete Chaos Window sessions and create written production.
              </p>
              <p className="text-muted-foreground text-sm">
                The AI grammar model will automatically detect errors and populate your garden.
                Every mistake becomes part of your personalized curriculum.
              </p>
            </CardContent>
          </Card>
        )}

        {data?.patterns.map((pattern, idx) => (
          <Card
            key={idx}
            className="rounded-xl border-border/40 hover:border-green-500/30 transition-colors"
          >
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      {pattern.category || pattern.errorType}
                    </h3>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
                      {errorTypeLabels[pattern.errorType] || pattern.errorType}
                    </span>
                    {pattern.isFossilizing && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
                        Fossilizing
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {pattern.count} occurrence{pattern.count !== 1 ? "s" : ""} logged
                  </p>
                  {pattern.recentContext && (
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 text-xs rounded-lg bg-muted/50 text-muted-foreground font-mono">
                        Recent: {pattern.recentContext}
                      </span>
                    </div>
                  )}
                </div>
                <div className="md:w-48">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Frequency</span>
                    <span className="font-medium">{pattern.frequency}%</span>
                  </div>
                  <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${
                        errorTypeColors[pattern.errorType] || "from-green-500 to-emerald-500"
                      } rounded-full transition-all duration-500`}
                      style={{ width: `${pattern.frequency}%` }}
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
