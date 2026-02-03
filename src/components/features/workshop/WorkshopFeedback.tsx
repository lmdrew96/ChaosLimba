"use client"

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
          ? "bg-gradient-to-br from-emerald-500/5 via-background to-green-500/5"
          : "bg-gradient-to-br from-amber-500/5 via-background to-orange-500/5"
      }`}
    >
      <CardContent className="p-6 space-y-5">
        {/* Result header */}
        <div className="flex items-center gap-3">
          {isCorrect ? (
            <>
              <div className="p-2 rounded-full bg-emerald-500/20">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-emerald-400">Nice work!</p>
                <p className="text-sm text-muted-foreground">
                  Score: {evaluation.score}/100
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-full bg-amber-500/20">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-amber-400">Almost there!</p>
                <p className="text-sm text-muted-foreground">
                  Errors are gold — this one goes to your Error Garden
                </p>
              </div>
            </>
          )}

          {evaluation.usedTargetStructure && (
            <Badge className="ml-auto bg-indigo-500/20 text-indigo-400 border-indigo-500/30 gap-1">
              <Sparkles className="h-3 w-3" />
              Used target structure
            </Badge>
          )}
        </div>

        {/* Feedback text */}
        <p className="text-base leading-relaxed">{evaluation.feedback}</p>

        {/* Correction (if incorrect) */}
        {evaluation.correction && (
          <div className="rounded-xl bg-muted/50 px-4 py-3 border border-border/40 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Correction
            </p>
            <p className="text-base font-medium text-foreground">
              {evaluation.correction}
            </p>
          </div>
        )}

        {/* Rule explanation */}
        <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/20 px-4 py-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 uppercase tracking-wider">
            <BookOpen className="h-3.5 w-3.5" />
            Grammar Rule
          </div>
          <p className="text-sm text-foreground/80">
            {evaluation.ruleExplanation}
          </p>
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
                <span className="text-amber-400 mt-0.5">*</span>
                <span>
                  <span className="line-through text-red-400/70">
                    {err.learner_production}
                  </span>{" "}
                  <span className="text-emerald-400">
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
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-lg shadow-indigo-500/20"
        >
          Next Challenge
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
