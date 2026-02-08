"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Sparkles,
  BookOpen,
  Volume2,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Send,
  Lightbulb,
  Play,
  Pause
} from "lucide-react"

// Type for grammar info
type GrammarInfo = {
  partOfSpeech: string;
  gender?: string | null;
  conjugation?: string | null;
  declension?: string | null;
  notes?: string | null;
};

// Full mystery item type with new fields
export type MysteryItemFull = {
  id: string;
  word: string;
  context: string | null;
  definition: string | null;
  examples: string[] | null;
  grammarInfo: GrammarInfo | null;
  relatedWords: string[] | null;
  practicePrompt: string | null;
  pronunciation: string | null;
  etymology: string | null;
  isExplored: boolean;
  collected: string;
  createdAt: string;
  source: string;
};

type Props = {
  item: MysteryItemFull;
  onCloseAction: () => void;
  onExploreAction: (id: string) => Promise<void>;
  onMarkExploredAction: (id: string) => void;
  isAnalyzing: boolean;
};

export function MysteryExploreCard({ item, onCloseAction, onExploreAction, onMarkExploredAction, isAnalyzing }: Props) {
  const [practiceAnswer, setPracticeAnswer] = useState("")
  const [practiceResult, setPracticeResult] = useState<{
    isCorrect: boolean;
    feedback: string;
  } | null>(null)
  const [isSubmittingPractice, setIsSubmittingPractice] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['definition', 'examples']))

  // TTS state
  const [isTTSLoading, setIsTTSLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handlePlayPronunciation = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    setIsTTSLoading(true)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: item.word, speed: 0.85 })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('TTS failed:', data.error || res.status)
        return
      }

      const audioBlob = await res.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (!audioRef.current) {
        audioRef.current = new Audio()
        audioRef.current.onended = () => setIsPlaying(false)
        audioRef.current.onerror = () => setIsPlaying(false)
      }

      audioRef.current.src = audioUrl
      audioRef.current.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('TTS error:', error)
    } finally {
      setIsTTSLoading(false)
    }
  }

  const hasAnalysis = item.definition && item.definition !== "The Oracle is meditating... (Try again)"

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const handlePracticeSubmit = async () => {
    if (!practiceAnswer.trim()) return

    setIsSubmittingPractice(true)
    try {
      const res = await fetch("/api/mystery-shelf/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          word: item.word,
          userAnswer: practiceAnswer,
        })
      })

      if (res.ok) {
        const result = await res.json()
        setPracticeResult({
          isCorrect: result.isCorrect,
          feedback: result.feedback
        })
      }
    } catch (error) {
      console.error("Practice submission failed", error)
    } finally {
      setIsSubmittingPractice(false)
    }
  }

  const SectionHeader = ({ title, section, icon: Icon }: { title: string; section: string; icon: React.ElementType }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full text-left py-2 px-3 rounded-lg hover:bg-accent/10 transition-colors"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-accent">
        <Icon className="h-4 w-4" />
        {title}
      </span>
      {expandedSections.has(section) ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  )

  return (
    <Card className="rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-muted/30 sticky top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-3xl font-bold text-accent">
                {item.word}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPronunciation}
                disabled={isTTSLoading}
                className="h-8 w-8 p-0 text-accent hover:bg-accent/20"
                title="Hear pronunciation"
              >
                {isTTSLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
            {item.pronunciation && (
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                /{item.pronunciation}/
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloseAction}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* No analysis yet - show prompt */}
        {!hasAnalysis && (
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
            <p className="text-sm text-muted-foreground mb-3">
              Click below to unlock the deep exploration for this word.
            </p>
            <Button
              className="w-full bg-accent hover:bg-accent/80"
              onClick={() => onExploreAction(item.id)}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Deep Explore
                </>
              )}
            </Button>
          </div>
        )}

        {/* Definition Section */}
        {hasAnalysis && (
          <div className="rounded-xl bg-background/60 overflow-hidden">
            <SectionHeader title="Definition" section="definition" icon={BookOpen} />
            {expandedSections.has('definition') && (
              <div className="px-3 pb-3">
                <p className="text-foreground">{item.definition}</p>
                {item.etymology && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Origin: {item.etymology}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Grammar Info Section */}
        {item.grammarInfo && (
          <div className="rounded-xl bg-background/60 overflow-hidden">
            <SectionHeader title="Grammar" section="grammar" icon={BookOpen} />
            {expandedSections.has('grammar') && (
              <div className="px-3 pb-3 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-accent/20 text-accent font-medium">
                    {item.grammarInfo.partOfSpeech}
                  </span>
                  {item.grammarInfo.gender && (
                    <span className="px-2 py-1 text-xs rounded-full bg-chart-2/20 text-chart-2">
                      {item.grammarInfo.gender}
                    </span>
                  )}
                </div>
                {item.grammarInfo.conjugation && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Conjugation:</span> {item.grammarInfo.conjugation}
                  </p>
                )}
                {item.grammarInfo.declension && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Declension:</span> {item.grammarInfo.declension}
                  </p>
                )}
                {item.grammarInfo.notes && (
                  <p className="text-sm text-muted-foreground italic">
                    {item.grammarInfo.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Context Section */}
        {item.context && (
          <div className="rounded-xl bg-background/60 overflow-hidden">
            <SectionHeader title="Context" section="context" icon={BookOpen} />
            {expandedSections.has('context') && (
              <p className="px-3 pb-3 text-sm italic text-muted-foreground">
                &ldquo;{item.context}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Examples Section */}
        {item.examples && item.examples.length > 0 && (
          <div className="rounded-xl bg-background/60 overflow-hidden">
            <SectionHeader title="Examples" section="examples" icon={Volume2} />
            {expandedSections.has('examples') && (
              <ul className="px-3 pb-3 space-y-2">
                {item.examples.map((ex, i) => (
                  <li key={i} className="text-sm text-muted-foreground italic border-l-2 border-accent/30 pl-3">
                    &ldquo;{ex}&rdquo;
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Related Words Section */}
        {item.relatedWords && item.relatedWords.length > 0 && (
          <div className="rounded-xl bg-background/60 overflow-hidden">
            <SectionHeader title="Related Words" section="related" icon={BookOpen} />
            {expandedSections.has('related') && (
              <div className="px-3 pb-3 flex flex-wrap gap-2">
                {item.relatedWords.map((word, i) => (
                  <span key={i} className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                    {word}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Practice Section */}
        {item.practicePrompt && (
          <div className="rounded-xl bg-accent/10 border border-accent/20 overflow-hidden">
            <SectionHeader title="Practice" section="practice" icon={Lightbulb} />
            {expandedSections.has('practice') && (
              <div className="px-3 pb-3 space-y-3">
                <p className="text-sm text-foreground">
                  {item.practicePrompt}
                </p>

                {!practiceResult ? (
                  <>
                    <Textarea
                      placeholder="Write your Romanian sentence here..."
                      value={practiceAnswer}
                      onChange={(e) => setPracticeAnswer(e.target.value)}
                      className="min-h-[80px] bg-background/50"
                    />
                    <Button
                      onClick={handlePracticeSubmit}
                      disabled={!practiceAnswer.trim() || isSubmittingPractice}
                      className="w-full bg-accent hover:bg-accent/80"
                    >
                      {isSubmittingPractice ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Submit Answer
                    </Button>
                  </>
                ) : (
                  <div className={`p-3 rounded-lg ${practiceResult.isCorrect ? 'bg-chart-4/20' : 'bg-chart-5/20'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {practiceResult.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-chart-4" />
                      ) : (
                        <Lightbulb className="h-5 w-5 text-chart-5" />
                      )}
                      <span className="font-medium">
                        {practiceResult.isCorrect ? "Great job!" : "Keep practicing!"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{practiceResult.feedback}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setPracticeResult(null)
                        setPracticeAnswer("")
                      }}
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mark as Explored Button */}
        {hasAnalysis && !item.isExplored && (
          <Button
            className="w-full bg-chart-4 hover:bg-chart-4/80 rounded-xl"
            onClick={() => onMarkExploredAction(item.id)}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark as Explored
          </Button>
        )}

        {item.isExplored && (
          <div className="text-center py-2">
            <span className="text-sm text-chart-4 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Explored
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
