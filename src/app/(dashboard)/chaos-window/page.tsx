"use client"

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react"
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
  Mic,
  PenLine,
  Square,
  Volume2,
  Loader2,
  FileText,
  Video,
} from "lucide-react"
import { AIResponse } from "@/components/features/chaos-window/AIResponse"
import { ConversationHistory, ConversationMessage } from "@/components/features/chaos-window/ConversationHistory"
import { SessionSummaryModal } from "@/components/features/chaos-window/SessionSummaryModal"
import { TutorResponse, InitialQuestion } from "@/lib/ai/tutor"
import { ContentItem } from "@/lib/db/schema"

type Modality = "text" | "speech"

// Content type icons
const ContentTypeIcon = {
  video: Video,
  audio: Headphones,
  text: FileText,
}

// ADHD-friendly, relatable loading messages for transcript fetching
function getTranscriptLoadingMessage(contentType?: 'video' | 'audio' | 'text'): string {
  if (contentType === 'video') {
    const messages = [
      "Fetching transcript... (this may take up to 60 seconds)",
      "Wrangling those YouTube captions or extracting audio...",
      "Getting transcript - trying captions first, then audio...",
      "Loading transcript via captions or audio fallback...",
      "Asking YouTube for captions (or extracting audio if needed)...",
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  } else if (contentType === 'audio') {
    const messages = [
      "Asking Groq to transcribe this audio magic...",
      "Running Whisper on this audio... (it's free! 🎉)",
      "Converting Romanian speech to text...",
      "Transcribing audio with AI wizardry...",
      "Groq Whisper is listening... 👂",
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  } else {
    return "Loading transcript..."
  }
}

export default function ChaosWindowPage() {
  const [isActive, setIsActive] = useState(false)
  const [modality, setModality] = useState<Modality>("text")
  const [response, setResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // AI Response state
  const [currentAIResponse, setCurrentAIResponse] = useState<TutorResponse | null>(null)
  const [currentGradingReport, setCurrentGradingReport] = useState<any>(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([])
  // AI context (internal - used by LLM for understanding content)
  const [currentContext, setCurrentContext] = useState("")

  // AI tutor prompt (user-facing - the question displayed to user)
  const [tutorPrompt, setTutorPrompt] = useState<string | null>(null)
  const [tutorHint, setTutorHint] = useState<string | null>(null)
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false)

  // Random content state
  const [currentContent, setCurrentContent] = useState<ContentItem | null>(null)
  const [userLevel, setUserLevel] = useState<string>("B1")
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)

  // Transcript fetching state
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false)
  const [transcriptError, setTranscriptError] = useState<string | null>(null)

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [errorPatterns, setErrorPatterns] = useState<string[]>([])
  const [showSummary, setShowSummary] = useState(false)
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null)
  const [completedDuration, setCompletedDuration] = useState(0)
  const [completedInteractionCount, setCompletedInteractionCount] = useState(0)

  const startSession = async () => {
    try {
      if (sessionId) return // Session already active

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType: "chaos_window",
          contentId: currentContent?.id
        })
      })

      if (res.ok) {
        const data = await res.json()
        setSessionId(data.session.id)
        setSessionStartTime(new Date().getTime())
      } else {
        console.error("Failed to start session")
      }
    } catch (err) {
      console.error("Error starting session:", err)
    }
  }

  const endSession = async () => {
    try {
      if (!sessionId) return

      const durationSeconds = sessionStartTime
        ? Math.floor((new Date().getTime() - sessionStartTime) / 1000)
        : 0 // fallback if sessionStartTime not set

      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          durationSeconds
        })
      })

      // Update proficiency tracker based on session performance
      try {
        await fetch(`/api/sessions/${sessionId}/complete`, {
          method: "POST"
        })
      } catch (proficiencyError) {
        console.error("Failed to update proficiency:", proficiencyError)
        // Continue even if proficiency update fails - not critical for UX
      }

      // Save stats for summary modal
      setCompletedSessionId(sessionId)
      setCompletedDuration(durationSeconds)
      setCompletedInteractionCount(Math.floor(conversationHistory.length / 2))

      // Clear session state
      setSessionId(null)
      setSessionStartTime(null)

      // Show summary modal
      setShowSummary(true)
    } catch (err) {
      console.error("Error ending session:", err)
    }
  }

  // Fetch error patterns from Error Garden
  const fetchErrorPatterns = async () => {
    try {
      const res = await fetch('/api/errors/patterns')
      if (res.ok) {
        const data = await res.json()
        // Extract top 3 fossilizing patterns for AI to target
        const patterns = data.patterns
          .filter((p: any) => p.isFossilizing)
          .slice(0, 3)
          .map((p: any) => `${p.errorType}: ${p.category}`)
        setErrorPatterns(patterns)
      }
    } catch (err) {
      console.error('Failed to fetch error patterns:', err)
    }
  }

  // Fetch initial AI tutor question for current content
  const fetchInitialQuestion = useCallback(async (
    content: ContentItem,
    transcript: string | null
  ) => {
    setIsLoadingQuestion(true)
    setTutorPrompt(null)
    setTutorHint(null)

    try {
      console.log(`[Chaos Window] Generating initial question for: "${content.title}"`)

      const res = await fetch('/api/chaos-window/initial-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentTitle: content.title,
          contentTranscript: transcript || content.textContent || null,
          contentType: content.type,
          errorPatterns: errorPatterns
        })
      })

      if (!res.ok) {
        throw new Error('Failed to generate initial question')
      }

      const data = await res.json()
      const question: InitialQuestion = data.question

      setTutorPrompt(question.question)
      setTutorHint(question.hint || null)

      console.log(`[Chaos Window] Initial question set: "${question.question}"`)
    } catch (err) {
      console.error('[Chaos Window] Failed to generate initial question:', err)
      // Fallback to a generic question based on content type
      const fallback = {
        video: 'Ce ai înțeles din acest videoclip? Povestește-mi în câteva propoziții.',
        audio: 'Ce ai auzit în acest audio? Descrie pe scurt conținutul.',
        text: 'Ce ai citit? Spune-mi ideea principală în propriile tale cuvinte.'
      }[content.type] || 'Ce ai înțeles din acest conținut?'
      setTutorPrompt(fallback)
    } finally {
      setIsLoadingQuestion(false)
    }
  }, [errorPatterns])

  // Fetch random content from API
  const fetchRandomContent = useCallback(async (excludeId?: string) => {
    setIsLoadingContent(true)
    setContentError(null)

    try {
      const params = new URLSearchParams()
      if (excludeId) params.set('excludeId', excludeId)

      const res = await fetch(`/api/content/random?${params}`)

      if (!res.ok) {
        if (res.status === 404) {
          setContentError("Nu există conținut disponibil. Adaugă câteva materiale!")
          return
        }
        throw new Error("Failed to fetch content")
      }

      const data = await res.json()
      setCurrentContent(data.content)
      setUserLevel(data.userLevel)

      // Update context with full content (transcript for video/audio, text for text content)
      if (data.content.textContent) {
        // Text content: use first 300 chars
        const textContent = data.content.textContent;
        setCurrentContext(textContent.slice(0, 300) + (textContent.length > 300 ? "..." : ""))
      } else if (data.content.transcript) {
        // Video/Audio with transcript: use full transcript (or first 2000 chars for very long content)
        const transcript = data.content.transcript;

        if (transcript.length > 2000) {
          // Truncate very long transcripts to fit LLM context window
          setCurrentContext(transcript.slice(0, 2000) + "\n\n[Transcript continues, full context available to AI...]")
        } else {
          setCurrentContext(transcript)
        }
      } else {
        // Fallback: No transcript available, use title only
        setCurrentContext(`Ascultă/Privește: "${data.content.title}" și răspunde la întrebări. [Note: Full transcript not available]`)
      }

      // Generate initial AI tutor question for this content
      const transcriptForQuestion = data.content.transcript || data.content.textContent || null
      fetchInitialQuestion(data.content, transcriptForQuestion)

      // Check if we need to fetch transcript on-demand
      if (!data.content.textContent && !data.content.transcript) {

        // Video/Audio without transcript - fetch it!
        if (data.content.type === 'video' || data.content.type === 'audio') {
          console.log(`[Chaos Window] Content missing transcript, fetching on-demand...`)
          // Don't await - let it load in background
          fetchTranscript(data.content.id)
        }
      }
    } catch (err) {
      console.error("Failed to fetch random content:", err)
      setContentError("Nu am putut încărca conținutul. Încearcă din nou.")
    } finally {
      setIsLoadingContent(false)
    }
  }, [])

  // Fetch transcript on-demand for content that doesn't have it cached
  const fetchTranscript = useCallback(async (contentId: string) => {
    setIsLoadingTranscript(true)
    setTranscriptError(null)

    try {
      console.log(`[Chaos Window] Fetching transcript for content ${contentId}`)
      const res = await fetch(`/api/content/transcript/${contentId}`)

      if (!res.ok) {
        // 404 = No transcript available (not a fatal error)
        if (res.status === 404) {
          console.log(`[Chaos Window] No transcript available for ${contentId}`)
          setTranscriptError("Transcript unavailable")
          return
        }
        throw new Error("Failed to fetch transcript")
      }

      const data = await res.json()
      const transcript = data.transcript

      // Update context with newly fetched transcript
      if (transcript) {
        if (transcript.length > 2000) {
          setCurrentContext(transcript.slice(0, 2000) + "\n\n[Transcript continues, full context available to AI...]")
        } else {
          setCurrentContext(transcript)
        }

        // Update currentContent to include transcript (avoid re-fetch on next render)
        setCurrentContent(prev => prev?.id === contentId ? { ...prev, transcript } : prev)

        // Re-generate AI question now that we have the transcript
        if (currentContent && currentContent.id === contentId) {
          console.log(`[Chaos Window] Regenerating question with new transcript...`)
          fetchInitialQuestion(currentContent, transcript)
        }

        console.log(`[Chaos Window] Transcript fetched successfully (${transcript.length} chars)`)
      }
    } catch (err) {
      console.error("[Chaos Window] Failed to fetch transcript:", err)
      setTranscriptError("Couldn't load transcript - using title only")
    } finally {
      setIsLoadingTranscript(false)
    }
  }, [])

  // Fetch content when session starts
  useEffect(() => {
    if (isActive && !currentContent) {
      fetchRandomContent()
    }
  }, [isActive, currentContent, fetchRandomContent])

  // Fetch error patterns when session starts
  useEffect(() => {
    if (sessionId && errorPatterns.length === 0) {
      fetchErrorPatterns()
    }
  }, [sessionId])

  const handleStartSession = () => {
    setIsActive(true)
    startSession()
  }

  const handleEndSession = () => {
    endSession()
    setIsActive(false)
  }

  // Audio recording handlers
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

  const resetRecording = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    audioChunksRef.current = []
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Validate based on modality
    if (modality === "text") {
      const trimmed = response.trim()
      if (trimmed.length < 5) {
        setError("Răspunsul trebuie să aibă cel puțin 5 caractere.")
        return
      }
    } else {
      // Speech mode
      if (!audioBlob) {
        setError("Înregistrează un răspuns audio mai întâi.")
        return
      }
    }

    setError(null)
    setIsSubmitting(true)
    setIsLoadingAI(true)

    // Add user message to conversation history
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: "user",
      content: modality === "text" ? response.trim() : "🎤 [Audio Response]",
      timestamp: new Date()
    }
    setConversationHistory(prev => [...prev, userMessage])

    try {
      let res: Response

      if (modality === "text") {
        // Text submission (existing flow)
        res = await fetch("/api/chaos-window/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userResponse: response.trim(),
            context: currentContext,
            errorPatterns: errorPatterns,
            sessionId: sessionId || "demo-session",
            modality: "text"
          })
        })
      } else {
        // Speech submission (new flow)
        const formData = new FormData()
        formData.append('audio', audioBlob!, 'response.webm')
        formData.append('context', currentContext)
        formData.append('sessionId', sessionId || 'demo-session')
        formData.append('modality', 'speech')
        formData.append('errorPatterns', JSON.stringify(errorPatterns))

        res = await fetch("/api/chaos-window/submit", {
          method: "POST",
          body: formData
        })
      }

      if (!res.ok) {
        throw new Error("AI response failed")
      }

      const data = await res.json()
      const aiResponse: TutorResponse = data.response
      const gradingReport = data.gradingReport

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
      setCurrentGradingReport(gradingReport)

      // Reset input based on modality
      if (modality === "text") {
        setResponse("")
      } else {
        resetRecording()
      }

      // Update tutor prompt with next question (user-facing)
      if (aiResponse.nextQuestion) {
        setTutorPrompt(aiResponse.nextQuestion)
        setTutorHint(null) // Clear previous hint
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
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-pink-500 animate-pulse" />
            <CardTitle>Active Session</CardTitle>
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
                onClick={handleStartSession}
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
                  {isLoadingContent ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 text-orange-400 animate-spin" />
                      <span className="ml-3 text-muted-foreground">Se încarcă conținutul...</span>
                    </div>
                  ) : contentError ? (
                    <div className="text-center py-8">
                      <p className="text-orange-400 mb-4">{contentError}</p>
                      <Button
                        onClick={() => fetchRandomContent()}
                        variant="outline"
                        className="border-orange-500/30"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Încearcă din nou
                      </Button>
                    </div>
                  ) : currentContent ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-orange-500/20">
                          {(() => {
                            const IconComponent = ContentTypeIcon[currentContent.type] || Headphones
                            return <IconComponent className="h-5 w-5 text-orange-400" />
                          })()}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{currentContent.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {currentContent.topic} • {Math.floor((currentContent.durationSeconds || 0) / 60)} min
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                          {userLevel} Level
                        </span>
                      </div>

                      {/* Content Display based on type */}
                      {currentContent.type === 'text' && currentContent.textContent && (
                        <div className="p-4 rounded-lg bg-muted/30 italic text-muted-foreground mb-4 max-h-32 overflow-y-auto">
                          "{currentContent.textContent.slice(0, 500)}{currentContent.textContent.length > 500 ? '...' : ''}"
                        </div>
                      )}

                      {currentContent.type === 'video' && currentContent.youtubeId && (
                        <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-black/50">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${currentContent.youtubeId}${currentContent.startTime ? `?start=${currentContent.startTime}` : ''}`}
                            title={currentContent.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}

                      {currentContent.type === 'audio' && currentContent.audioUrl && (
                        <div className="p-4 rounded-lg bg-muted/30 mb-4">
                          <audio controls className="w-full" src={currentContent.audioUrl}>
                            Your browser does not support audio playback.
                          </audio>
                        </div>
                      )}

                      {/* Transcript Loading Indicator */}
                      {isLoadingTranscript && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 mb-4">
                          <Loader2 className="h-4 w-4 text-orange-400 animate-spin flex-shrink-0" />
                          <span className="text-sm text-orange-200">
                            {getTranscriptLoadingMessage(currentContent?.type)}
                          </span>
                        </div>
                      )}

                      {/* Transcript Error (non-blocking) */}
                      {transcriptError && !isLoadingTranscript && (
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/40 mb-4">
                          <p className="text-xs text-muted-foreground">
                            📝 {transcriptError} - AI tutor will work with title only
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-orange-500/30"
                          onClick={() => fetchRandomContent(currentContent.id)}
                        >
                          <Shuffle className="h-4 w-4 mr-1" />
                          Next
                        </Button>
                        {currentContent.culturalNotes && (
                          <Button size="sm" variant="outline" className="border-orange-500/30">
                            📝 Cultural Notes
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Se încarcă conținutul...
                    </div>
                  )}
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

                  {/* Show AI-generated question (not raw transcript!) */}
                  {isLoadingQuestion ? (
                    <div className="p-4 rounded-lg bg-muted/30 mb-4 flex items-center gap-3">
                      <Loader2 className="h-5 w-5 text-purple-400 animate-spin flex-shrink-0" />
                      <span className="text-muted-foreground">Generating a question...</span>
                    </div>
                  ) : tutorPrompt ? (
                    <div className="space-y-2 mb-4">
                      <div className="p-4 rounded-lg bg-muted/30 text-foreground">
                        {tutorPrompt}
                      </div>
                      {tutorHint && (
                        <p className="text-xs text-muted-foreground px-1">
                          💡 Hint: {tutorHint}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-muted/30 italic text-muted-foreground mb-4">
                      Watch/listen to the content above, then answer the question that appears here.
                    </div>
                  )}

                  {/* Modality Toggle */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant={modality === "text" ? "default" : "outline"}
                      className={modality === "text"
                        ? "flex-1 bg-purple-600 hover:bg-purple-700"
                        : "flex-1 border-purple-500/30"
                      }
                      onClick={() => {
                        setModality("text")
                        resetRecording()
                      }}
                      disabled={isSubmitting}
                    >
                      <PenLine className="mr-2 h-4 w-4" />
                      Text
                    </Button>
                    <Button
                      type="button"
                      variant={modality === "speech" ? "default" : "outline"}
                      className={modality === "speech"
                        ? "flex-1 bg-blue-600 hover:bg-blue-700"
                        : "flex-1 border-blue-500/30"
                      }
                      onClick={() => {
                        setModality("speech")
                        setResponse("")
                      }}
                      disabled={isSubmitting}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Speech
                    </Button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {modality === "text" ? (
                      <>
                        {/* Text Input Mode */}
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
                      </>
                    ) : (
                      <>
                        {/* Speech Input Mode */}
                        <div className="space-y-3">
                          {!audioBlob ? (
                            <div className="flex gap-2">
                              {!isRecording ? (
                                <Button
                                  type="button"
                                  onClick={startRecording}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl"
                                  disabled={isSubmitting}
                                >
                                  <Mic className="mr-2 h-4 w-4" />
                                  Start Recording
                                </Button>
                              ) : (
                                <Button
                                  type="button"
                                  onClick={stopRecording}
                                  className="flex-1 bg-red-600 hover:bg-red-700 rounded-xl animate-pulse"
                                >
                                  <Square className="mr-2 h-4 w-4" />
                                  Stop Recording
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 rounded-lg bg-muted/30 border border-blue-500/20 flex items-center gap-3">
                              <div className="flex-1 flex items-center gap-2">
                                <Volume2 className="h-4 w-4 text-blue-400" />
                                <span className="text-sm">Audio recorded</span>
                              </div>
                              <Button
                                type="button"
                                onClick={playRecording}
                                variant="outline"
                                size="sm"
                                className="border-blue-500/30"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Play
                              </Button>
                              <Button
                                type="button"
                                onClick={resetRecording}
                                variant="outline"
                                size="sm"
                                className="border-orange-500/30"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {error && (
                            <div className="text-sm text-red-400">{error}</div>
                          )}
                        </div>
                      </>
                    )}

                    <Button
                      type="submit"
                      className={modality === "text"
                        ? "bg-purple-600 hover:bg-purple-700 rounded-xl w-full"
                        : "bg-blue-600 hover:bg-blue-700 rounded-xl w-full"
                      }
                      disabled={isSubmitting || (modality === "text" ? response.trim().length < 5 : !audioBlob)}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Se trimite...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Response
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* AI Response Display */}
              {isLoadingAI && (
                <AIResponse isLoading={true} />
              )}

              {currentAIResponse && !isLoadingAI && (
                <AIResponse
                  response={currentAIResponse}
                  gradingReport={currentGradingReport}
                />
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
                <Button
                  variant="outline"
                  className="border-orange-500/30"
                  onClick={() => fetchRandomContent(currentContent?.id)}
                  disabled={isLoadingContent}
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Next Random Content
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEndSession}
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

      {/* Session Summary Modal */}
      <SessionSummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        onNewSession={() => {
          setShowSummary(false)
          // Reset for new session
          setResponse("")
          setConversationHistory([])
          setCurrentAIResponse(null)
          setCurrentGradingReport(null)
          setErrorPatterns([])
          fetchRandomContent()
        }}
        sessionId={completedSessionId}
        duration={completedDuration}
        interactionCount={completedInteractionCount}
      />
    </div>
  )
}
