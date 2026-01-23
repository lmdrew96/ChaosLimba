"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Flower2, AlertTriangle, TrendingUp, Lightbulb, Sparkles, Loader2, LayoutGrid, List as ListIcon, Info } from "lucide-react"
import type { ErrorPattern } from "@/app/api/errors/patterns/route"
import { PatternModal } from "@/components/features/error-garden/PatternModal"
import { cn } from "@/lib/utils"

type PatternData = {
  patterns: ErrorPattern[]
  stats: {
    totalErrors: number
    patternCount: number
    fossilizingCount: number
  }
}

type SortOption = "frequency" | "risk" | "count"
type ViewMode = "grid" | "list"

const errorTypeColors: Record<string, string> = {
  grammar: "from-red-500 to-orange-500",
  pronunciation: "from-amber-500 to-yellow-500",
  vocabulary: "from-blue-500 to-cyan-500",
  word_order: "from-purple-500 to-violet-500",
}

const errorFilterColors: Record<string, string> = {
  grammar: "bg-red-500/10 text-red-400 border-red-500/20",
  pronunciation: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  vocabulary: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  word_order: "bg-purple-500/10 text-purple-400 border-purple-500/20",
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

  // UI State
  const [selectedPattern, setSelectedPattern] = useState<ErrorPattern | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("frequency")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

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

  const sortedPatterns = useMemo(() => {
    if (!data?.patterns) return []
    const patterns = [...data.patterns]

    switch (sortBy) {
      case "frequency":
        return patterns.sort((a, b) => b.frequency - a.frequency)
      case "count":
        return patterns.sort((a, b) => b.count - a.count)
      case "risk":
        // Critical (fossilizing) first, then by frequency
        return patterns.sort((a, b) => {
          if (a.isFossilizing && !b.isFossilizing) return -1
          if (!a.isFossilizing && b.isFossilizing) return 1
          return b.frequency - a.frequency
        })
      default:
        return patterns
    }
  }, [data?.patterns, sortBy])

  const fossilizingPatterns = data?.patterns.filter((p) => p.isFossilizing) || []
  const avgFrequency = data?.patterns.length
    ? data.patterns.reduce((sum, p) => sum + p.frequency, 0) / data.patterns.length
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            <Flower2 className="h-10 w-10 text-emerald-400" />
            Error Garden
          </h1>
          <p className="text-emerald-200/80 mt-2 text-lg">
            Your mistakes are your curriculum
          </p>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-sm font-semibold text-emerald-300">Milestone 3</div>
          <div className="text-xs text-emerald-400/60">Interlanguage Theory (Selinker, 1972)</div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Error Patterns"
          value={data?.stats.patternCount || 0}
          subtext="Clustered by type"
          icon={Flower2}
          color="emerald"
        />
        <StatsCard
          label="Fossilization Risks"
          value={data?.stats.fossilizingCount || 0}
          subtext=">70% frequency"
          icon={AlertTriangle}
          color="orange"
        />
        <StatsCard
          label="Total Occurrences"
          value={data?.stats.totalErrors || 0}
          subtext="All captured errors"
          icon={Sparkles}
          color="blue"
        />
        <StatsCard
          label="Avg Frequency"
          value={`${Math.round(avgFrequency)}%`}
          subtext="Across all patterns"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
        <div className="flex gap-2">
          <SortButton active={sortBy === "frequency"} onClick={() => setSortBy("frequency")}>Sort by Frequency</SortButton>
          <SortButton active={sortBy === "risk"} onClick={() => setSortBy("risk")}>Sort by Risk</SortButton>
          <SortButton active={sortBy === "count"} onClick={() => setSortBy("count")}>Sort by Count</SortButton>
        </div>
        <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", viewMode === "grid" && "bg-white/10 text-white")}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", viewMode === "list" && "bg-white/10 text-white")}
            onClick={() => setViewMode("list")}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>


      {/* Main Content Area */}
      <div className="space-y-6">

        {error && (
          <Card className="rounded-xl border-red-500/30 bg-red-500/5">
            <CardContent className="p-5 text-center text-red-400">
              {error}
            </CardContent>
          </Card>
        )}

        {!error && sortedPatterns.length === 0 && (
          <EmptyState />
        )}

        <div className={cn(
          "grid gap-6",
          viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        )}>
          {sortedPatterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              onClick={() => setSelectedPattern(pattern)}
            />
          ))}
        </div>
      </div>

      {/* Footer / Theory */}
      <Card className="rounded-2xl border-emerald-500/20 bg-gradient-to-br from-emerald-900/40 to-teal-900/40 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-4 text-emerald-300">
            <Lightbulb className="h-6 w-6" />
            <h3 className="text-xl font-bold">Theoretical Foundation</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8 text-sm text-emerald-100/80">
            <div>
              <strong className="block text-emerald-200 mb-2">Interlanguage Theory</strong>
              <p>Learners develop systematic intermediate grammars. Error patterns reveal these internal rules, allowing us to target the underlying "bug" in your mental model rather than just correcting surface mistakes.</p>
            </div>
            <div>
              <strong className="block text-emerald-200 mb-2">Fossilization Detection</strong>
              <p>Patterns appearing in &gt;70% of production opportunities indicate a high risk of fossilization. The system identifies these early to inject "chaos" (varied input/forced production) to destabilize the incorrect rule.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Modal */}
      <PatternModal
        pattern={selectedPattern}
        isOpen={!!selectedPattern}
        onClose={() => setSelectedPattern(null)}
      />
    </div>
  )
}

