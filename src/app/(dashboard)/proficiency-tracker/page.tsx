"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    TrendingUp,
    TrendingDown,
    Minus,
    Loader2,
    Lightbulb,
    Sparkles,
    Target,
    ArrowRight,
    RefreshCw,
    Clock,
} from "lucide-react"
import Link from "next/link"
import { SkillProgressBar } from "@/components/features/proficiency-tracker/SkillProgressBar"
import { ProficiencyTimelineChart } from "@/components/features/proficiency-tracker/ProficiencyTimelineChart"
import type { CEFRLevel } from "@/lib/proficiency"

type Trend = 'improving' | 'declining' | 'stable'

interface SkillData {
    score: number
    level: CEFRLevel
    trend: Trend
}

interface ProficiencyData {
    overall: { score: number; level: CEFRLevel }
    skills: {
        listening: SkillData
        reading: SkillData
        speaking: SkillData
        writing: SkillData
    }
    nextMilestone: { level: string; progress: number }
    lastUpdated: string | null
    sessionsTracked: number
}

interface HistoryData {
    history: Array<{
        date: string
        overall: number
        listening: number | null
        reading: number | null
        speaking: number | null
        writing: number | null
    }>
    hasData: boolean
}

const CEFR_LABELS: Record<CEFRLevel, string> = {
    'A1': 'Beginner',
    'A2': 'Elementary',
    'B1': 'Intermediate',
    'B2': 'Upper Intermediate',
    'C1': 'Advanced',
    'C2': 'Proficient',
}

const TREND_CONFIG = {
    improving: { icon: TrendingUp, label: 'Improving', color: 'text-chart-4' },
    declining: { icon: TrendingDown, label: 'Needs focus', color: 'text-destructive' },
    stable: { icon: Minus, label: 'Stable', color: 'text-muted-foreground' },
}

function formatLastUpdated(iso: string): string {
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ProficiencyTrackerPage() {
    const [proficiency, setProficiency] = useState<ProficiencyData | null>(null)
    const [history, setHistory] = useState<HistoryData | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            const [profResponse, historyResponse] = await Promise.all([
                fetch('/api/proficiency'),
                fetch('/api/proficiency/history?limit=20'),
            ])

            if (!profResponse.ok || !historyResponse.ok) {
                throw new Error('Failed to fetch data')
            }

            const [profData, histData] = await Promise.all([
                profResponse.json(),
                historyResponse.json(),
            ])

            setProficiency(profData)
            setHistory(histData)
            setError(null)
        } catch (err) {
            console.error('Failed to fetch proficiency data:', err)
            setError('Failed to load proficiency data')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Auto-refresh when window regains focus
    useEffect(() => {
        const handleFocus = () => fetchData(true)
        window.addEventListener('focus', handleFocus)
        return () => window.removeEventListener('focus', handleFocus)
    }, [fetchData])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !proficiency) {
        return (
            <Card className="rounded-xl border-destructive/30 bg-destructive/5 max-w-4xl mx-auto">
                <CardContent className="p-8 text-center text-destructive">
                    {error || 'Failed to load proficiency data'}
                </CardContent>
            </Card>
        )
    }

    const { overall, skills, nextMilestone, lastUpdated, sessionsTracked } = proficiency

    // Find strongest and weakest skills
    const skillEntries = Object.entries(skills) as [keyof typeof skills, SkillData][]
    const strongest = skillEntries.reduce((a, b) => a[1].score > b[1].score ? a : b)
    const weakest = skillEntries.reduce((a, b) => a[1].score < b[1].score ? a : b)
    const hasVariation = strongest[1].score !== weakest[1].score

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        <TrendingUp className="h-10 w-10 text-primary" />
                        Proficiency Tracker
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Your journey through the chaos
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdated && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Updated {formatLastUpdated(lastUpdated)}
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-border"
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Overall Level Badge */}
            <Card className="rounded-2xl border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />

                <CardContent className="p-8 relative">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <div className="text-sm text-primary mb-2">Overall Proficiency</div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-6xl font-bold text-foreground">{overall.level}</span>
                                <span className="text-2xl text-primary">{CEFR_LABELS[overall.level]}</span>
                            </div>
                            <div className="text-primary/80 mt-2">
                                Score: {overall.score.toFixed(1)} / 10
                            </div>
                            {sessionsTracked > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                    Based on {sessionsTracked} session{sessionsTracked !== 1 ? 's' : ''}
                                </div>
                            )}
                        </div>

                        {/* Progress to next level */}
                        <div className="bg-muted/30 rounded-xl p-5 border border-primary/20 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-3 text-foreground/80">
                                <Target className="h-4 w-4" />
                                <span className="text-sm font-medium">Next: {nextMilestone.level}</span>
                            </div>
                            <div className="h-3 bg-muted/30 rounded-full overflow-hidden mb-2">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000"
                                    style={{ width: `${nextMilestone.progress}%` }}
                                />
                            </div>
                            <div className="text-right text-xs text-primary/80">
                                {nextMilestone.progress}% complete
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Skill Breakdown */}
            <div>
                <h2 className="text-xl font-semibold text-foreground/80 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Skill Breakdown
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    {skillEntries.map(([skill, data]) => {
                        const trendConfig = TREND_CONFIG[data.trend]
                        const TrendIcon = trendConfig.icon
                        return (
                            <div key={skill} className="relative">
                                <SkillProgressBar skill={skill} score={data.score} level={data.level} />
                                {sessionsTracked >= 2 && (
                                    <div className={`absolute top-4 right-4 flex items-center gap-1 text-xs ${trendConfig.color}`}>
                                        <TrendIcon className="h-3 w-3" />
                                        <span>{trendConfig.label}</span>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Strongest/Weakest insight */}
                {sessionsTracked > 0 && hasVariation && (
                    <div className="flex flex-wrap gap-3 mt-4 text-sm">
                        <span className="px-3 py-1.5 rounded-full bg-chart-4/10 text-chart-4 border border-chart-4/20">
                            Strongest: {strongest[0].charAt(0).toUpperCase() + strongest[0].slice(1)} ({Math.round(strongest[1].score)})
                        </span>
                        <span className="px-3 py-1.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                            Needs work: {weakest[0].charAt(0).toUpperCase() + weakest[0].slice(1)} ({Math.round(weakest[1].score)})
                        </span>
                    </div>
                )}
            </div>

            {/* Timeline Chart */}
            <div>
                <h2 className="text-xl font-semibold text-foreground/80 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Progress Timeline
                </h2>
                <ProficiencyTimelineChart
                    history={history?.history || []}
                    hasData={history?.hasData || false}
                />
            </div>

            {/* Insights */}
            <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 to-primary/10 backdrop-blur-sm">
                <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-4 text-primary">
                        <Lightbulb className="h-6 w-6" />
                        <h3 className="text-xl font-bold">Learning Insights</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 text-sm text-foreground/70">
                        <div>
                            <strong className="block text-foreground/80 mb-2">Continuous Assessment</strong>
                            <p>
                                Your proficiency updates with every Chaos Window session and practice activity.
                                Embrace the productive confusion—each mistake is a data point!
                            </p>
                        </div>
                        <div>
                            <strong className="block text-foreground/80 mb-2">Zone of Proximal Development</strong>
                            <p>
                                The system keeps you in your ZPD (60-80% accuracy) where learning happens fastest.
                                Content difficulty adapts automatically based on your progress.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <Button asChild className="bg-primary hover:bg-primary/80 rounded-xl shadow-lg shadow-primary/20">
                            <Link href="/chaos-window">
                                Start Practicing
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
