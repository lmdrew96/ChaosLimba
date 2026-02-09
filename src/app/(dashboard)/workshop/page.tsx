"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Wrench,
  Play,
  Timer,
  Square,
  Loader2,
  AlertCircle,
} from "lucide-react"

import { ChallengeCard } from "@/components/features/workshop/ChallengeCard"
import { WorkshopFeedback } from "@/components/features/workshop/WorkshopFeedback"
import { FeatureProgress } from "@/components/features/workshop/FeatureProgress"
import type { WorkshopChallenge, WorkshopEvaluation, WorkshopChallengeType } from "@/lib/ai/workshop"

interface FeatureExplored {
  featureKey: string
  featureName: string
  correct: boolean
  challengeType?: WorkshopChallengeType
}

type TimerMode = null | 300 | 600

export default function WorkshopPage() {
  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [challengeCount, setChallengeCount] = useState(0)
  const [featuresExplored, setFeaturesExplored] = useState<FeatureExplored[]>([])

  // Type history for anti-repeat + surprise
  const [typeHistory, setTypeHistory] = useState<WorkshopChallengeType[]>([])
  const [surpriseInterval, setSurpriseInterval] = useState(0)

  // Challenge state
  const [currentChallenge, setCurrentChallenge] = useState<WorkshopChallenge | null>(null)
  const [currentEvaluation, setCurrentEvaluation] = useState<WorkshopEvaluation | null>(null)
  const [prefetchedChallenge, setPrefetchedChallenge] = useState<WorkshopChallenge | null>(null)
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Timer state
  const [timerMode, setTimerMode] = useState<TimerMode>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const sessionStartRef = useRef<number | null>(null)

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [showingFeedback, setShowingFeedback] = useState(false)
  const [userLevel, setUserLevel] = useState<string | null>(null)

  // Timer countdown
  useEffect(() => {
    if (timerMode && isActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleEndSession()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerMode, isActive, timeRemaining > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch user level on mount
  useEffect(() => {
    fetch("/api/user/preferences", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.preferences?.languageLevel) {
          setUserLevel(data.preferences.languageLevel)
        }
      })
      .catch((err) => console.error('[Workshop] Failed to fetch user level, defaulting to A1:', err))
  }, [])

  const getRecentTypes = useCallback(() => typeHistory.slice(-3), [typeHistory])

  const shouldForceSurprise = useCallback(() => {
    if (!surpriseInterval || challengeCount === 0) return false
    return challengeCount > 0 && challengeCount % surpriseInterval === 0
  }, [surpriseInterval, challengeCount])

  const trackType = useCallback((challenge: WorkshopChallenge) => {
    setTypeHistory(prev => [...prev, challenge.type])
  }, [])

  const fetchChallenge = useCallback(async (sid?: string) => {
    setIsLoadingChallenge(true)
    setError(null)

    try {
      const res = await fetch("/api/workshop/challenge", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sid || sessionId,
          recentTypes: getRecentTypes(),
          forceSurprise: shouldForceSurprise(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to get challenge")
      }

      const data = await res.json()

      if (!sid && !sessionId) {
        setSessionId(data.sessionId)
      }

      setCurrentChallenge(data.challenge)
      trackType(data.challenge)
      setCurrentEvaluation(null)
      setShowingFeedback(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoadingChallenge(false)
    }
  }, [sessionId, getRecentTypes, shouldForceSurprise, trackType])

  const handleStartSession = async (timer: TimerMode) => {
    setTimerMode(timer)
    if (timer) setTimeRemaining(timer)
    setIsActive(true)
    setChallengeCount(0)
    setFeaturesExplored([])
    setTypeHistory([])
    setSurpriseInterval(Math.floor(Math.random() * 3) + 4) // 4-6
    sessionStartRef.current = Date.now()
    await fetchChallenge()
  }

  const handleSubmit = async (response: string) => {
    if (!currentChallenge || !sessionId) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/workshop/evaluate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge: currentChallenge,
          response,
          sessionId,
          recentTypes: getRecentTypes(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to evaluate response")
      }

      const data = await res.json()

      setCurrentEvaluation(data.evaluation)
      setShowingFeedback(true)
      setChallengeCount((c) => c + 1)

      // Track explored feature
      setFeaturesExplored((prev) => [
        ...prev,
        {
          featureKey: currentChallenge.featureKey,
          featureName: currentChallenge.featureName,
          correct: data.evaluation.isCorrect,
          challengeType: currentChallenge.type,
        },
      ])

      // Store pre-fetched challenge and track its type
      if (data.nextChallenge) {
        setPrefetchedChallenge(data.nextChallenge)
        trackType(data.nextChallenge)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    if (!currentChallenge || !sessionId) return

    setIsLoadingChallenge(true)
    setError(null)

    try {
      const res = await fetch("/api/workshop/skip", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          featureKey: currentChallenge.featureKey,
          recentTypes: getRecentTypes(),
        }),
      })

      if (!res.ok) throw new Error("Failed to skip")

      const data = await res.json()

      if (data.nextChallenge) {
        setCurrentChallenge(data.nextChallenge)
        trackType(data.nextChallenge)
        setCurrentEvaluation(null)
        setShowingFeedback(false)
      } else {
        setError("No more challenges available right now.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoadingChallenge(false)
    }
  }

  const handleNext = () => {
    if (prefetchedChallenge) {
      setCurrentChallenge(prefetchedChallenge)
      setPrefetchedChallenge(null)
      setCurrentEvaluation(null)
      setShowingFeedback(false)
    } else {
      fetchChallenge()
    }
  }

  const handleEndSession = async () => {
    if (timerRef.current) clearInterval(timerRef.current)

    // Update session duration + proficiency
    if (sessionId && sessionStartRef.current) {
      const durationSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000)
      fetch("/api/sessions", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, durationSeconds }),
      }).catch(() => {})

      // Update proficiency tracker (fire-and-forget)
      fetch(`/api/sessions/${sessionId}/complete`, {
        method: "POST",
        credentials: "include",
      }).catch((err) => console.error("[Workshop] Proficiency update failed:", err))
    }

    setIsActive(false)
    setCurrentChallenge(null)
    setCurrentEvaluation(null)
    setPrefetchedChallenge(null)
    setShowingFeedback(false)
    setTimerMode(null)
    setTimeRemaining(0)
    setSessionId(null)
    sessionStartRef.current = null
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  // ─── Landing View ───

  if (!isActive) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/10 via-background to-accent/10 p-8 border border-border/40">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/20">
                <Wrench className="h-7 w-7 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Workshop</h1>
                {userLevel && (
                  <Badge variant="outline" className="mt-1 text-accent border-accent/30">
                    {userLevel}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-muted-foreground max-w-lg">
              Randomized micro-challenges that target your grammar and vocabulary gaps.
              Each challenge is picked based on what you've seen, what you've struggled with,
              and what's next at your level. Production-based, no multiple choice busy-work.
            </p>

            {/* Session summary from last run */}
            {challengeCount > 0 && (
              <Card className="rounded-xl border-border/40 bg-card/50">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Last session: {challengeCount} challenge{challengeCount !== 1 ? "s" : ""},{" "}
                    {featuresExplored.filter((f) => f.correct).length} correct
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={() => handleStartSession(null)}
                className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 rounded-xl shadow-lg shadow-accent/20"
              >
                <Play className="mr-2 h-4 w-4" />
                Quick Practice
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStartSession(300)}
                className="rounded-xl border-accent/30 hover:bg-accent/10"
              >
                <Timer className="mr-2 h-4 w-4" />
                5 min
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStartSession(600)}
                className="rounded-xl border-accent/30 hover:bg-accent/10"
              >
                <Timer className="mr-2 h-4 w-4" />
                10 min
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Active Session View ───

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-accent" />
          <h2 className="font-semibold">Workshop</h2>
          {userLevel && (
            <Badge variant="outline" className="text-accent border-accent/30">
              {userLevel}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {timerMode && timeRemaining > 0 && (
            <span className="text-sm font-mono text-muted-foreground">
              {formatTime(timeRemaining)}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEndSession}
            className="text-muted-foreground hover:text-destructive"
          >
            <Square className="mr-1.5 h-3.5 w-3.5" />
            End
          </Button>
        </div>
      </div>

      {/* Feature progress bar */}
      <FeatureProgress
        featuresExplored={featuresExplored}
        sessionChallengeCount={challengeCount}
      />

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Main content area */}
      {isLoadingChallenge ? (
        <Card className="rounded-2xl border-border/40 bg-card/50">
          <CardContent className="p-12 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-muted-foreground">Generating challenge...</p>
          </CardContent>
        </Card>
      ) : showingFeedback && currentEvaluation && currentChallenge ? (
        <WorkshopFeedback
          evaluation={currentEvaluation}
          challenge={currentChallenge}
          onNext={handleNext}
        />
      ) : currentChallenge ? (
        <ChallengeCard
          challenge={currentChallenge}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </div>
  )
}