function StatsCard({ label, value, subtext, icon: Icon, color }: any) {
  const colorClasses: Record<string, string> = {
    emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    orange: "text-orange-400 border-orange-500/30 bg-orange-500/5",
    blue: "text-blue-400 border-blue-500/30 bg-blue-500/5",
    purple: "text-purple-400 border-purple-500/30 bg-purple-500/5",
  }
  const theme = colorClasses[color] || colorClasses.emerald

  return (
    <Card className={cn("rounded-xl border backdrop-blur-sm", theme)}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div className="text-3xl font-bold">{value}</div>
          <Icon className="h-5 w-5 opacity-70" />
        </div>
        <div className="text-sm font-medium opacity-90">{label}</div>
        <div className="text-xs opacity-60 mt-1">{subtext}</div>
      </CardContent>
    </Card>
  )
}

function SortButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg text-sm transition-all font-medium",
        active
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
          : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white"
      )}
    >
      {children}
    </button>
  )
}

function PatternCard({ pattern, onClick }: { pattern: ErrorPattern, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-black/20 backdrop-blur-sm rounded-xl p-5 border border-emerald-500/20 hover:border-emerald-400/50 transition-all cursor-pointer hover:scale-[1.01] hover:shadow-xl hover:shadow-emerald-900/20"
    >
      {/* Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:via-emerald-500/5 rounded-xl transition-all duration-500" />

      <div className="relative flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
            {pattern.errorType}
          </h3>
          <div className="flex gap-2 mt-2">
            <span className={cn("text-xs px-2 py-1 rounded border", errorFilterColors[pattern.errorType] || "border-slate-700 text-slate-400")}>
              {pattern.category || "General"}
            </span>
            {pattern.isFossilizing && (
              <span className="text-xs px-2 py-1 rounded border border-orange-500/50 bg-orange-500/10 text-orange-400 font-semibold animate-pulse">
                HIGH RISK
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-emerald-400">{pattern.frequency}%</div>
          <div className="text-xs text-muted-foreground">frequency</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Usage Accuracy</span>
          <span>{pattern.incorrectUsage} err / {pattern.incorrectUsage + pattern.correctUsage} total</span>
        </div>
        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r transition-all duration-1000",
              pattern.isFossilizing ? "from-orange-600 to-red-500" : "from-emerald-600 to-green-400"
            )}
            style={{ width: `${pattern.frequency}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400/80 bg-black/20 p-2 rounded-lg">
        <Info className="h-3 w-3" />
        <span className="truncate italic">"{pattern.interlanguageRule}"</span>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="rounded-xl border-dashed border-2 border-emerald-500/20 bg-emerald-500/5">
      <CardContent className="p-12 text-center text-muted-foreground">
        <Flower2 className="h-16 w-16 mx-auto mb-4 text-emerald-500/20" />
        <h3 className="font-semibold text-xl text-emerald-200 mb-2">Your garden awaits its first seeds</h3>
        <p className="max-w-md mx-auto mb-6">
          Complete Chaos Window sessions and create written production.
          The AI will analyze your output and plant "seeds" (errors) here for you to nurture.
        </p>
      </CardContent>
    </Card>
  )
}
