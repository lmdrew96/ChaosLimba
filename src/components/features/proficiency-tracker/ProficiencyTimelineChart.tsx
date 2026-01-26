"use client"

import { TrendingUp, BookOpen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface TimelineData {
    date: string
    overall: number
    listening: number | null
    reading: number | null
    speaking: number | null
    writing: number | null
}

interface ProficiencyTimelineChartProps {
    history: TimelineData[]
    hasData: boolean
}

export function ProficiencyTimelineChart({ history, hasData }: ProficiencyTimelineChartProps) {
    if (!hasData) {
        return (
            <Card className="rounded-xl border-dashed border-2 border-violet-500/20 bg-violet-500/5">
                <CardContent className="p-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-violet-500/30" />
                    <h3 className="font-semibold text-lg text-violet-200 mb-2">
                        Continue your studies to see your progress!
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Complete Chaos Window sessions and practice activities.
                        Your proficiency timeline will appear here as you learn.
                    </p>
                </CardContent>
            </Card>
        )
    }

    // Simple sparkline visualization when we have data
    const maxScore = Math.max(...history.map(h => h.overall))
    const minScore = Math.min(...history.map(h => h.overall))
    const range = maxScore - minScore || 1

    return (
        <Card className="rounded-xl border-violet-500/20 bg-gradient-to-br from-violet-900/20 to-purple-900/20">
            <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6 text-violet-300">
                    <TrendingUp className="h-5 w-5" />
                    <h3 className="font-semibold">Progress Over Time</h3>
                </div>

                {/* Simple bar chart */}
                <div className="flex items-end gap-1 h-32">
                    {history.map((point, i) => {
                        const height = ((point.overall - minScore) / range) * 100
                        const normalizedHeight = Math.max(10, height) // Minimum 10% height

                        return (
                            <div
                                key={i}
                                className="flex-1 flex flex-col items-center gap-1"
                            >
                                <div
                                    className="w-full bg-gradient-to-t from-violet-600 to-purple-400 rounded-t transition-all duration-500 hover:from-violet-500 hover:to-purple-300"
                                    style={{ height: `${normalizedHeight}%` }}
                                    title={`Score: ${point.overall.toFixed(1)}`}
                                />
                            </div>
                        )
                    })}
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                    <span>{history.length > 0 ? formatDate(history[0].date) : ''}</span>
                    <span>{history.length > 0 ? formatDate(history[history.length - 1].date) : ''}</span>
                </div>
            </CardContent>
        </Card>
    )
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
