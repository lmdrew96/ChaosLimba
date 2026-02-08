"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, TrendingUp, Target, Clock, Volume2, Headphones } from "lucide-react"

interface GeneratedContentItem {
  id: string
  contentType: string
  audioUrl: string
  romanianText: string
}

interface SessionSummaryModalProps {
  isOpen: boolean
  onCloseAction: () => void
  onNewSessionAction: () => void
  sessionId: string | null
  duration: number // seconds
  interactionCount: number
}

interface SessionStats {
  errorCount: number
  topErrors: string[]
}

export function SessionSummaryModal({
  isOpen,
  onCloseAction,
  onNewSessionAction,
  sessionId,
  duration,
  interactionCount,
}: SessionSummaryModalProps) {
  const router = useRouter()
  const [stats, setStats] = useState<SessionStats>({ errorCount: 0, topErrors: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [practiceContent, setPracticeContent] = useState<GeneratedContentItem[]>([])

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionStats()
      // Fetch recently generated practice content (from background generation)
      fetch('/api/generated-content?limit=3')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.items?.length > 0) {
            setPracticeContent(data.items.filter((item: GeneratedContentItem) => item.audioUrl))
          }
        })
        .catch(() => {}) // non-critical
    }
  }, [isOpen, sessionId])

  const fetchSessionStats = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/errors/patterns')
      if (res.ok) {
        const data = await res.json()
        // Get top 3 error types for display
        const topErrors = data.patterns
          .slice(0, 3)
          .map((p: any) => p.category)

        setStats({
          errorCount: data.stats.totalErrors,
          topErrors,
        })
      }
    } catch (err) {
      console.error('Failed to fetch session stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleViewErrorGarden = () => {
    router.push('/error-garden')
    onCloseAction()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Sparkles className="h-6 w-6 text-chart-3" />
            <DialogTitle>Session Complete!</DialogTitle>
          </div>
          <DialogDescription>
            Great practice session! Here's what you accomplished:
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Clock className="h-8 w-8 text-accent mb-2" />
                  <div className="text-2xl font-bold">{formatDuration(duration)}</div>
                  <div className="text-xs text-muted-foreground">Practice Time</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Target className="h-8 w-8 text-chart-4 mb-2" />
                  <div className="text-2xl font-bold">{interactionCount}</div>
                  <div className="text-xs text-muted-foreground">Interactions</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Patterns */}
          {!isLoading && stats.topErrors.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold">Areas for Growth</h3>
                </div>
                <ul className="space-y-2">
                  {stats.topErrors.map((error, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-3">
                  Your AI tutor will focus on these in future sessions
                </p>
              </CardContent>
            </Card>
          )}

          {/* Practice Audio Ready */}
          {practiceContent.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Headphones className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Practice Audio Ready</h3>
                </div>
                <div className="space-y-2">
                  {practiceContent.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        const audio = new Audio(item.audioUrl)
                        audio.play()
                        // Mark as listened
                        fetch(`/api/generated-content/${item.id}`, { method: 'PATCH' }).catch(() => {})
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                    >
                      <Volume2 className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {item.contentType === 'practice_sentences' ? 'Practice Sentences' :
                           item.contentType === 'mini_lesson' ? 'Mini Lesson' : 'Corrections'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {item.romanianText.slice(0, 60)}...
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleViewErrorGarden} className="w-full sm:w-auto">
            View Error Garden
          </Button>
          <Button onClick={onNewSessionAction} className="w-full sm:w-auto">
            Start New Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
