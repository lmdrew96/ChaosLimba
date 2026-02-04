"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowRightLeft,
  PenLine,
  Wrench,
  RotateCcw,
  MessageSquare,
  CircleHelp,
  TriangleAlert,
  Lightbulb,
  SkipForward,
  Send,
  Loader2,
} from "lucide-react"

import type { WorkshopChallenge } from "@/lib/ai/workshop"

interface ChallengeCardProps {
  challenge: WorkshopChallenge
  onSubmit: (response: string) => void
  onSkip: () => void
  isSubmitting: boolean
}

const challengeTypeConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  transform: { label: "Transform", color: "bg-accent/20 text-accent border-accent/30", icon: ArrowRightLeft },
  complete: { label: "Complete", color: "bg-chart-4/20 text-chart-4 border-chart-4/30", icon: PenLine },
  fix: { label: "Fix", color: "bg-chart-3/20 text-chart-3 border-chart-3/30", icon: Wrench },
  rewrite: { label: "Rewrite", color: "bg-primary/20 text-primary border-primary/30", icon: RotateCcw },
  use_it: { label: "Use It", color: "bg-accent/20 text-accent border-accent/30", icon: MessageSquare },
  which_one: { label: "Which One?", color: "bg-secondary/20 text-secondary border-secondary/30", icon: CircleHelp },
  spot_the_trap: { label: "Spot the Trap", color: "bg-destructive/20 text-destructive border-destructive/30", icon: TriangleAlert },
}

export function ChallengeCard({ challenge, onSubmit, onSkip, isSubmitting }: ChallengeCardProps) {
  const [response, setResponse] = useState("")
  const [showHint, setShowHint] = useState(false)

  const config = challengeTypeConfig[challenge.type] || challengeTypeConfig.transform
  const TypeIcon = config.icon

  const handleSubmit = () => {
    if (response.trim().length >= 3) {
      onSubmit(response.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Card className="rounded-2xl border-border/40 bg-gradient-to-br from-accent/5 via-background to-accent/5">
      <CardContent className="p-6 space-y-5">
        {/* Header: challenge type + feature name */}
        <div className="flex items-center justify-between">
          <Badge className={`${config.color} gap-1.5`}>
            <TypeIcon className="h-3.5 w-3.5" />
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {challenge.featureName}
          </span>
        </div>

        {/* Challenge prompt */}
        <div className="space-y-3">
          <div className="text-lg font-medium leading-relaxed">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ children }) => (
                  <code className="bg-muted/50 px-1 py-0.5 rounded text-base">{children}</code>
                ),
              }}
            >
              {challenge.prompt}
            </ReactMarkdown>
          </div>

          {challenge.targetSentence && (
            <div className="rounded-xl bg-muted/50 px-4 py-3 border border-border/40">
              <div className="text-base italic text-foreground/90">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                  }}
                >
                  {challenge.targetSentence}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Hint toggle */}
        {challenge.hint && (
          <div>
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              {showHint ? "Hide hint" : "Show hint"}
            </button>
            {showHint && (
              <div className="mt-2 text-sm text-muted-foreground bg-chart-3/5 border border-chart-3/20 rounded-lg px-3 py-2">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                  }}
                >
                  {challenge.hint}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Response input */}
        <Textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer in Romanian..."
          className="min-h-[80px] rounded-xl border-border/40 bg-background/50 focus:border-accent/50 resize-none"
          disabled={isSubmitting}
        />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="mr-1.5 h-4 w-4" />
            Skip
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={response.trim().length < 3 || isSubmitting}
            className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 rounded-xl shadow-lg shadow-accent/20"
          >
            {isSubmitting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}
            Submit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
