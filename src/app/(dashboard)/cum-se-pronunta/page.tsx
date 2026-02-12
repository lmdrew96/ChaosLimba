"use client"

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Speech,
  Volume2,
  Loader2,
  RotateCcw,
  Gauge,
  AlertCircle,
} from "lucide-react"

type PairData = { stress: string; meaning: string; example: string }

export default function CumSePronuntaPage() {
  const [targetText, setTargetText] = useState("")
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speechRate, setSpeechRate] = useState<number>(1.0)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<{ used: number; remaining: number; dailyLimit: number } | null>(null)

  // DB-fetched content
  const [suggestedWords, setSuggestedWords] = useState<string[]>([])
  const [minimalPairsData, setMinimalPairsData] = useState<Record<string, PairData[]>>({})
  const [isLoadingContent, setIsLoadingContent] = useState(true)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Cache: text+speed → blob URL
  const audioCacheRef = useRef<Map<string, string>>(new Map())

  // Fetch suggested words and usage on mount
  useEffect(() => {
    fetchUsage()
    fetchSuggestedWords()
  }, [])

  async function fetchSuggestedWords() {
    try {
      const res = await fetch("/api/pronunciation/suggested-words")
      if (res.ok) {
        const data = await res.json()
        setSuggestedWords(data.words)
        setMinimalPairsData(data.pairs)
      }
    } catch {
      // Non-critical: suggested words just won't show
    } finally {
      setIsLoadingContent(false)
    }
  }

  async function fetchUsage() {
    try {
      const res = await fetch("/api/tts")
      if (res.ok) {
        const data = await res.json()
        setUsage(data)
      }
    } catch {
      // Silently fail — usage display is non-critical
    }
  }

  const playAudio = useCallback(
    async (text: string, speed: number) => {
      const trimmed = text.trim()
      if (!trimmed) return

      setError(null)

      // Check cache
      const cacheKey = `${trimmed}:${speed}`
      const cachedUrl = audioCacheRef.current.get(cacheKey)

      if (cachedUrl) {
        playFromUrl(cachedUrl)
        return
      }

      // Check if over limit
      if (usage && usage.remaining <= 0) {
        setError("Daily limit reached. Come back tomorrow!")
        return
      }

      setIsLoading(true)

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed, speed }),
        })

        if (res.status === 429) {
          const data = await res.json()
          setUsage({
            used: data.used,
            remaining: data.remaining,
            dailyLimit: data.dailyLimit,
          })
          setError("Daily limit reached. Come back tomorrow!")
          return
        }

        if (!res.ok) {
          throw new Error(await res.text())
        }

        // Update usage from headers
        const used = res.headers.get("X-TTS-Characters-Used")
        const remaining = res.headers.get("X-TTS-Characters-Remaining")
        const limit = res.headers.get("X-TTS-Daily-Limit")
        if (used && remaining && limit) {
          setUsage({
            used: Number(used),
            remaining: Number(remaining),
            dailyLimit: Number(limit),
          })
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        audioCacheRef.current.set(cacheKey, url)

        playFromUrl(url)
      } catch {
        // Error handled via state
        setError("Nu am putut genera audio. Încearcă din nou.")
      } finally {
        setIsLoading(false)
      }
    },
    [usage]
  )

  function playFromUrl(url: string) {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    const audio = new Audio(url)
    audioRef.current = audio

    audio.onplay = () => setIsPlaying(true)
    audio.onended = () => setIsPlaying(false)
    audio.onpause = () => setIsPlaying(false)
    audio.onerror = () => {
      setIsPlaying(false)
      setError("Playback error")
    }

    audio.play()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text) return
    setTargetText(text)
    playAudio(text, speechRate)
  }

  function handleSuggestedWord(word: string) {
    setInputValue(word)
    setTargetText(word)
    playAudio(word, speechRate)
  }

  function handleRepeat() {
    if (targetText) {
      playAudio(targetText, speechRate)
    }
  }

  function toggleSpeed() {
    const newSpeed = speechRate === 1.0 ? 0.75 : 1.0
    setSpeechRate(newSpeed)
    // If there's a target text, replay at new speed
    if (targetText) {
      playAudio(targetText, newSpeed)
    }
  }

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      audioCacheRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const minimalPairs = targetText ? minimalPairsData[targetText.toLowerCase()] : null
  const limitReached = usage ? usage.remaining <= 0 : false

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Speech className="h-7 w-7 text-accent" />
          Cum se pronunță?
        </h1>
        <p className="text-muted-foreground">
          Listen to Romanian pronunciation powered by ElevenLabs
        </p>
      </div>

      {/* Input */}
      <Card className="rounded-2xl border-border">
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a Romanian word or phrase..."
              maxLength={200}
              autoFocus
              disabled={limitReached}
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim() || limitReached}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Suggested words */}
          {suggestedWords.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                Try these stress minimal pairs
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedWords.map((word) => (
                  <button
                    key={word}
                    onClick={() => handleSuggestedWord(word)}
                    disabled={isLoading || limitReached}
                    className="px-3 py-1 rounded-full bg-muted text-sm text-foreground hover:bg-accent/20 transition-colors disabled:opacity-50"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}
          {isLoadingContent && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading suggested words...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Playback area */}
      {targetText && (
        <Card className="rounded-2xl border-border bg-gradient-to-br from-accent/10 via-background to-primary/10">
          <CardContent className="pt-6 space-y-4">
            {/* Display word */}
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-foreground">{targetText}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSpeed}
                className="gap-1.5"
              >
                <Gauge className="h-4 w-4" />
                {speechRate === 1.0 ? "Normal" : "Slow"}
              </Button>

              <Button
                onClick={handleRepeat}
                disabled={isLoading || limitReached}
                size="lg"
                className="gap-2 rounded-full px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Volume2 className="h-5 w-5 animate-pulse" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
                Ascultă
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRepeat}
                disabled={isLoading || limitReached}
                className="gap-1.5"
              >
                <RotateCcw className="h-4 w-4" />
                Repeat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Minimal pairs */}
      {minimalPairs && (
        <Card className="rounded-2xl border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Stress changes meaning!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {minimalPairs.map((pair) => (
              <div
                key={pair.stress}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/50"
              >
                <span className="font-mono text-sm font-bold text-primary whitespace-nowrap">
                  {pair.stress}
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{pair.meaning}</p>
                  <p className="text-xs text-muted-foreground italic">
                    {pair.example}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Usage indicator */}
      {usage && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {usage.used.toLocaleString()} / {usage.dailyLimit.toLocaleString()} characters used today
            {limitReached && (
              <span className="text-destructive ml-1">(limit reached)</span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
