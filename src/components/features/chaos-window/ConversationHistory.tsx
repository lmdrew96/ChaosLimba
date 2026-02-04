"use client"

import { Card, CardContent } from "@/components/ui/card"
import { User, MessageSquare, Sparkles } from "lucide-react"
import { TutorResponse } from "@/lib/ai/tutor"
import { cn } from "@/lib/utils"

interface ConversationMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  aiResponse?: TutorResponse
}

export type { ConversationMessage }

interface ConversationHistoryProps {
  messages: ConversationMessage[]
  className?: string
}

export function ConversationHistory({ messages, className }: ConversationHistoryProps) {
  if (messages.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-4", className)}>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  )
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  if (message.type === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%]">
          <div className="flex items-center gap-2 mb-1 justify-end">
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString()}
            </span>
            <User className="h-4 w-4 text-accent" />
          </div>
          <Card className="rounded-xl border-accent/20 bg-accent/10">
            <CardContent className="p-4">
              <p className="text-sm">{message.content}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%]">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        {message.aiResponse ? (
          <div className="space-y-3">
            {/* Overall feedback */}
            <Card className="rounded-xl border-primary/20 bg-primary/10">
              <CardContent className="p-4">
                <p className="text-sm">{message.aiResponse.feedback.overall}</p>
              </CardContent>
            </Card>

            {/* Next question if present */}
            {message.aiResponse.nextQuestion && (
              <Card className="rounded-xl border-secondary/20 bg-secondary/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-secondary" />
                    <span className="text-xs font-medium text-secondary-foreground">Next question:</span>
                  </div>
                  <p className="text-sm">{message.aiResponse.nextQuestion}</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="rounded-xl border-primary/20 bg-primary/10">
            <CardContent className="p-4">
              <p className="text-sm">{message.content}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
