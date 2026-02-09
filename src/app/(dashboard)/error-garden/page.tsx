"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Flower2, AlertTriangle, TrendingUp, TrendingDown, Minus, Lightbulb, Sparkles, Loader2, LayoutGrid, List as ListIcon, Info, Filter, X, Zap, Mic, Type, ArrowUp, ArrowDown } from "lucide-react"
import type { ErrorPattern } from "@/app/api/errors/patterns/route"
import { PatternModal } from "@/components/features/error-garden/PatternModal"
import { cn } from "@/lib/utils"

type PatternData = {
  patterns: ErrorPattern[]
  stats: {
    totalErrors: number
    patternCount: number
    fossilizingCount: number
    tier2PlusCount: number
    errorTypeDistribution: Record<string, number>
    modalitySplit: { speech: number; text: number }
  }
}

type TierFilter = "all" | "tier1plus" | "tier2plus"

type SortOption = "frequency" | "risk" | "count"
type ViewMode = "grid" | "list"

const errorTypeColors: Record<string, string> = {
  grammar: "from-destructive to-destructive/70",
  pronunciation: "from-chart-3 to-chart-3/70",
  vocabulary: "from-accent to-accent/70",
  word_order: "from-primary to-primary/70",
}

const errorFilterColors: Record<string, string> = {
  grammar: "bg-destructive/10 text-destructive border-destructive/20",
  pronunciation: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  vocabulary: "bg-accent/10 text-accent border-accent/20",
  word_order: "bg-primary/10 text-primary border-primary/20",
}

const errorTypeLabels: Record<string, string> = {
  grammar: "Grammar",
  pronunciation: "Phonology",
  vocabulary: "Vocabulary",
  word_order: "Syntax",
}

const ALL_ERROR_TYPES = ['grammar', 'pronunciation', 'vocabulary', 'word_order'] as const

