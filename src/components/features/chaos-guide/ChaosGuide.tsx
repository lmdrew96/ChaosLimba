"use client"

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react"
import { Compass, Send, RotateCcw, Loader2 } from "lucide-react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { GuideMessage } from "./GuideMessage"
import { getGuideConfig } from "./guide-config"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChaosGuideProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function ChaosGuide({ isOpen, onOpenChange }: ChaosGuideProps) {
  const pathname = usePathname()
  const config = getGuideConfig(pathname)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Focus textarea when sheet opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [input])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = { role: "user", content: trimmed }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chaos-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          conversationHistory: messages,
          currentPage: config.pageName,
        }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.response }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Oops, something went wrong. Try asking again!" },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const resetChat = () => {
    setMessages([])
    setInput("")
  }

  const hasMessages = messages.length > 0

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[420px] sm:max-w-[420px] p-0 flex flex-col gap-0">
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-border/40 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-chart-4/20 flex items-center justify-center">
                <Compass className="h-4 w-4 text-chart-4" />
              </div>
              <SheetTitle className="text-base font-semibold">Chaos Guide</SheetTitle>
            </div>
            {hasMessages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetChat}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                New chat
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!hasMessages ? (
            // Empty state with suggested questions
            <div className="flex flex-col items-center text-center pt-8">
              <div className="h-12 w-12 rounded-full bg-chart-4/10 flex items-center justify-center mb-4">
                <Compass className="h-6 w-6 text-chart-4" />
              </div>
              <h3 className="text-sm font-medium mb-1">{config.pageName}</h3>
              <p className="text-xs text-muted-foreground mb-6 max-w-[280px]">
                {config.pageDescription}
              </p>
              <div className="w-full space-y-2">
                <p className="text-xs text-muted-foreground/70 mb-2">Try asking:</p>
                {config.suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={isLoading}
                    className="w-full text-left text-sm px-3.5 py-2.5 rounded-xl border border-border/60 hover:border-chart-4/40 hover:bg-chart-4/5 text-foreground/80 transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Chat messages
            <>
              {messages.map((msg, i) => (
                <GuideMessage key={i} role={msg.role} content={msg.content} />
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-chart-4/20 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-chart-4 animate-spin" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-chart-4/40 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-chart-4/40 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-chart-4/40 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-border/40 px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this feature..."
              rows={1}
              maxLength={500}
              disabled={isLoading}
              className="flex-1 resize-none rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-base sm:text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-chart-4/40 disabled:opacity-50"
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="h-9 w-9 rounded-xl bg-chart-4 hover:bg-chart-4/90 text-white flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
