"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { TrendChart } from "./TrendChart"
import type { ErrorPattern } from "@/app/api/errors/patterns/route"
import { AlertTriangle, BookOpen, Brain, Sparkles, TrendingUp, X, Volume2, Loader2, Play, Pause } from "lucide-react"

type PatternModalProps = {
    pattern: ErrorPattern | null
    isOpen: boolean
    onClose: () => void
}

const getCategoryColor = (category: string) => {
    // Simple hashing for consistent colors if not matched
    if (category?.includes("Morph")) return "bg-purple-500/20 text-purple-200 border-purple-400/30"
    if (category?.includes("Phono")) return "bg-blue-500/20 text-blue-200 border-blue-400/30"
    if (category?.includes("Synt")) return "bg-indigo-500/20 text-indigo-200 border-indigo-400/30"
    return "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
}

const getRiskColorRaw = (isFossilizing: boolean): string => {
    return isFossilizing ? "#f97316" : "#10b981" // orange-500 or emerald-500
}

type GeneratedAudio = {
    audioUrl: string
    romanianText: string
    englishText: string | null
    contentType: string
}

export function PatternModal({ pattern, isOpen, onClose }: PatternModalProps) {
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-900 to-slate-950 border-emerald-500/20 p-0 gap-0 overflow-hidden text-slate-100 block">
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-black/20">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent flex items-center gap-3">
                                {pattern.errorType}
                            </DialogTitle>
                            <div className="flex gap-2 mt-2">
                                <span className={`px-2 py-0.5 text-xs rounded border ${getCategoryColor(pattern.category || "General")}`}>
                                    {pattern.category || "General"}
                                </span>
                                {pattern.isFossilizing && (
                                    <span className="px-2 py-0.5 text-xs rounded border bg-orange-500/20 text-orange-200 border-orange-400/50 font-semibold flex items-center gap-1">
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
                        <div className="bg-black/20 rounded-xl p-6 border border-white/5">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-emerald-200">
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
                        <div className="bg-gradient-to-br from-emerald-950/30 to-teal-950/30 rounded-xl p-6 border border-emerald-500/20">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-emerald-200">
                                <Brain className="h-5 w-5" />
                                Interlanguage Analysis
                            </h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <div className="text-xs text-emerald-400/70 uppercase tracking-wider font-semibold">Current Rule</div>
                                    <div className="p-3 bg-black/30 rounded-lg text-emerald-50 italic border-l-2 border-emerald-500">
                                        "{pattern.interlanguageRule}"
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-emerald-400/70 uppercase tracking-wider font-semibold">Theoretical Basis</div>
                                    <div className="p-3 bg-black/30 rounded-lg text-emerald-100">
                                        {pattern.theoreticalBasis}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Examples */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-emerald-200">
                                <BookOpen className="h-5 w-5" />
                                Recent Examples
                            </h3>
                            <div className="grid gap-3">
                                {pattern.examples.map((ex) => (
                                    <div key={ex.id} className="bg-white/5 rounded-lg p-4 border border-white/10 flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-3 font-mono text-sm">
                                                <span className="text-red-300 line-through decoration-red-500/50">{ex.incorrect}</span>
                                                <span className="text-emerald-500">→</span>
                                                <span className="text-emerald-300 font-medium">{ex.correct}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">{ex.context}</div>
                                        </div>
                                        <div className="text-xs text-muted-foreground whitespace-nowrap bg-black/20 px-2 py-1 rounded">
                                            {ex.timestamp}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Intervention */}
                        <div className="bg-gradient-to-r from-purple-950/40 to-indigo-950/40 rounded-xl p-6 border border-purple-500/20">
                            <div className="flex flex-col md:flex-row items-start gap-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                    <Sparkles className="h-6 w-6 text-purple-300" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-purple-200 mb-1">Adaptive Intervention</h3>
                                    <p className="text-purple-100 mb-3">{pattern.intervention}</p>
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <span className="inline-flex items-center rounded-full border border-purple-500/40 px-2.5 py-0.5 text-xs font-semibold text-purple-300 bg-purple-500/10">
                                            Status: Active
                                        </span>
                                        <span className="inline-flex items-center rounded-full border border-blue-500/40 px-2.5 py-0.5 text-xs font-semibold text-blue-300 bg-blue-500/10">
                                            Chaos Injection: Enabled
                                        </span>
                                    </div>

                                    {/* Audio generation buttons */}
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => handleGenerate('practice_sentences')}
                                            disabled={generating !== null}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        <p className="mt-2 text-sm text-red-300">{error}</p>
                                    )}
                                </div>
                            </div>

                            {/* Generated audio player */}
                            {generatedAudio && (
                                <div className="mt-4 bg-black/30 rounded-lg p-4 border border-white/10">
                                    <div className="flex items-center gap-3 mb-3">
                                        <button
                                            onClick={togglePlayback}
                                            className="p-2 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
                                        >
                                            {isPlaying ? (
                                                <Pause className="h-5 w-5 text-emerald-300" />
                                            ) : (
                                                <Play className="h-5 w-5 text-emerald-300" />
                                            )}
                                        </button>
                                        <div>
                                            <div className="text-sm font-medium text-emerald-200">
                                                {generatedAudio.contentType === 'practice_sentences' ? 'Practice Sentences' : 'Corrected Versions'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Generated audio</div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                        {generatedAudio.romanianText}
                                    </div>
                                    {generatedAudio.englishText && (
                                        <div className="mt-2 text-xs text-slate-400 leading-relaxed whitespace-pre-line">
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
