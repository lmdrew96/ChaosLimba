"use client"

import { useState } from "react"
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

function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTooltipDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ProficiencyTimelineChart({ history, hasData }: ProficiencyTimelineChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    if (!hasData) {
        return (
            <Card className="rounded-xl border-dashed border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary/30" />
                    <h3 className="font-semibold text-lg text-primary mb-2">
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

    const maxScore = Math.max(...history.map(h => h.overall))
    const minScore = Math.min(...history.map(h => h.overall))
    const range = maxScore - minScore || 1

    // Y-axis labels: show min, mid, max (on 1-10 scale)
    const yMax = Math.ceil(maxScore)
    const yMin = Math.max(1, Math.floor(minScore))
    const yMid = ((yMax + yMin) / 2).toFixed(1)

    const hoveredPoint = hoveredIndex !== null ? history[hoveredIndex] : null

    return (
        <Card className="rounded-xl border-primary/20 bg-primary/10">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-primary">
                        <TrendingUp className="h-5 w-5" />
                        <h3 className="font-semibold">Progress Over Time</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {history.length} session{history.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Chart with Y-axis */}
                <div className="flex gap-2">
                    {/* Y-axis labels */}
                    <div className="flex flex-col justify-between text-xs text-muted-foreground w-6 shrink-0 py-0.5">
                        <span>{yMax}</span>
                        <span>{yMid}</span>
                        <span>{yMin}</span>
                    </div>

                    {/* Bars */}
                    <div className="flex items-end gap-1 h-32 flex-1">
                        {history.map((point, i) => {
                            const height = ((point.overall - minScore) / range) * 100
                            const normalizedHeight = Math.max(10, height)
                            const isHovered = hoveredIndex === i

                            return (
                                <div
                                    key={i}
                                    className="flex-1 flex flex-col items-center gap-1 relative"
                                    onMouseEnter={() => setHoveredIndex(i)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    <div
                                        className={`w-full rounded-t transition-all duration-300 cursor-default ${
                                            isHovered
                                                ? "bg-gradient-to-t from-primary/90 to-primary/50"
                                                : "bg-gradient-to-t from-primary to-primary/70"
                                        }`}
                                        style={{ height: `${normalizedHeight}%` }}
                                    />
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* X-axis labels */}
                <div className="flex gap-2">
                    <div className="w-6 shrink-0" />
                    <div className="flex justify-between flex-1 mt-2 text-xs text-muted-foreground">
                        <span>{history.length > 0 ? formatDate(history[0].date) : ''}</span>
                        {history.length > 2 && (
                            <span>{formatDate(history[Math.floor(history.length / 2)].date)}</span>
                        )}
                        <span>{history.length > 1 ? formatDate(history[history.length - 1].date) : ''}</span>
                    </div>
                </div>

                {/* Hover tooltip */}
                {hoveredPoint && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-primary/10 text-sm">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="font-medium text-foreground">
                                {formatTooltipDate(hoveredPoint.date)}
                            </span>
                            <span className="text-primary font-bold">
                                {hoveredPoint.overall.toFixed(1)} / 10
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {hoveredPoint.listening !== null && (
                                <span>Listening: <span className="text-accent">{hoveredPoint.listening.toFixed(1)}</span></span>
                            )}
                            {hoveredPoint.reading !== null && (
                                <span>Reading: <span className="text-chart-3">{hoveredPoint.reading.toFixed(1)}</span></span>
                            )}
                            {hoveredPoint.speaking !== null && (
                                <span>Speaking: <span className="text-secondary">{hoveredPoint.speaking.toFixed(1)}</span></span>
                            )}
                            {hoveredPoint.writing !== null && (
                                <span>Writing: <span className="text-chart-4">{hoveredPoint.writing.toFixed(1)}</span></span>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
