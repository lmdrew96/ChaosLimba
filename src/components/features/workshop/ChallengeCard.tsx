"use client"

import { useState, useEffect } from "react"
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
  Zap,
} from "lucide-react"

import type { WorkshopChallenge } from "@/lib/ai/workshop"

interface ChallengeCardProps {
  challenge: WorkshopChallenge
  onSubmit: (response: string) => void
  onSkip: () => void
  isSubmitting: boolean
}

export const challengeTypeConfig: Record<
  string,
  { label: string; color: string; borderColor: string; icon: React.ElementType; taskInstruction: string }
> = {
  transform: { label: "Transform", color: "bg-accent/20 text-accent border-accent/30", borderColor: "border-l-accent", icon: ArrowRightLeft, taskInstruction: "Change the sentence as instructed and rewrite it." },
  complete: { label: "Complete", color: "bg-chart-4/20 text-chart-4 border-chart-4/30", borderColor: "border-l-chart-4", icon: PenLine, taskInstruction: "Fill in the blank with the correct word or form." },
  fix: { label: "Fix", color: "bg-chart-3/20 text-chart-3 border-chart-3/30", borderColor: "border-l-chart-3", icon: Wrench, taskInstruction: "Find the grammar error and rewrite the sentence correctly." },
  rewrite: { label: "Rewrite", color: "bg-primary/20 text-primary border-primary/30", borderColor: "border-l-primary", icon: RotateCcw, taskInstruction: "Write this in Romanian using the target grammar structure." },
  use_it: { label: "Use It", color: "bg-accent/20 text-accent border-accent/30", borderColor: "border-l-accent", icon: MessageSquare, taskInstruction: "Write a complete sentence using the given word or phrase." },
  which_one: { label: "Which One?", color: "bg-secondary/20 text-secondary border-secondary/30", borderColor: "border-l-secondary", icon: CircleHelp, taskInstruction: "Pick the sentence that uses the structure correctly." },
  spot_the_trap: { label: "Spot the Trap", color: "bg-destructive/20 text-destructive border-destructive/30", borderColor: "border-l-destructive", icon: TriangleAlert, taskInstruction: "This sentence looks correct but has a subtle error. Find it." },
}

export function ChallengeCard({ challenge, onSubmit, onSkip, isSubmitting }: ChallengeCardProps) {
  const [response, setResponse] = useState("")
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)

  const isMultipleChoice = challenge.type === "which_one" && (challenge.options?.length ?? 0) > 0

  // Reset state when challenge changes
  useEffect(() => {
    setResponse("")
    setSelectedOption(null)
    setShowHint(false)
  }, [challenge])

  const config = challengeTypeConfig[challenge.type] || challengeTypeConfig.transform
  const TypeIcon = config.icon

  const handleSubmit = () => {
    if (isMultipleChoice && selectedOption) {
      onSubmit(selectedOption)
    } else if (response.trim().length >= 3) {
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
    <Card className={`rounded-2xl border-border/40 bg-gradient-to-br from-accent/5 via-background to-accent/5 border-l-4 ${config.borderColor}`}>
      <CardContent className="p-6 space-y-5">
        {/* Header: challenge type + feature name + surprise badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={`${config.color} gap-1.5`}>
              <TypeIcon className="h-3.5 w-3.5" />
              {config.label}
            </Badge>
            {challenge.isSurprise && (
              <Badge className="bg-chart-3/20 text-chart-3 border-chart-3/30 gap-1">
                <Zap className="h-3 w-3" />
                Surprise!
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {challenge.featureName}
          </span>
        </div>

        {/* Task instruction + challenge prompt */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{config.taskInstruction}</p>
          <div>
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
          </div>

          {challenge.targetSentence && (
            <div className="rounded-xl bg-muted/50 pl-4 pr-4 py-3 border-l-2 border-accent/40">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Romanian</span>
              <div className="text-base italic text-foreground/90 mt-0.5">
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

        {/* Hint toggle with smooth animation */}
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
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-in-out"
              style={{ gridTemplateRows: showHint ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
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
              </div>
            </div>
          </div>
        )}

        {/* Response input */}
        {isMultipleChoice ? (
          <div className="grid gap-2">
            {challenge.options!.map((option, i) => {
              const letter = String.fromCharCode(65 + i)
              const isSelected = selectedOption === option
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => !isSubmitting && setSelectedOption(option)}
                  className={`flex items-start gap-3 text-left px-4 py-3 rounded-xl border transition-all ${
                    isSelected
                      ? "border-accent ring-2 ring-accent/30 bg-accent/10"
                      : "border-border/40 bg-background/50 hover:border-accent/30 hover:bg-accent/5"
                  } ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-semibold ${
                    isSelected ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {letter}
                  </span>
                  <span className="text-sm leading-relaxed pt-0.5">{option}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer in Romanian..."
            className="min-h-[80px] rounded-xl border-border/40 bg-background/50 focus:border-accent/50 resize-none"
            disabled={isSubmitting}
          />
        )}

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
            disabled={(isMultipleChoice ? !selectedOption : response.trim().length < 3) || isSubmitting}
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
