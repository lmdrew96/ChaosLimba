"use client"

import { useState, useEffect, type FormEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Shuffle,
  Send,
  Headphones,
  MessageSquare,
} from "lucide-react"
import { AIResponse } from "@/components/features/chaos-window/AIResponse"
import { ConversationHistory, ConversationMessage } from "@/components/features/chaos-window/ConversationHistory"
import { TutorResponse } from "@/lib/ai/tutor"

export default function ChaosWindowPage() {
  const [isActive, setIsActive] = useState(false)
  const [timer, setTimer] = useState(300)
  const [response, setResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // AI Response state
  const [currentAIResponse, setCurrentAIResponse] = useState<TutorResponse | null>(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([])
  const [currentContext, setCurrentContext] = useState(
    "...și atunci mi-am dat seama că trebuie să iau o decizie. Era imposibil să rămân în situația aceea pentru totdeauna..."
  )

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timer])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const resetTimer = () => {
    setTimer(300)
    setIsActive(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = response.trim()

    if (trimmed.length < 5) {
      setError("Răspunsul trebuie să aibă cel puțin 5 caractere.")
      return
    }

    setError(null)
    setIsSubmitting(true)
    setIsLoadingAI(true)

    // Add user message to conversation history
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: "user",
      content: trimmed,
      timestamp: new Date()
    }
    setConversationHistory(prev => [...prev, userMessage])

    try {
      // Call AI API
      const res = await fetch("/api/chaos-window/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userResponse: trimmed,
          context: currentContext,
          errorPatterns: [], // TODO: Get from Error Garden
          sessionId: "demo-session" // TODO: Real session management
        })
      })

      if (!res.ok) {
        throw new Error("AI response failed")
      }

      const data = await res.json()
      const aiResponse: TutorResponse = data.response

      // Add AI message to conversation history
      const aiMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiResponse.feedback.overall,
        timestamp: new Date(),
        aiResponse
      }
      
      setConversationHistory(prev => [...prev, aiMessage])
      setCurrentAIResponse(aiResponse)
      setResponse("")
      
      // Update context if there's a next question
      if (aiResponse.nextQuestion) {
        setCurrentContext(aiResponse.nextQuestion)
      }

    } catch (submitError) {
      console.error("Failed to submit response", submitError)
      setError("Nu am putut trimite răspunsul. Încearcă din nou.")
    } finally {
      setIsSubmitting(false)
      setIsLoadingAI(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-pink-400" />
          Chaos Window
        </h1>
        <p className="text-muted-foreground">
          Randomized, targeted content with AI tutoring for real-time
          interaction
        </p>
      </div>

      <Card className="rounded-2xl border-pink-500/20 bg-gradient-to-br from-pink-500/10 via-background to-orange-500/5 overflow-hidden">
        <CardHeader className="border-b border-pink-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-pink-500 animate-pulse" />
              <CardTitle>Active Session</CardTitle>
            </div>
            <div className="text-4xl font-mono font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
              {formatTime(timer)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {!isActive ? (
            <div className="text-center py-12">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full blur-2xl opacity-30 animate-pulse" />
                <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-pink-500/20 to-orange-500/20 flex items-center justify-center border-2 border-pink-500/30">
                  <Sparkles className="h-12 w-12 text-pink-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Ready for some chaos?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start a session to receive randomized content at your level and
                practice with AI tutoring
              </p>
              <Button
                size="lg"
                onClick={() => setIsActive(true)}
                className="bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 rounded-xl px-8 shadow-lg shadow-pink-500/20"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Chaos Session
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="rounded-xl border-orange-500/20 bg-black/20">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                      <Headphones className="h-5 w-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Random Content: Podcast Clip</h4>
                      <p className="text-xs text-muted-foreground">
                        At your level (B1)
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                      B1 Level
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 italic text-muted-foreground mb-4">
                    "...și atunci mi-am dat seama că trebuie să iau o decizie.
                    Era imposibil să rămân în situația aceea pentru
                    totdeauna..."
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-orange-500/30">
                      <Play className="h-4 w-4 mr-1" /> Play
                    </Button>
                    <Button size="sm" variant="outline" className="border-orange-500/30">
                      <RotateCcw className="h-4 w-4 mr-1" /> Replay
                    </Button>
                    <Button size="sm" variant="outline" className="border-orange-500/30">
                      📝 Transcript
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-violet-500/5">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <MessageSquare className="h-5 w-5 text-purple-400" />
                    </div>
                    <h4 className="font-medium">AI Tutor</h4>
                  </div>
                  
                  {/* Show current context/question */}
                  <div className="p-4 rounded-lg bg-muted/30 italic text-muted-foreground mb-4">
                    {currentContext}
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      className="w-full h-24 rounded-xl bg-background border border-purple-500/30 p-4 focus:ring-2 focus:ring-purple-500/30 focus:outline-none resize-none"
                      placeholder="Răspunde aici..."
                      disabled={isSubmitting}
                      aria-invalid={!!error}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Minim 5 caractere</span>
                      {error && <span className="text-red-400">{error}</span>}
                    </div>
                    <Button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 rounded-xl"
                      disabled={isSubmitting}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Se trimite..." : "Submit Response"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* AI Response Display */}
              {isLoadingAI && (
                <AIResponse isLoading={true} />
              )}
              
              {currentAIResponse && !isLoadingAI && (
                <AIResponse response={currentAIResponse} />
              )}

              {/* Conversation History */}
              {conversationHistory.length > 1 && (
                <Card className="rounded-xl border-border/40">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-400" />
                      Conversation History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ConversationHistory messages={conversationHistory.slice(-3)} />
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setIsActive(!isActive)}
                  className="border-pink-500/30"
                >
                  {isActive ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" /> Resume
                    </>
                  )}
                </Button>
                <Button variant="outline" className="border-orange-500/30">
                  <Shuffle className="mr-2 h-4 w-4" />
                  Next Random Content
                </Button>
                <Button
                  variant="outline"
                  onClick={resetTimer}
                  className="border-red-500/30 text-red-400 hover:text-red-300"
                >
                  End Session
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-xl border-border/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-pink-400" />
              How Chaos Window Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Randomized content selection (video, audio, text)</p>
            <p>• Content is at or slightly above your level</p>
            <p>• AI tutor asks targeted questions based on your Error Garden</p>
            <p>• Timed sessions encourage focused engagement</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              🎯 Key Differences from Deep Fog
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <strong>Chaos Window:</strong> At/above level with AI interaction
            </p>
            <p className="flex items-center gap-2">
              <span className="text-blue-400">✓</span>
              <strong>Deep Fog:</strong> Above level, passive immersion
            </p>
            <p className="flex items-center gap-2">
              <span className="text-purple-400">✓</span>
              Uses Error Garden data to target weaknesses
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
