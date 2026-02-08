"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { TrendChart } from "./TrendChart"
import type { ErrorPattern } from "@/app/api/errors/patterns/route"
import { AlertTriangle, BookOpen, Brain, Sparkles, TrendingUp, X, Volume2, Loader2, Play, Pause } from "lucide-react"

type PatternModalProps = {
    pattern: ErrorPattern | null
    isOpen: boolean
    onCloseAction: () => void
}

function formatTimeAgo(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}

const getCategoryColor = (category: string) => {
    // Simple hashing for consistent colors if not matched
    if (category?.includes("Morph")) return "bg-primary/20 text-primary border-primary/30"
    if (category?.includes("Phono")) return "bg-accent/20 text-accent border-accent/30"
    if (category?.includes("Synt")) return "bg-accent/20 text-accent border-accent/30"
    return "bg-chart-4/20 text-chart-4 border-chart-4/30"
}

const getRiskColorRaw = (isFossilizing: boolean): string => {
    return isFossilizing ? "var(--color-destructive)" : "var(--color-chart-4)"
}

type GeneratedAudio = {
    audioUrl: string
    romanianText: string
    englishText: string | null
    contentType: string
}

export function PatternModal({ pattern, isOpen, onCloseAction }: PatternModalProps) {
    const [generating, setGenerating] = useState<string | null>(null) // contentType being generated
    const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudio | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    async function handleGenerate(contentType: 'practice_sentences' | 'corrected_version') {
        setGenerating(contentType)
        setError(null)
        setGeneratedAudio(null)

        try {
            const res = await fetch('/api/generated-content/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentType }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Generation failed' }))
                throw new Error(data.error || `Failed (${res.status})`)
            }

            const data = await res.json()
            setGeneratedAudio({
                audioUrl: data.content.audioUrl,
                romanianText: data.content.romanianText,
                englishText: data.content.englishText,
                contentType: data.content.contentType,
            })
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Generation failed')
        } finally {
            setGenerating(null)
        }
    }

    function togglePlayback() {
        if (!audioRef.current || !generatedAudio) return

        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            audioRef.current.src = generatedAudio.audioUrl
            audioRef.current.play()
            setIsPlaying(true)
        }
    }

    if (!pattern) return null

    return (
        <Dialog open={isOpen} onOpenChange={onCloseAction}>
            <DialogContent className="max-w-4xl max-h-[90vh] bg-gradient-to-br from-background to-background border-chart-4/20 p-0 gap-0 overflow-hidden text-foreground block">
                {/* Header */}
                <div className="p-6 border-b border-border bg-muted/30">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-chart-4 to-chart-4/80 bg-clip-text text-transparent flex items-center gap-3">
                                {pattern.errorType}
                            </DialogTitle>
                            <div className="flex gap-2 mt-2">
                                <span className={`px-2 py-0.5 text-xs rounded border ${getCategoryColor(pattern.category || "General")}`}>
                                    {pattern.category || "General"}
                                </span>
                                {pattern.isFossilizing && (
                                    <span className="px-2 py-0.5 text-xs rounded border bg-destructive/20 text-destructive border-destructive/50 font-semibold flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" /> FOSSILIZATION RISK
                                    </span>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
                    <div className="space-y-8">
                        {/* Trend Section */}
                        <div className="bg-muted/30 rounded-xl p-6 border border-border/20">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-foreground/80">
                                <TrendingUp className="h-5 w-5" />
                                Error Frequency Trend
                            </h3>
                            <div className="h-[250px] w-full">
                                <TrendChart
                                    data={pattern.trend}
                                    labels={pattern.trendLabels}
                                    color={getRiskColorRaw(pattern.isFossilizing)}
                                />
                            </div>
                        </div>

                        {/* Interlanguage Analysis */}
                        <div className="bg-gradient-to-br from-chart-4/10 to-chart-4/10 rounded-xl p-6 border border-chart-4/20">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-foreground/80">
                                <Brain className="h-5 w-5" />
                                Interlanguage Analysis
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <div className="text-xs text-chart-4/70 uppercase tracking-wider font-semibold">Current Rule</div>
                                    <div className="p-3 bg-muted/40 rounded-lg text-foreground italic border-l-2 border-chart-4">
                                        "{pattern.interlanguageRule}"
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-chart-4/70 uppercase tracking-wider font-semibold">Theoretical Basis</div>
                                    <div className="p-3 bg-muted/40 rounded-lg text-foreground/70">
                                        {pattern.theoreticalBasis}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Examples */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground/80">
                                <BookOpen className="h-5 w-5" />
                                Recent Examples
                            </h3>
                            <div className="grid gap-3">
                                {pattern.examples.map((ex) => (
                                    <div key={ex.id} className="bg-muted/20 rounded-lg p-4 border border-border flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-3 font-mono text-sm">
                                                <span className="text-destructive line-through decoration-destructive/50">{ex.incorrect}</span>
                                                <span className="text-chart-4">→</span>
                                                <span className="text-chart-4 font-medium">{ex.correct}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">{ex.context}</div>
                                        </div>
                                        <div className="text-xs text-muted-foreground whitespace-nowrap bg-muted/30 px-2 py-1 rounded">
                                            {ex.timestamp}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Intervention */}
                        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20">
                            <div className="flex flex-col md:flex-row items-start gap-4">
                                <div className="p-3 bg-primary/20 rounded-xl">
                                    <Sparkles className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-primary mb-1">Adaptive Intervention</h3>
                                    <p className="text-primary/80 mb-3">{pattern.intervention}</p>
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        {pattern.tier > 0 && (
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                                pattern.tier === 3 ? 'border-destructive/40 text-destructive bg-destructive/10' :
                                                pattern.tier === 2 ? 'border-orange-500/40 text-orange-500 bg-orange-500/10' :
                                                'border-amber-500/40 text-amber-500 bg-amber-500/10'
                                            }`}>
                                                Tier {pattern.tier}: {pattern.tier === 3 ? 'Destabilize' : pattern.tier === 2 ? 'Push' : 'Nudge'}
                                            </span>
                                        )}
                                        {pattern.interventionCount > 0 && (
                                            <span className="inline-flex items-center rounded-full border border-primary/40 px-2.5 py-0.5 text-xs font-semibold text-primary bg-primary/10">
                                                Targeted {pattern.interventionCount}× ({pattern.interventionSuccesses} helped)
                                            </span>
                                        )}
                                        {pattern.lastInterventionAt && (
                                            <span className="inline-flex items-center rounded-full border border-accent/40 px-2.5 py-0.5 text-xs font-semibold text-accent bg-accent/10">
                                                Last: {formatTimeAgo(pattern.lastInterventionAt)}
                                            </span>
                                        )}
                                        {pattern.interventionCount === 0 && (
                                            <span className="inline-flex items-center rounded-full border border-muted-foreground/40 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground bg-muted/10">
                                                Not yet targeted
                                            </span>
                                        )}
                                    </div>

                                    {/* Audio generation buttons */}
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => handleGenerate('practice_sentences')}
                                            disabled={generating !== null}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {generating === 'practice_sentences' ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Volume2 className="h-4 w-4" />
                                            )}
                                            Practice This Pattern
                                        </button>
                                        <button
                                            onClick={() => handleGenerate('corrected_version')}
                                            disabled={generating !== null}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-chart-4/40 bg-chart-4/10 text-chart-4 hover:bg-chart-4/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {generating === 'corrected_version' ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Volume2 className="h-4 w-4" />
                                            )}
                                            Hear Corrections
                                        </button>
                                    </div>

                                    {error && (
                                        <p className="mt-2 text-sm text-destructive">{error}</p>
                                    )}
                                </div>
                            </div>

                            {/* Generated audio player */}
                            {generatedAudio && (
                                <div className="mt-4 bg-muted/40 rounded-lg p-4 border border-border">
                                    <div className="flex items-center gap-3 mb-3">
                                        <button
                                            onClick={togglePlayback}
                                            className="p-2 rounded-full bg-chart-4/20 hover:bg-chart-4/30 transition-colors"
                                        >
                                            {isPlaying ? (
                                                <Pause className="h-5 w-5 text-chart-4" />
                                            ) : (
                                                <Play className="h-5 w-5 text-chart-4" />
                                            )}
                                        </button>
                                        <div>
                                            <div className="text-sm font-medium text-foreground/80">
                                                {generatedAudio.contentType === 'practice_sentences' ? 'Practice Sentences' : 'Corrected Versions'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Generated audio</div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                                        {generatedAudio.romanianText}
                                    </div>
                                    {generatedAudio.englishText && (
                                        <div className="mt-2 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                                            {generatedAudio.englishText}
                                        </div>
                                    )}
                                    <audio
                                        ref={audioRef}
                                        onEnded={() => setIsPlaying(false)}
                                        onError={() => { setIsPlaying(false); setError('Audio playback failed'); }}
                                    />
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
