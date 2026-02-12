"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    BookOpen,
    Loader2,
    Sparkles,
    Send,
    ChevronDown,
    ChevronUp,
    MessageSquare,
    Clock,
    BarChart3,
    AlertCircle,
} from "lucide-react"
import type { LearningNarrative, AutobiographyStats } from "@/lib/db/schema"

export default function JourneyPage() {
    const [narratives, setNarratives] = useState<LearningNarrative[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
    const [reflections, setReflections] = useState<Record<string, string>>({})
    const [savingReflection, setSavingReflection] = useState<string | null>(null)
    const [noActivityMessage, setNoActivityMessage] = useState<string | null>(null)

    const fetchNarratives = useCallback(async () => {
        try {
            const res = await fetch("/api/journey")
            if (!res.ok) throw new Error("Failed to fetch")
            const data = await res.json()
            setNarratives(data.narratives)
        } catch {
            setError("Failed to load your journey. Please try again.")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchNarratives()
    }, [fetchNarratives])

    const handleGenerate = async () => {
        setGenerating(true)
        setNoActivityMessage(null)
        try {
            const res = await fetch("/api/journey/generate", { method: "POST" })
            if (!res.ok) throw new Error("Failed to generate")
            const data = await res.json()

            if (!data.narrative) {
                setNoActivityMessage(data.message)
                return
            }

            if (data.isExisting) {
                // Already exists — make sure it's in the list
                if (!narratives.find(n => n.id === data.narrative.id)) {
                    setNarratives(prev => [data.narrative, ...prev])
                }
            } else {
                setNarratives(prev => [data.narrative, ...prev])
            }
        } catch {
            setError("Failed to generate narrative. Please try again.")
        } finally {
            setGenerating(false)
        }
    }

    const handleSaveReflection = async (narrativeId: string) => {
        const text = reflections[narrativeId]
        if (!text?.trim()) return

        setSavingReflection(narrativeId)
        try {
            const res = await fetch("/api/journey/reflect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ narrativeId, reflection: text }),
            })
            if (!res.ok) throw new Error("Failed to save")

            setNarratives(prev =>
                prev.map(n => n.id === narrativeId ? { ...n, reflection: text.trim() } : n)
            )
        } catch {
            // Non-critical — reflection save failed
        } finally {
            setSavingReflection(null)
        }
    }

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const hasCurrentPeriod = narratives.length > 0 && isCurrentPeriod(narratives[0])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <Card className="border-destructive/50">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                        <p className="text-destructive">{error}</p>
                        <Button variant="outline" className="mt-4" onClick={() => { setError(null); setLoading(true); fetchNarratives(); }}>
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
            {/* Hero */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <BookOpen className="h-7 w-7 text-primary" />
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        Your Learning Journey
                    </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                    The story of your Romanian language development, written by AI from your real learning data.
                    Learners who reflect on their journey show higher persistence.
                </p>
            </div>

            {/* Generate Button */}
            {!hasCurrentPeriod && (
                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="pt-6 text-center space-y-4">
                        <Sparkles className="h-8 w-8 text-primary mx-auto" />
                        <div>
                            <h3 className="font-semibold text-lg">
                                {narratives.length === 0 ? "Start Your Story" : "New Chapter Available"}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {narratives.length === 0
                                    ? "Generate your first learning narrative from the past 2 weeks of activity."
                                    : "A new 2-week period has passed. Generate your next chapter."
                                }
                            </p>
                        </div>
                        <Button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Writing your story...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Narrative
                                </>
                            )}
                        </Button>
                        {noActivityMessage && (
                            <p className="text-sm text-muted-foreground">{noActivityMessage}</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Narratives */}
            {narratives.map((narrative, index) => (
                <NarrativeCard
                    key={narrative.id}
                    narrative={narrative}
                    isCurrent={index === 0}
                    isExpanded={index === 0 || expandedIds.has(narrative.id)}
                    onToggle={() => toggleExpand(narrative.id)}
                    reflection={reflections[narrative.id] ?? narrative.reflection ?? ""}
                    onReflectionChange={(text) => setReflections(prev => ({ ...prev, [narrative.id]: text }))}
                    onSaveReflection={() => handleSaveReflection(narrative.id)}
                    isSaving={savingReflection === narrative.id}
                />
            ))}

            {/* Empty state */}
            {narratives.length === 0 && !generating && (
                <Card>
                    <CardContent className="pt-6 text-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="font-medium text-muted-foreground">Your story begins here</h3>
                        <p className="text-sm text-muted-foreground/70 mt-2 max-w-md mx-auto">
                            As you learn Romanian through Chaos Window, Workshop, and other features,
                            your learning data builds up. Generate a narrative to see your progress as a story.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

// ─── Narrative Card Component ───

interface NarrativeCardProps {
    narrative: LearningNarrative
    isCurrent: boolean
    isExpanded: boolean
    onToggle: () => void
    reflection: string
    onReflectionChange: (text: string) => void
    onSaveReflection: () => void
    isSaving: boolean
}

function NarrativeCard({
    narrative,
    isCurrent,
    isExpanded,
    onToggle,
    reflection,
    onReflectionChange,
    onSaveReflection,
    isSaving,
}: NarrativeCardProps) {
    const stats = narrative.stats as AutobiographyStats
    const periodLabel = formatPeriodLabel(new Date(narrative.periodStart), new Date(narrative.periodEnd))
    const hasExistingReflection = !!narrative.reflection
    const reflectionChanged = reflection.trim() !== (narrative.reflection ?? "").trim()

    return (
        <Card className={isCurrent ? "border-primary/30" : ""}>
            <button
                onClick={onToggle}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
            >
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Latest</span>}
                        <span className="text-sm font-medium">{periodLabel}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {stats.sessionCount > 0 && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {stats.sessionCount} sessions
                            </span>
                        )}
                        {stats.totalMinutes > 0 && (
                            <span>{stats.totalMinutes} min</span>
                        )}
                        {stats.wordsCollected > 0 && (
                            <span className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3" />
                                {stats.wordsCollected} words
                            </span>
                        )}
                        {hasExistingReflection && (
                            <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                Reflected
                            </span>
                        )}
                    </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {isExpanded && (
                <CardContent className="pt-0 space-y-5">
                    {/* Narrative prose */}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {narrative.narrative.split('\n\n').map((paragraph, i) => (
                            <p key={i} className="text-sm leading-relaxed text-foreground/90">
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    {/* Stats summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatBadge label="Sessions" value={stats.sessionCount} />
                        <StatBadge label="Minutes" value={stats.totalMinutes} />
                        <StatBadge label="Errors" value={stats.errorCount} />
                        <StatBadge
                            label="Proficiency"
                            value={stats.proficiencyDelta !== null
                                ? `${stats.proficiencyDelta > 0 ? '+' : ''}${stats.proficiencyDelta}`
                                : '-'
                            }
                        />
                    </div>

                    {/* Reflection section */}
                    <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Your Reflection</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            What does this make you think about your learning? This is just for you.
                        </p>
                        <Textarea
                            placeholder="Write your thoughts here..."
                            value={reflection}
                            onChange={(e) => onReflectionChange(e.target.value)}
                            className="min-h-[80px] bg-background/50 text-sm"
                        />
                        {reflectionChanged && reflection.trim() && (
                            <Button
                                size="sm"
                                onClick={onSaveReflection}
                                disabled={isSaving}
                                className="bg-primary hover:bg-primary/90"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                    <Send className="h-3 w-3 mr-1" />
                                )}
                                {hasExistingReflection ? "Update" : "Save"} Reflection
                            </Button>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    )
}

function StatBadge({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg bg-muted/30 px-3 py-2 text-center">
            <div className="text-lg font-semibold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
        </div>
    )
}

function formatPeriodLabel(start: Date, end: Date): string {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}, ${end.getFullYear()}`
}

function isCurrentPeriod(narrative: LearningNarrative): boolean {
    const now = new Date()
    const end = new Date(narrative.periodEnd)
    // If the narrative's period end is within 14 days of now, it's the current period
    const diffDays = (now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays < 1 // generated today or the period hasn't ended yet
}
