"use client"

import { useState } from "react"
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
  transform: { label: "Transform", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: ArrowRightLeft },
  complete: { label: "Complete", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: PenLine },
  fix: { label: "Fix", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Wrench },
  rewrite: { label: "Rewrite", color: "bg-violet-500/20 text-violet-400 border-violet-500/30", icon: RotateCcw },
  use_it: { label: "Use It", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", icon: MessageSquare },
  which_one: { label: "Which One?", color: "bg-pink-500/20 text-pink-400 border-pink-500/30", icon: CircleHelp },
  spot_the_trap: { label: "Spot the Trap", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: TriangleAlert },
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
    <Card className="rounded-2xl border-border/40 bg-gradient-to-br from-indigo-500/5 via-background to-blue-500/5">
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
          <p className="text-lg font-medium leading-relaxed">
            {challenge.prompt}
          </p>

          {challenge.targetSentence && (
            <div className="rounded-xl bg-muted/50 px-4 py-3 border border-border/40">
              <p className="text-base italic text-foreground/90">
                {challenge.targetSentence}
              </p>
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
              <p className="mt-2 text-sm text-muted-foreground bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                {challenge.hint}
              </p>
            )}
          </div>
        )}

        {/* Response input */}
        <Textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer in Romanian..."
          className="min-h-[80px] rounded-xl border-border/40 bg-background/50 focus:border-indigo-500/50 resize-none"
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
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-lg shadow-indigo-500/20"
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
