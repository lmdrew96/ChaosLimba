"use client"

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Send, Loader2 } from "lucide-react"
import { ChatMessage } from "@/components/features/ask-tutor/ChatMessage"

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function AskTutorPage() {
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])

  // Handle pre-filled question from URL (e.g., from Ce înseamnă? "Ask Tutor about this")
  useEffect(() => {
    const prefilled = searchParams.get("q")
    if (prefilled && messages.length === 0) {
      setInput(prefilled)
    }
  }, [searchParams, messages.length])

  // Fetch suggested questions from DB
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const res = await fetch("/api/ask-tutor/suggested-questions")
        if (res.ok) {
          const data = await res.json()
          setSuggestedQuestions(data.questions)
        }
      } catch {
        // Non-critical
      }
    }
    fetchSuggestions()
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  async function sendMessage(text: string) {
    const question = text.trim()
    if (!question || isLoading) return

    setError(null)
    setInput("")

    const userMessage: Message = { role: "user", content: question }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      // Build conversation history for context (exclude current message)
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch("/api/ask-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, conversationHistory }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ])
    } catch (err) {
      console.error("[Ask Tutor]", err)
      setError("Tutorul nu a putut răspunde. Încearcă din nou.")
      // Remove the user message if the request failed
      setMessages(messages)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const showSuggestions = messages.length === 0 && !isLoading

  return (
    <div className="max-w-2xl mx-auto space-y-6 flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-foreground" />
          Ask Tutor
        </h1>
        <p className="text-muted-foreground">
          Ask anything about Romanian language — grammar, vocabulary, etymology, culture
        </p>
      </div>

      {/* Chat area */}
      <Card className="rounded-2xl border-border flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-4 pr-1"
          >
            {/* Empty state with suggestions */}
            {showSuggestions && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
                <div className="space-y-2">
                  <GraduationCap className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                  <p className="text-muted-foreground">
                    What would you like to know about Romanian?
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground hover:bg-primary/20 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation */}
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-foreground/10 text-foreground">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 pt-3 border-t border-border mt-3"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Romanian..."
              rows={1}
              maxLength={1000}
              className="flex-1 resize-none bg-muted rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="flex-shrink-0 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
