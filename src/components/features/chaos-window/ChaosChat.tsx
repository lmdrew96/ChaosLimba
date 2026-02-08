"use client"

import { useRef, useEffect, type FormEvent, type KeyboardEvent } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Send,
  Loader2,
  GraduationCap,
  PenLine,
  Mic,
  Square,
  Play,
  RotateCcw,
  Volume2,
} from "lucide-react"
import { ConversationMessage } from "./ConversationHistory"
import { GradingReport } from "./AIResponse"
import { ChaosChatMessage } from "./ChaosChatMessage"

type Modality = "text" | "speech"

interface ChaosChatProps {
  messages: ConversationMessage[]
  currentQuestion: string | null
  currentHint: string | null
  isLoadingQuestion: boolean
  isLoadingAI: boolean
  // Input state
  modality: Modality
  onModalityChange: (m: Modality) => void
  textValue: string
  onTextChange: (v: string) => void
  // Recording state
  isRecording: boolean
  audioBlob: Blob | null
  audioUrl: string | null
  onStartRecording: () => void
  onStopRecording: () => void
  onPlayRecording: () => void
  onResetRecording: () => void
  // Submit
  onSubmit: (e: FormEvent) => void
  isSubmitting: boolean
  sessionReady: boolean
  error: string | null
  // Grading reports keyed by message ID
  gradingReports: Map<string, GradingReport>
}

export function ChaosChat({
  messages,
  currentQuestion,
  currentHint,
  isLoadingQuestion,
  isLoadingAI,
  modality,
  onModalityChange,
  textValue,
  onTextChange,
  isRecording,
  audioBlob,
  audioUrl,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  onResetRecording,
  onSubmit,
  isSubmitting,
  sessionReady,
  error,
  gradingReports,
}: ChaosChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoadingAI, isLoadingQuestion, currentQuestion])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [textValue])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (textValue.trim().length >= 5 && sessionReady && !isSubmitting) {
        e.currentTarget.form?.requestSubmit()
      }
    }
  }

  // Build chat messages: initial question + conversation with split feedback/nextQuestion
  const chatElements: React.ReactNode[] = []

  // Initial question (or loading skeleton)
  if (isLoadingQuestion) {
    chatElements.push(
      <div key="loading-question" className="flex gap-2">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <GraduationCap className="h-4 w-4 text-primary" />
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-primary/10 border border-primary/20 px-4 py-3">
          <div className="space-y-2 w-48">
            <div className="h-3 bg-primary/20 rounded-full animate-pulse" />
            <div className="h-3 bg-primary/20 rounded-full animate-pulse w-4/5" />
          </div>
        </div>
      </div>
    )
  } else if (currentQuestion && messages.length === 0) {
    // Only show initial question as standalone if there are no messages yet
    chatElements.push(
      <ChaosChatMessage
        key="initial-question"
        role="tutor"
        content={currentQuestion}
        hint={currentHint}
        isQuestion
      />
    )
  }

  // Conversation messages
  messages.forEach((msg) => {
    if (msg.type === "user") {
      chatElements.push(
        <ChaosChatMessage
          key={msg.id}
          role="user"
          content={msg.content}
          timestamp={msg.timestamp}
          isSpeech={msg.content.startsWith("🎤")}
        />
      )
    } else {
      // AI feedback message
      const report = gradingReports.get(msg.id)
      chatElements.push(
        <ChaosChatMessage
          key={msg.id}
          role="tutor"
          content={msg.aiResponse?.feedback.overall || msg.content}
          timestamp={msg.timestamp}
          aiResponse={msg.aiResponse}
          gradingReport={report}
        />
      )

      // Next question as separate tutor bubble
      if (msg.aiResponse?.nextQuestion) {
        chatElements.push(
          <ChaosChatMessage
            key={`${msg.id}-next`}
            role="tutor"
            content={msg.aiResponse.nextQuestion}
            isQuestion
          />
        )
      }
    }
  })

  const canSubmitText = modality === "text" && textValue.trim().length >= 5
  const canSubmitSpeech = modality === "speech" && !!audioBlob
  const canSubmit = (canSubmitText || canSubmitSpeech) && sessionReady && !isSubmitting

  return (
    <Card className="rounded-2xl border-border flex flex-col max-h-[60vh] min-h-[300px]">
      <CardContent className="flex-1 flex flex-col p-4 min-h-0">
        {/* Scrollable message area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 pr-1"
        >
          {/* Empty state */}
          {!isLoadingQuestion && !currentQuestion && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <GraduationCap className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Listen to or read the content above, then answer the question that appears here.
              </p>
            </div>
          )}

          {chatElements}

          {/* AI thinking indicator */}
          {isLoadingAI && (
            <div className="flex gap-2">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-primary/10 border border-primary/20 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-destructive text-sm text-center py-2">
            {error}
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-border pt-3 mt-3 space-y-2">
          <form onSubmit={onSubmit} className="flex gap-2 items-end">
            {/* Modality toggle */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  onModalityChange("text")
                  onResetRecording()
                }}
                className={`p-2 rounded-lg transition-colors ${
                  modality === "text"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
                disabled={isSubmitting}
                title="Text mode"
              >
                <PenLine className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onModalityChange("speech")
                  onTextChange("")
                }}
                className={`p-2 rounded-lg transition-colors ${
                  modality === "speech"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
                disabled={isSubmitting}
                title="Speech mode"
              >
                <Mic className="h-4 w-4" />
              </button>
            </div>

            {/* Text input or speech controls */}
            {modality === "text" ? (
              <textarea
                ref={textareaRef}
                value={textValue}
                onChange={(e) => onTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Răspunde aici..."
                rows={1}
                className="flex-1 resize-none bg-muted rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isSubmitting}
              />
            ) : (
              <div className="flex-1">
                {!audioBlob ? (
                  !isRecording ? (
                    <Button
                      type="button"
                      onClick={onStartRecording}
                      className="w-full bg-accent/20 hover:bg-accent/30 text-accent rounded-xl"
                      variant="ghost"
                      disabled={isSubmitting}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={onStopRecording}
                      className="w-full bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-xl animate-pulse"
                      variant="ghost"
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Stop Recording
                    </Button>
                  )
                ) : (
                  <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground flex-1">Audio recorded</span>
                    <Button
                      type="button"
                      onClick={onPlayRecording}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Play
                    </Button>
                    <Button
                      type="button"
                      onClick={onResetRecording}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              size="icon"
              disabled={!canSubmit}
              className="flex-shrink-0 rounded-xl"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Character hint for text mode */}
          {modality === "text" && textValue.length > 0 && textValue.trim().length < 5 && (
            <p className="text-xs text-muted-foreground pl-14">Minim 5 caractere</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}