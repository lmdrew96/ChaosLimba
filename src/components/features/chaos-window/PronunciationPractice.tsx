"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, Square, Play, RotateCcw, Loader2, Volume2 } from "lucide-react"
import { PronunciationResult } from "@/lib/ai/pronunciation"

interface PronunciationPracticeProps {
  targetText: string
  onComplete?: (result: PronunciationResult) => void
}

export function PronunciationPractice({ targetText, onComplete }: PronunciationPracticeProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<PronunciationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setError(null)
      setResult(null)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play()
    }
  }

  const analyzePronunciation = async () => {
    if (!audioBlob) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('expectedText', targetText)
      formData.append('threshold', '0.70')

      const response = await fetch('/api/analyze-pronunciation', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Pronunciation analysis failed')
      }

      const data = await response.json()
      const pronunciationResult: PronunciationResult = data.result

      setResult(pronunciationResult)

      if (onComplete) {
        onComplete(pronunciationResult)
      }
    } catch (err) {
      console.error('Analysis error:', err)
      setError('Failed to analyze pronunciation. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const reset = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setResult(null)
    setError(null)
    audioChunksRef.current = []
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-chart-4'
    if (score >= 0.70) return 'text-chart-3'
    return 'text-destructive'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 0.85) return 'Excellent!'
    if (score >= 0.70) return 'Good!'
    return 'Needs Practice'
  }

  return (
    <Card className="rounded-xl border-accent/20 bg-accent/10">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-accent/20">
            <Volume2 className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">Pronunciation Practice</h4>
            <p className="text-xs text-muted-foreground">Record yourself speaking Romanian</p>
          </div>
        </div>

        {/* Target Text */}
        <div className="p-4 rounded-lg bg-muted/30 mb-4">
          <p className="text-sm text-muted-foreground mb-1">Say this:</p>
          <p className="text-lg font-medium italic">{targetText}</p>
        </div>

        {/* Recording Controls */}
        <div className="space-y-3">
          {!audioBlob ? (
            <div className="flex gap-2">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="flex-1 bg-accent hover:bg-accent/80 rounded-xl"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="flex-1 bg-destructive hover:bg-destructive/80 rounded-xl animate-pulse"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop Recording
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Playback & Analysis */}
              <div className="flex gap-2">
                <Button
                  onClick={playRecording}
                  variant="outline"
                  className="border-accent/30"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Play
                </Button>
                <Button
                  onClick={analyzePronunciation}
                  disabled={isAnalyzing}
                  className="flex-1 bg-accent hover:bg-accent/80 rounded-xl"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Volume2 className="mr-2 h-4 w-4" />
                      Analyze Pronunciation
                    </>
                  )}
                </Button>
                <Button
                  onClick={reset}
                  variant="outline"
                  className="border-destructive/30"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Results */}
              {result && (
                <div className="p-4 rounded-lg bg-muted/50 border border-accent/20 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">You said:</p>
                    <p className="text-base font-medium italic">{result.transcribedText || "Unable to transcribe"}</p>
                  </div>

                  {result.pronunciationScore !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Pronunciation Score:</span>
                        <span className={`text-xl font-bold ${getScoreColor(result.pronunciationScore)}`}>
                          {(result.pronunciationScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Accuracy:</span>
                        <span className={`text-sm font-semibold ${getScoreColor(result.pronunciationScore)}`}>
                          {getScoreLabel(result.pronunciationScore)}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            result.pronunciationScore >= 0.85
                              ? 'bg-chart-4'
                              : result.pronunciationScore >= 0.70
                              ? 'bg-chart-3'
                              : 'bg-destructive'
                          }`}
                          style={{ width: `${result.pronunciationScore * 100}%` }}
                        />
                      </div>

                      {!result.isAccurate && (
                        <p className="text-xs text-muted-foreground">
                          💡 Tip: Listen to the target text and try again!
                        </p>
                      )}
                    </div>
                  )}

                  {result.fallbackUsed && (
                    <p className="text-xs text-chart-3">
                      ⚠️ Analysis service unavailable. Using fallback.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
