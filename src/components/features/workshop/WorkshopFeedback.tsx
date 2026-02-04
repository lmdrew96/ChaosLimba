"use client"

import ReactMarkdown from "react-markdown"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react"

import type { WorkshopChallenge, WorkshopEvaluation } from "@/lib/ai/workshop"

interface WorkshopFeedbackProps {
  evaluation: WorkshopEvaluation
  challenge: WorkshopChallenge
  onNext: () => void
}

export function WorkshopFeedback({ evaluation, challenge, onNext }: WorkshopFeedbackProps) {
  const isCorrect = evaluation.isCorrect

  return (
    <Card
      className={`rounded-2xl border-border/40 ${
        isCorrect
          ? "bg-gradient-to-br from-chart-4/5 via-background to-chart-4/5"
          : "bg-gradient-to-br from-chart-3/5 via-background to-destructive/5"
      }`}
    >
      <CardContent className="p-6 space-y-5">
        {/* Result header */}
        <div className="flex items-center gap-3">
          {isCorrect ? (
            <>
              <div className="p-2 rounded-full bg-chart-4/20">
                <CheckCircle2 className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <p className="font-semibold text-chart-4">Nice work!</p>
                <p className="text-sm text-muted-foreground">
                  Score: {evaluation.score}/100
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-full bg-chart-3/20">
                <AlertTriangle className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="font-semibold text-chart-3">Almost there!</p>
                <p className="text-sm text-muted-foreground">
                  Errors are gold — this one goes to your Error Garden
                </p>
              </div>
            </>
          )}

          {evaluation.usedTargetStructure && (
            <Badge className="ml-auto bg-accent/20 text-accent border-accent/30 gap-1">
              <Sparkles className="h-3 w-3" />
              Used target structure
            </Badge>
          )}
        </div>

        {/* Feedback text */}
        <div className="text-base leading-relaxed">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-0.5">{children}</li>,
            }}
          >
            {evaluation.feedback}
          </ReactMarkdown>
        </div>

        {/* Correction (if incorrect) */}
        {evaluation.correction && (
          <div className="rounded-xl bg-muted/50 px-4 py-3 border border-border/40 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Correction
            </p>
            <div className="text-base font-medium text-foreground">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {evaluation.correction}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Rule explanation */}
        <div className="rounded-xl bg-accent/5 border border-accent/20 px-4 py-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-accent uppercase tracking-wider">
            <BookOpen className="h-3.5 w-3.5" />
            Grammar Rule
          </div>
          <div className="text-sm text-foreground/80">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-1">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
              }}
            >
              {evaluation.ruleExplanation}
            </ReactMarkdown>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Feature: {challenge.featureName}
          </p>
        </div>

        {/* Grammar errors from Claude Haiku analysis */}
        {evaluation.grammarErrors.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Additional Notes
            </p>
            {evaluation.grammarErrors.slice(0, 3).map((err, i) => (
              <div
                key={i}
                className="text-sm flex items-start gap-2 text-muted-foreground"
              >
                <span className="text-chart-3 mt-0.5">*</span>
                <span>
                  <span className="line-through text-destructive/70">
                    {err.learner_production}
                  </span>{" "}
                  <span className="text-chart-4">
                    {err.correct_form}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Next button */}
        <Button
          onClick={onNext}
          className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 rounded-xl shadow-lg shadow-accent/20"
        >
          Next Challenge
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
