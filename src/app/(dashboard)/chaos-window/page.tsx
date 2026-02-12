"use client"

import { useState, useEffect, useRef, useCallback, type FormEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Atom,
  Play,
  RotateCcw,
  Shuffle,
  Headphones,
  Volume2,
  Loader2,
  FileText,
  Square,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { GradingReport } from "@/components/features/chaos-window/AIResponse"
import { ConversationMessage } from "@/components/features/chaos-window/ConversationHistory"
import { ChaosChat } from "@/components/features/chaos-window/ChaosChat"
import { SessionSummaryModal } from "@/components/features/chaos-window/SessionSummaryModal"
import { TutorResponse, InitialQuestion } from "@/lib/ai/tutor"
import { ContentItem } from "@/lib/db/schema"
import { AudioPlayer } from "@/components/features/content-player/AudioPlayer"
import { PronunciationPractice } from "@/components/features/chaos-window/PronunciationPractice"
import { PronunciationResult } from "@/lib/ai/pronunciation"
import type { FossilizationAlert } from "@/lib/ai/adaptation"

type Modality = "text" | "speech"

// Content type icons
const ContentTypeIcon = {
  audio: Headphones,
  text: FileText,
}

// ADHD-friendly, relatable loading messages for transcript fetching
function getTranscriptLoadingMessage(contentType?: 'audio' | 'text'): string {
  if (contentType === 'audio') {
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
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [gradingReports, setGradingReports] = useState<Map<string, GradingReport>>(new Map())
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

  // Transcript toggle state (for text content — audio uses AudioPlayer's built-in toggle)
  const [showTextTranscript, setShowTextTranscript] = useState(false)

  // Smart Chaos: feature targeting state
  const [targetFeatures, setTargetFeatures] = useState<Array<{ featureKey: string; featureName: string; description: string }>>([])
  const [selectionReason, setSelectionReason] = useState<string | null>(null)
  const [isFirstSession, setIsFirstSession] = useState(false)
  const [discoveryToast, setDiscoveryToast] = useState<string | null>(null)

  // Fossilization alerts state (tier 2+ from adaptation engine)
  const [fossilizationAlerts, setFossilizationAlerts] = useState<FossilizationAlert[]>([])

  // Session elapsed timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Recent session stats for landing page
  const [recentSession, setRecentSession] = useState<{ duration: number; interactions: number } | null>(null)

  // Practice audio generation state
  const [practiceAudio, setPracticeAudio] = useState<{
    audioUrl: string; romanianText: string; englishText: string | null; contentType: string
  } | null>(null)
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false)
  const [practiceError, setPracticeError] = useState<string | null>(null)
  const practiceAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isPracticePlaying, setIsPracticePlaying] = useState(false)
  const [showCulturalNotes, setShowCulturalNotes] = useState(false)

  // Elapsed timer tick
  useEffect(() => {
    if (isActive && sessionStartTime) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000))
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, sessionStartTime])

  // Fetch user level + recent session on mount
  useEffect(() => {
    fetch("/api/user/preferences", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.preferences?.languageLevel) {
          setUserLevel(data.preferences.languageLevel)
        }
      })
      .catch(() => {})

    fetch("/api/sessions?type=chaos_window&limit=1", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.sessions?.[0]?.durationSeconds) {
          setRecentSession({
            duration: data.sessions[0].durationSeconds,
            interactions: 0, // Not tracked in session table
          })
        }
      })
      .catch(() => {})
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const startSession = async () => {
    try {
      if (sessionId) return // Session already active

      const res = await fetch("/api/sessions", {
        method: "POST",
        credentials: "include",
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
      }
    } catch (err) {
      // Session start failed silently — user can retry
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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          durationSeconds
        })
      })

      // Update proficiency tracker based on session performance
      try {
        await fetch(`/api/sessions/${sessionId}/complete`, {
          method: "POST",
          credentials: "include",
        })
      } catch (proficiencyError) {
        // Continue even if proficiency update fails - not critical for UX
      }

      // Trigger background personalized content generation (fire-and-forget)
      fetch('/api/generated-content/background', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {}) // Fire-and-forget

      // Save stats for summary modal
      setCompletedSessionId(sessionId)
      setCompletedDuration(durationSeconds)
      setCompletedInteractionCount(Math.floor(conversationHistory.length / 2))

      // Clear session state
      setSessionId(null)
      setSessionStartTime(null)
      setElapsedSeconds(0)
      if (timerRef.current) clearInterval(timerRef.current)

      // Show summary modal
      setShowSummary(true)
    } catch (err) {
      // Session end failed — data already saved locally
    }
  }

  // Fetch error patterns from Error Garden + build fossilization alerts
  const fetchErrorPatterns = async () => {
    try {
      const res = await fetch('/api/errors/patterns', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        // Extract top 3 fossilizing patterns for AI to target
        const patterns = data.patterns
          .filter((p: any) => p.isFossilizing)
          .slice(0, 3)
          .map((p: any) => `${p.errorType}: ${p.category}`)
        setErrorPatterns(patterns)

        // Build fossilization alerts from tier 2+ patterns (for tutor prompts)
        const alerts: FossilizationAlert[] = data.patterns
          .filter((p: any) => p.tier >= 2)
          .slice(0, 3)
          .map((p: any) => ({
            pattern: `${p.errorType}: ${p.category}`,
            tier: p.tier as 1 | 2 | 3,
            examples: (p.examples || [])
              .filter((e: any) => e.incorrect && e.correct)
              .slice(0, 2)
              .map((e: any) => ({ incorrect: e.incorrect, correct: e.correct })),
          }))
        setFossilizationAlerts(alerts)

      }
    } catch (err) {
      // Error patterns fetch failed — continue without targeting
    }
  }

  // Fetch initial AI tutor question for current content
  const fetchInitialQuestion = useCallback(async (
    content: ContentItem,
    transcript: string | null,
    features: Array<{ featureKey: string; featureName: string; description: string }> = [],
    firstSession: boolean = false
  ) => {
    setIsLoadingQuestion(true)
    setTutorPrompt(null)
    setTutorHint(null)

    try {
      const res = await fetch('/api/chaos-window/initial-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentTitle: content.title,
          contentTranscript: transcript || content.textContent || null,
          contentType: content.type,
          errorPatterns: errorPatterns,
          userLevel: userLevel,
          targetFeatures: features,
          isFirstSession: firstSession,
          fossilizationAlerts: fossilizationAlerts,
        })
      })

      if (!res.ok) {
        throw new Error('Failed to generate initial question')
      }

      const data = await res.json()
      const question: InitialQuestion = data.question

      setTutorPrompt(question.question)
      setTutorHint(question.hint || null)
    } catch (err) {
      // Fallback to a generic question based on content type
      const fallback = {
        audio: 'Ce ai auzit în acest audio? Descrie pe scurt conținutul.',
        text: 'Ce ai citit? Spune-mi ideea principală în propriile tale cuvinte.'
      }[content.type] || 'Ce ai înțeles din acest conținut?'
      setTutorPrompt(fallback)
    } finally {
      setIsLoadingQuestion(false)
    }
  }, [errorPatterns, userLevel, fossilizationAlerts])

  // Fetch transcript on-demand for content that doesn't have it cached
  // Accepts the content object directly to avoid stale closure issues
  const fetchTranscript = useCallback(async (content: ContentItem) => {
    setIsLoadingTranscript(true)
    setTranscriptError(null)

    try {
      const res = await fetch(`/api/content/transcript/${content.id}`, { credentials: "include" })

      if (!res.ok) {
        // 404 = No transcript available (not a fatal error)
        if (res.status === 404) {
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

        // Update currentContent to include transcript (enables AudioPlayer transcript toggle)
        setCurrentContent(prev => prev?.id === content.id ? { ...prev, transcript } : prev)

        // Re-generate AI question now that we have the transcript
        fetchInitialQuestion(content, transcript)
      }
    } catch (err) {
      setTranscriptError("Couldn't load transcript - using title only")
    } finally {
      setIsLoadingTranscript(false)
    }
  }, [fetchInitialQuestion])

  // Fetch random content from API
  const fetchRandomContent = useCallback(async (excludeId?: string) => {
    setIsLoadingContent(true)
    setContentError(null)

    try {
      const params = new URLSearchParams()
      if (excludeId) params.set('excludeId', excludeId)

      const res = await fetch(`/api/content/random?${params}`, { credentials: "include" })

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
      setShowTextTranscript(false)
      setShowCulturalNotes(false)

      // Smart Chaos: store feature targeting metadata
      const features = data.targetFeatures || []
      setTargetFeatures(features)
      setSelectionReason(data.selectionReason || null)
      setIsFirstSession(data.isFirstSession || false)

      // Show discovery toast for new features (subtle dopamine hit)
      if (features.length > 0 && data.selectionReason === 'unseen_feature') {
        const featureNames = features.map((f: { featureName: string }) => f.featureName)
        setDiscoveryToast(`New: ${featureNames[0]}`)
        setTimeout(() => setDiscoveryToast(null), 4000)
      }

      // Update context with full content (transcript for audio, text for text content)
      if (data.content.textContent) {
        // Text content: use first 300 chars
        const textContent = data.content.textContent;
        setCurrentContext(textContent.slice(0, 300) + (textContent.length > 300 ? "..." : ""))
      } else if (data.content.transcript) {
        // Audio with transcript: use full transcript (or first 2000 chars for very long content)
        const transcript = data.content.transcript;

        if (transcript.length > 2000) {
          // Truncate very long transcripts to fit LLM context window
          setCurrentContext(transcript.slice(0, 2000) + "\n\n[Transcript continues, full context available to AI...]")
        } else {
          setCurrentContext(transcript)
        }
      } else {
        // Fallback: No transcript available, use title only
        setCurrentContext(`Ascultă: "${data.content.title}" și răspunde la întrebări. [Note: Full transcript not available]`)
      }

      // Generate initial AI tutor question for this content (with feature targeting)
      const transcriptForQuestion = data.content.transcript || data.content.textContent || null
      fetchInitialQuestion(data.content, transcriptForQuestion, features, data.isFirstSession || false)

      // Check if we need to fetch transcript on-demand
      if (!data.content.textContent && !data.content.transcript) {

        // Audio without transcript - fetch it!
        if (data.content.type === 'audio') {
          // Don't await - let it load in background
          fetchTranscript(data.content as ContentItem)
        }
      }
    } catch (err) {
      setContentError("Nu am putut încărca conținutul. Încearcă din nou.")
    } finally {
      setIsLoadingContent(false)
    }
  }, [fetchInitialQuestion, fetchTranscript])

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

  // Handle pronunciation practice results — log weak scores to Error Garden
  const handlePronunciationResult = useCallback(async (result: PronunciationResult) => {
    if (result.pronunciationScore !== undefined && result.pronunciationScore < 0.70 && sessionId) {
      try {
        await fetch('/api/errors', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            errorType: 'pronunciation',
            source: 'chaos_window',
            category: 'pronunciation_accuracy',
            context: `Target: "${practiceAudio?.romanianText}" | Said: "${result.transcribedText}" | Score: ${(result.pronunciationScore * 100).toFixed(0)}%`,
            sessionId,
            contentId: currentContent?.id || null,
          })
        })
      } catch (err) {
        // Non-critical: error logging failed
      }
    }
  }, [sessionId, practiceAudio?.romanianText, currentContent?.id])

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

  const handleSubmit = async (event: FormEvent) => {
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

    if (!sessionId) {
      setError("Session not ready. Please wait a moment and try again.")
      return
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
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userResponse: response.trim(),
            context: currentContext,
            errorPatterns: errorPatterns,
            sessionId,
            modality: "text",
            userLevel: userLevel,
            contentId: currentContent?.id,
            contentFeatures: (currentContent?.languageFeatures as { grammar?: string[] })?.grammar || [],
            targetFeatures: targetFeatures,
            fossilizationAlerts: fossilizationAlerts,
          })
        })
      } else {
        // Speech submission (new flow)
        const formData = new FormData()
        formData.append('audio', audioBlob!, 'response.webm')
        formData.append('context', currentContext)
        formData.append('sessionId', sessionId)
        formData.append('modality', 'speech')
        formData.append('errorPatterns', JSON.stringify(errorPatterns))
        formData.append('userLevel', userLevel)
        if (currentContent?.id) formData.append('contentId', currentContent.id)
        formData.append('contentFeatures', JSON.stringify((currentContent?.languageFeatures as { grammar?: string[] })?.grammar || []))
        formData.append('targetFeatures', JSON.stringify(targetFeatures))
        formData.append('fossilizationAlerts', JSON.stringify(fossilizationAlerts))

        res = await fetch("/api/chaos-window/submit", {
          method: "POST",
          credentials: "include",
          body: formData
        })
      }

      if (!res.ok) {
        throw new Error("AI response failed")
      }

      const data = await res.json()
      const aiResponse: TutorResponse = data.response
      const gradingReport: GradingReport | null = data.gradingReport

      // Add AI message to conversation history
      const aiMessageId = (Date.now() + 1).toString()
      const aiMessage: ConversationMessage = {
        id: aiMessageId,
        type: "ai",
        content: aiResponse.feedback.overall,
        timestamp: new Date(),
        aiResponse
      }

      setConversationHistory(prev => [...prev, aiMessage])

      // Store grading report keyed by message ID
      if (gradingReport) {
        setGradingReports(prev => new Map(prev).set(aiMessageId, gradingReport))
      }

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
          <Atom className="h-7 w-7 text-destructive animate-pulse" />
          Chaos Window
        </h1>
        <p className="text-muted-foreground">
          Randomized, targeted content with AI tutoring for real-time
          interaction
        </p>
      </div>

      <Card className="rounded-2xl border-border bg-gradient-to-br from-destructive/30 via-primary/50 to-foreground/30 overflow-hidden">
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
            <CardTitle>Session Content</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {!isActive ? (
            <div className="text-center py-12">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-destructive to-secondary rounded-full blur-2xl opacity-50 animate-pulse" />
                <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-destructive/30 to-foreground/30 flex items-center justify-center border-2 border-border">
                  <Atom className="h-12 w-12 text-destructive/70 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Ready for some chaos?
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Randomized content at your level with AI tutoring.
                Listen or read, then answer questions in Romanian.
              </p>

              {userLevel && (
                <Badge variant="outline" className="mb-4 text-destructive border-destructive/30">
                  {userLevel} Level
                </Badge>
              )}

              {/* Last session stats */}
              {recentSession && (
                <p className="text-sm text-muted-foreground mb-4">
                  Last session: {formatTime(recentSession.duration)}
                </p>
              )}

              <div>
                <Button
                  size="lg"
                  onClick={handleStartSession}
                  className="bg-gradient-to-r from-destructive to-primary/70 hover:from-destructive/70 hover:to-primary/30 rounded-xl px-8 shadow-lg shadow-destructive/50"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Chaos Session
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Session header with timer + end button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Atom className="h-5 w-5 text-destructive animate-pulse" />
                  <span className="font-semibold">Active Session</span>
                  {userLevel && (
                    <Badge variant="outline" className="text-destructive border-destructive/30">
                      {userLevel}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {sessionStartTime && (
                    <span className="text-sm font-mono text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(elapsedSeconds)}
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

              <Card className="rounded-xl border-destructive/20 bg-muted/30">
                <CardContent className="p-5">
                  {isLoadingContent ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 text-destructive animate-spin" />
                      <span className="ml-3 text-muted-foreground">Se încarcă conținutul...</span>
                    </div>
                  ) : contentError ? (
                    <div className="text-center py-8">
                      <p className="text-destructive mb-4">{contentError}</p>
                      <Button
                        onClick={() => fetchRandomContent()}
                        variant="outline"
                        className="border-destructive/30"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Încearcă din nou
                      </Button>
                    </div>
                  ) : currentContent ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-destructive/20">
                          {(() => {
                            const IconComponent = ContentTypeIcon[currentContent.type] || Headphones
                            return <IconComponent className="h-5 w-5 text-destructive" />
                          })()}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{currentContent.title}</h4>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {currentContent.topic} • {Math.floor((currentContent.durationSeconds || 0) / 60)} min
                            </p>
                            {discoveryToast && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-chart-4/20 text-chart-4 animate-pulse">
                                {discoveryToast}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full bg-chart-4/20 text-chart-5">
                          {userLevel} Level
                        </span>
                      </div>

                      {/* Content Display based on type */}
                      {currentContent.type === 'text' && currentContent.textContent && (
                        <div className="mb-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowTextTranscript(!showTextTranscript)}
                            className={showTextTranscript ? "text-primary bg-primary/10 hover:bg-primary/20 mb-2" : "text-muted-foreground hover:bg-primary/10 mb-2"}
                          >
                            <FileText className="h-4 w-4 mr-1.5" />
                            {showTextTranscript ? "Hide transcript" : "Show transcript"}
                          </Button>
                          {showTextTranscript && (
                            <div className="max-h-48 overflow-y-auto rounded-lg bg-muted/40 border border-primary/10 p-4 leading-relaxed text-sm">
                              <p className="text-foreground/80 whitespace-pre-line">{currentContent.textContent}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {currentContent.type === 'audio' && currentContent.audioUrl && (
                        <div className="mb-4">
                          <AudioPlayer
                            audioUrl={currentContent.audioUrl}
                            title={currentContent.title}
                            transcript={currentContent.transcript || undefined}
                          />
                        </div>
                      )}

                      {/* Transcript Loading Indicator */}
                      {isLoadingTranscript && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-border mb-4">
                          <Loader2 className="h-4 w-4 text-destructive animate-spin flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">
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
                          className="border-destructive/30"
                          onClick={() => fetchRandomContent(currentContent.id)}
                        >
                          <Shuffle className="h-4 w-4 mr-1" />
                          Next
                        </Button>
                        {currentContent.culturalNotes && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/30"
                            onClick={() => setShowCulturalNotes(!showCulturalNotes)}
                          >
                            📝 Cultural Notes
                          </Button>
                        )}
                      </div>

                      {/* Cultural notes panel */}
                      {showCulturalNotes && currentContent.culturalNotes && (
                        <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {currentContent.culturalNotes}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Se încarcă conținutul...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/30"
                  onClick={() => fetchRandomContent(currentContent?.id)}
                  disabled={isLoadingContent}
                >
                  <Shuffle className="mr-1.5 h-3.5 w-3.5" />
                  Next Content
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setIsGeneratingPractice(true)
                    setPracticeError(null)
                    setPracticeAudio(null)
                    try {
                      const res = await fetch('/api/generated-content/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          contentType: 'practice_sentences',
                          contentTitle: currentContent?.title,
                          contentTranscript: (currentContent?.transcript || currentContent?.textContent)?.slice(0, 500),
                          contentTopic: currentContent?.topic,
                          contentId: currentContent?.id,
                        }),
                      })
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({ error: 'Failed' }))
                        throw new Error(data.error || `Failed (${res.status})`)
                      }
                      const data = await res.json()
                      setPracticeAudio({
                        audioUrl: data.content.audioUrl,
                        romanianText: data.content.romanianText,
                        englishText: data.content.englishText,
                        contentType: data.content.contentType,
                      })
                    } catch (err: unknown) {
                      setPracticeError(err instanceof Error ? err.message : 'Generation failed')
                    } finally {
                      setIsGeneratingPractice(false)
                    }
                  }}
                  disabled={isGeneratingPractice}
                  className="border-primary/30 text-primary hover:text-primary/80"
                >
                  {isGeneratingPractice ? (
                    <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating...</>
                  ) : (
                    <><Volume2 className="mr-1.5 h-3.5 w-3.5" /> Practice Audio</>
                  )}
                </Button>
              </div>

              {practiceError && (
                <p className="text-sm text-destructive">{practiceError}</p>
              )}

              {practiceAudio && (
                <Card className="rounded-xl border-primary/20 bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => {
                          if (!practiceAudioRef.current) return
                          if (isPracticePlaying) {
                            practiceAudioRef.current.pause()
                            setIsPracticePlaying(false)
                          } else {
                            practiceAudioRef.current.src = practiceAudio.audioUrl
                            practiceAudioRef.current.play()
                            setIsPracticePlaying(true)
                          }
                        }}
                        className="p-1.5 rounded-full bg-primary/20 hover:bg-primary/30 transition-colors"
                      >
                        {isPracticePlaying ? (
                          <Square className="h-4 w-4 text-primary" />
                        ) : (
                          <Play className="h-4 w-4 text-primary" />
                        )}
                      </button>
                      <span className="text-sm text-primary font-medium">Practice Sentences</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-line">{practiceAudio.romanianText}</p>
                    {practiceAudio.englishText && (
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{practiceAudio.englishText}</p>
                    )}
                    <audio
                      ref={practiceAudioRef}
                      onEnded={() => setIsPracticePlaying(false)}
                    />
                    <PronunciationPractice
                      targetText={practiceAudio.romanianText.split('\n')[0].replace(/\.\s*$/, '')}
                      onComplete={handlePronunciationResult}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Chat Interface */}
              <ChaosChat
                messages={conversationHistory}
                currentQuestion={tutorPrompt}
                currentHint={tutorHint}
                isLoadingQuestion={isLoadingQuestion}
                isLoadingAI={isLoadingAI}
                modality={modality}
                onModalityChange={setModality}
                textValue={response}
                onTextChange={setResponse}
                isRecording={isRecording}
                audioBlob={audioBlob}
                audioUrl={audioUrl}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onPlayRecording={playRecording}
                onResetRecording={resetRecording}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                sessionReady={!!sessionId}
                error={error}
                gradingReports={gradingReports}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Summary Modal */}
      <SessionSummaryModal
        isOpen={showSummary}
        onCloseAction={() => setShowSummary(false)}
        onNewSessionAction={() => {
          setShowSummary(false)
          // Reset for new session
          setResponse("")
          setConversationHistory([])
          setGradingReports(new Map())
          setErrorPatterns([])
          setFossilizationAlerts([])
          setCurrentContent(null)
          handleStartSession()
        }}
        sessionId={completedSessionId}
        duration={completedDuration}
        interactionCount={completedInteractionCount}
      />
    </div>
  )
}