export default function ErrorGardenPage() {
  const [data, setData] = useState<PatternData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI State
  const [selectedPattern, setSelectedPattern] = useState<ErrorPattern | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("frequency")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())
  const [tierFilter, setTierFilter] = useState<TierFilter>("all")

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const clearFilters = () => {
    setActiveFilters(new Set())
  }

  const fetchPatterns = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/errors/patterns", { credentials: "include" })
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
    let patterns = [...data.patterns]

    // Apply error type filters
    if (activeFilters.size > 0) {
      patterns = patterns.filter(p => activeFilters.has(p.errorType))
    }

    // Apply tier filter
    if (tierFilter === "tier1plus") {
      patterns = patterns.filter(p => p.tier >= 1)
    } else if (tierFilter === "tier2plus") {
      patterns = patterns.filter(p => p.tier >= 2)
    }

    // Then sort
    const dir = sortDirection === "asc" ? 1 : -1
    switch (sortBy) {
      case "frequency":
        return patterns.sort((a, b) => dir * (b.frequency - a.frequency))
      case "count":
        return patterns.sort((a, b) => dir * (b.count - a.count))
      case "risk":
        return patterns.sort((a, b) => {
          if (b.tier !== a.tier) return dir * (b.tier - a.tier)
          return dir * (b.frequency - a.frequency)
        })
      default:
        return patterns
    }
  }, [data?.patterns, sortBy, sortDirection, activeFilters, tierFilter])

  const fossilizingPatterns = data?.patterns.filter((p) => p.isFossilizing) || []
  const avgFrequency = data?.patterns.length
    ? data.patterns.reduce((sum, p) => sum + p.frequency, 0) / data.patterns.length
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-chart-4" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-chart-4 to-chart-4/80 bg-clip-text text-transparent">
            <Flower2 className="h-10 w-10 text-chart-4" />
            Error Garden
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Your mistakes are your curriculum
          </p>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-sm font-semibold text-chart-4">Milestone 3</div>
          <div className="text-xs text-chart-4/60">Interlanguage Theory (Selinker, 1972)</div>
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

      {/* Error Type Distribution + Modality Split */}
      {data && data.stats.totalErrors > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
          {/* Error Type Distribution Bar */}
          <div className="flex-1 bg-muted/30 rounded-xl border border-border p-4">
            <div className="text-xs text-muted-foreground font-medium mb-2">Error Type Distribution</div>
            <div className="h-3 rounded-full overflow-hidden flex">
              {ALL_ERROR_TYPES.map(type => {
                const count = data.stats.errorTypeDistribution[type] || 0
                const pct = data.stats.totalErrors > 0 ? (count / data.stats.totalErrors) * 100 : 0
                if (pct === 0) return null
                const barColors: Record<string, string> = {
                  grammar: "bg-destructive",
                  pronunciation: "bg-chart-3",
                  vocabulary: "bg-accent",
                  word_order: "bg-primary",
                }
                return (
                  <div
                    key={type}
                    className={cn("h-full transition-all", barColors[type])}
                    style={{ width: `${pct}%` }}
                    title={`${errorTypeLabels[type]}: ${count} (${Math.round(pct)}%)`}
                  />
                )
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {ALL_ERROR_TYPES.map(type => {
                const count = data.stats.errorTypeDistribution[type] || 0
                if (count === 0) return null
                return (
                  <span key={type} className={cn("text-xs flex items-center gap-1", errorFilterColors[type].split(' ')[1])}>
                    <span className={cn("w-2 h-2 rounded-full", { "bg-destructive": type === "grammar", "bg-chart-3": type === "pronunciation", "bg-accent": type === "vocabulary", "bg-primary": type === "word_order" })} />
                    {errorTypeLabels[type]} {count}
                  </span>
                )
              })}
            </div>
          </div>
          {/* Modality Split */}
          <div className="sm:w-48 bg-muted/30 rounded-xl border border-border p-4 flex flex-col justify-center">
            <div className="text-xs text-muted-foreground font-medium mb-2">Input Mode</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Mic className="h-3.5 w-3.5 text-chart-3" />
                <span className="font-medium">{data.stats.modalitySplit.speech}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Type className="h-3.5 w-3.5 text-accent" />
                <span className="font-medium">{data.stats.modalitySplit.text}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {data.stats.modalitySplit.speech > data.stats.modalitySplit.text ? "Mostly spoken" :
               data.stats.modalitySplit.text > data.stats.modalitySplit.speech ? "Mostly written" : "Balanced"}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/30 p-4 rounded-xl border border-border backdrop-blur-sm">
        <div className="flex gap-2 flex-wrap items-center">
          <SortButton active={sortBy === "frequency"} onClick={() => { setSortBy("frequency"); setSortDirection("desc") }}>Frequency</SortButton>
          <SortButton active={sortBy === "risk"} onClick={() => { setSortBy("risk"); setSortDirection("desc") }}>Risk</SortButton>
          <SortButton active={sortBy === "count"} onClick={() => { setSortBy("count"); setSortDirection("desc") }}>Count</SortButton>
          <button
            onClick={() => setSortDirection(d => d === "asc" ? "desc" : "asc")}
            className={cn(
              "p-2 rounded-lg text-sm transition-all border",
              "border-border bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
            )}
            title={sortDirection === "asc" ? "Ascending" : "Descending"}
          >
            {sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex gap-3 items-center">
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-muted/30 p-1 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 w-8 p-0", viewMode === "grid" && "bg-foreground/10 text-foreground")}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 w-8 p-0", viewMode === "list" && "bg-foreground/10 text-foreground")}
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Error Type Filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Type:</span>
          </div>
          {ALL_ERROR_TYPES.map(type => (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                activeFilters.has(type)
                  ? "bg-foreground/20 border-foreground/40 text-foreground shadow-sm"
                  : cn(errorFilterColors[type], "hover:bg-foreground/5")
              )}
            >
              {errorTypeLabels[type]}
              {activeFilters.has(type) && (
                <span className="ml-1.5 opacity-70">✓</span>
              )}
            </button>
          ))}
          {activeFilters.size > 0 && (
            <button
              onClick={clearFilters}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* Tier Filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>Tier:</span>
          </div>
          <button
            onClick={() => setTierFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
              tierFilter === "all"
                ? "bg-chart-4/20 border-chart-4/40 text-chart-4"
                : "border-border text-muted-foreground hover:bg-foreground/5"
            )}
          >
            All
          </button>
          <button
            onClick={() => setTierFilter("tier1plus")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
              tierFilter === "tier1plus"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-500"
                : "border-border text-muted-foreground hover:bg-foreground/5"
            )}
          >
            At Risk (1+)
          </button>
          <button
            onClick={() => setTierFilter("tier2plus")}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all border flex items-center gap-1",
              tierFilter === "tier2plus"
                ? "bg-destructive/20 border-destructive/40 text-destructive"
                : "border-border text-muted-foreground hover:bg-foreground/5"
            )}
          >
            Critical (2+)
            {data?.stats.tier2PlusCount ? (
              <span className="text-xs opacity-70">({data.stats.tier2PlusCount})</span>
            ) : null}
          </button>
        </div>
      </div>


      {/* Main Content Area */}
      <div className="space-y-6">

        {error && (
          <Card className="rounded-xl border-destructive/30 bg-destructive/5">
            <CardContent className="p-5 text-center text-destructive">
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
      <Card className="rounded-2xl border-chart-4/20 bg-gradient-to-br from-chart-4/10 to-chart-4/5 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-4 text-chart-4">
            <Lightbulb className="h-6 w-6" />
            <h3 className="text-xl font-bold">Theoretical Foundation</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8 text-sm text-foreground/70">
            <div>
              <strong className="block text-foreground/80 mb-2">Interlanguage Theory</strong>
              <p>Learners develop systematic intermediate grammars. Error patterns reveal these internal rules, allowing us to target the underlying "bug" in your mental model rather than just correcting surface mistakes.</p>
            </div>
            <div>
              <strong className="block text-foreground/80 mb-2">Fossilization Detection</strong>
              <p>Patterns appearing in &gt;70% of production opportunities indicate a high risk of fossilization. The system identifies these early to inject "chaos" (varied input/forced production) to destabilize the incorrect rule.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Modal */}
      <PatternModal
        pattern={selectedPattern}
        isOpen={!!selectedPattern}
        onCloseAction={() => setSelectedPattern(null)}
      />
    </div>
  )
}

