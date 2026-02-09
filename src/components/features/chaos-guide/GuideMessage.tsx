"use client"

import ReactMarkdown from "react-markdown"
import { Compass, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface GuideMessageProps {
  role: "user" | "assistant"
  content: string
}

export function GuideMessage({ role, content }: GuideMessageProps) {
  const isUser = role === "user"

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-primary/20 text-primary"
            : "bg-chart-4/20 text-chart-4"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Compass className="h-4 w-4" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        {isUser ? (
          content
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-chart-4">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-0.5">{children}</li>,
              code: ({ children }) => (
                <code className="bg-background/30 px-1 py-0.5 rounded text-xs">{children}</code>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