function StatsCard({ label, value, subtext, icon: Icon, color }: any) {
  const colorClasses: Record<string, string> = {
    emerald: "text-chart-4 border-chart-4/30 bg-chart-4/5",
    orange: "text-destructive border-destructive/30 bg-destructive/5",
    blue: "text-accent border-accent/30 bg-accent/5",
    purple: "text-primary border-primary/30 bg-primary/5",
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
          ? "bg-chart-4 text-foreground shadow-lg shadow-chart-4/20"
          : "bg-muted/20 hover:bg-muted/30 text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function PatternCard({ pattern, onClick }: { pattern: ErrorPattern, onClick: () => void }) {
  // Trending indicator config
  const trendingConfig = {
    improving: { icon: TrendingDown, color: "text-chart-4", label: "Improving" },
    stable: { icon: Minus, color: "text-amber-500", label: "Stable" },
    worsening: { icon: TrendingUp, color: "text-destructive", label: "Worsening" },
  }
  const trending = trendingConfig[pattern.trendDirection] || trendingConfig.stable
  const TrendIcon = trending.icon

  // Tier badge config
  const tierConfig: Record<number, { label: string; color: string } | null> = {
    0: null,
    1: { label: "Tier 1", color: "border-amber-500/50 bg-amber-500/10 text-amber-500" },
    2: { label: "Tier 2", color: "border-orange-500/50 bg-orange-500/10 text-orange-500" },
    3: { label: "Tier 3", color: "border-destructive/50 bg-destructive/10 text-destructive animate-pulse" },
  }
  const tierBadge = tierConfig[pattern.tier]

  return (
    <div
      onClick={onClick}
      className="group relative bg-muted/30 backdrop-blur-sm rounded-xl p-5 border border-chart-4/20 hover:border-chart-4/50 transition-all cursor-pointer hover:scale-[1.01] hover:shadow-xl hover:shadow-chart-4/20"
    >
      {/* Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-chart-4/0 via-chart-4/0 to-chart-4/0 group-hover:via-chart-4/5 rounded-xl transition-all duration-500" />

      <div className="relative flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground group-hover:text-chart-4 transition-colors">
            {pattern.errorType}
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className={cn("text-xs px-2 py-1 rounded border", errorFilterColors[pattern.errorType] || "border-border text-muted-foreground")}>
              {pattern.category || "General"}
            </span>
            {tierBadge && (
              <span className={cn("text-xs px-2 py-1 rounded border font-semibold", tierBadge.color)}>
                {tierBadge.label}
              </span>
            )}
            {pattern.isFossilizing && !tierBadge && (
              <span className="text-xs px-2 py-1 rounded border border-destructive/50 bg-destructive/10 text-destructive font-semibold">
                HIGH RISK
              </span>
            )}
            {pattern.primaryModality && pattern.primaryModality !== 'mixed' && (
              <span className={cn(
                "text-xs px-2 py-1 rounded border flex items-center gap-1",
                pattern.primaryModality === 'speech'
                  ? "border-chart-3/40 bg-chart-3/10 text-chart-3"
                  : "border-accent/40 bg-accent/10 text-accent"
              )}>
                {pattern.primaryModality === 'speech' ? <Mic className="h-3 w-3" /> : <Type className="h-3 w-3" />}
                {pattern.primaryModality === 'speech' ? 'Mostly Speech' : 'Mostly Text'}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-chart-4">{pattern.frequency}%</div>
          <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
            <TrendIcon className={cn("h-3 w-3", trending.color)} />
            <span className={trending.color}>{trending.label}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Usage Accuracy</span>
          <span>{pattern.incorrectUsage} err / {pattern.incorrectUsage + pattern.correctUsage} total</span>
        </div>
        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r transition-all duration-1000",
              pattern.tier >= 2 ? "from-destructive to-destructive/70" :
              pattern.tier === 1 ? "from-amber-500 to-amber-500/70" :
              pattern.isFossilizing ? "from-destructive to-destructive/70" : "from-chart-4 to-chart-4/70"
            )}
            style={{ width: `${pattern.frequency}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground/80 bg-muted/30 p-2 rounded-lg">
        <Info className="h-3 w-3" />
        <span className="truncate italic">"{pattern.interlanguageRule}"</span>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="rounded-xl border-dashed border-2 border-chart-4/20 bg-chart-4/5">
      <CardContent className="p-12 text-center text-muted-foreground">
        <Flower2 className="h-16 w-16 mx-auto mb-4 text-chart-4/20" />
        <h3 className="font-semibold text-xl text-foreground/80 mb-2">Your garden awaits its first seeds</h3>
        <p className="max-w-md mx-auto mb-6">
          Complete Chaos Window sessions and create written production.
          The AI will analyze your output and plant "seeds" (errors) here for you to nurture.
        </p>
      </CardContent>
    </Card>
  )
}
