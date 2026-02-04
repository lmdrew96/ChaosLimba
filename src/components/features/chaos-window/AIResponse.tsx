"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Sparkles, AlertTriangle, CheckCircle2, Target, ExternalLink, Volume2 } from "lucide-react"
import { TutorResponse, GrammarError } from "@/lib/ai/tutor"
import { FormattedFeedback } from "@/lib/ai/formatter"
import { RelevanceFeedback } from "@/components/features/feedback/RelevanceFeedback"
import { cn } from "@/lib/utils"
import Link from "next/link"

export interface GradingReport {
  overallScore: number
  componentStatus: {
    grammar: 'success' | 'error' | 'skipped'
    semantic: 'success' | 'error' | 'skipped'
    pronunciation?: 'success' | 'error' | 'skipped'
    intonation?: 'success' | 'error' | 'skipped'
    relevance?: 'success' | 'error' | 'skipped'
  }
  formattedFeedback?: FormattedFeedback | null
  rawReport?: any
}

interface AIResponseProps {
  response?: TutorResponse | null
  isLoading?: boolean
  gradingReport?: GradingReport | null
}

export function AIResponse({ response, isLoading, gradingReport }: AIResponseProps) {
  if (isLoading) {
    return (
      <Card className="rounded-xl border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <MessageSquare className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <h4 className="font-medium">AI Tutor is thinking...</h4>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-primary/20 rounded-full animate-pulse" />
            <div className="h-3 bg-primary/20 rounded-full animate-pulse w-4/5" />
            <div className="h-3 bg-primary/20 rounded-full animate-pulse w-3/5" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!response) {
    return null
  }

  const hasErrors = response.feedback.grammar.length > 0
  const isCorrect = response.isCorrect

  return (
    <Card className="rounded-xl border-primary/20 bg-primary/5">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">AI Tutor</h4>
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Excelent!
                </Badge>
              ) : hasErrors ? (
                // Check if there are actual ERRORS vs just SUGGESTIONS
                response.feedback.grammar.some(e => e.feedbackType === 'error' || !e.feedbackType) ? (
                  <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Needs work
                  </Badge>
                ) : (
                  <Badge className="bg-accent/20 text-accent border-accent/30">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Consider improvements
                  </Badge>
                )
              ) : (
                <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  No issues detected
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Overall Feedback */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-sm">{response.feedback.overall}</p>
        </div>

        {/* Vocabulary Help */}
        {response.vocabHelp && (
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/30">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              <h5 className="font-medium text-accent">Vocabulary Help</h5>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground italic">"{response.vocabHelp.question}"</p>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-accent">{response.vocabHelp.word}</span>
                <span className="text-sm text-muted-foreground">→</span>
                <span className="text-sm font-semibold text-accent">{response.vocabHelp.translation}</span>
              </div>
              {response.vocabHelp.context && (
                <p className="text-xs text-muted-foreground mt-2">
                  Example: <span className="italic">{response.vocabHelp.context}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Grammar Feedback - Split into Errors and Suggestions */}
        {response.feedback.grammar.length > 0 && (
          <div className="space-y-3">
            {/* ERRORS Section */}
            {response.feedback.grammar.filter(e => e.feedbackType === 'error' || !e.feedbackType).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <h5 className="text-sm font-medium text-destructive">Needs work:</h5>
                </div>
                <div className="space-y-2">
                  {response.feedback.grammar
                    .filter(e => e.feedbackType === 'error' || !e.feedbackType)
                    .map((error, index) => (
                      <GrammarErrorCard key={index} error={error} />
                    ))}
                </div>
              </div>
            )}

            {/* SUGGESTIONS Section */}
            {response.feedback.grammar.filter(e => e.feedbackType === 'suggestion').length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h5 className="text-sm font-medium text-accent">Consider:</h5>
                </div>
                <div className="space-y-2">
                  {response.feedback.grammar
                    .filter(e => e.feedbackType === 'suggestion')
                    .map((error, index) => (
                      <GrammarSuggestionCard key={index} error={error} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Semantic Feedback */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-primary">Understanding:</span>
            <span className="text-sm text-primary">
              {Math.round(response.feedback.semantic.score * 100)}% match
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{response.feedback.semantic.feedback}</p>
        </div>

        {/* Pronunciation Feedback (for speech responses) */}
        {gradingReport?.rawReport?.pronunciation && (
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="h-4 w-4 text-accent" />
              <h5 className="font-medium text-accent">Pronunciation</h5>
            </div>

            {/* Transcription */}
            {gradingReport.rawReport.pronunciation.transcribedText && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">You said:</p>
                <p className="text-sm italic">"{gradingReport.rawReport.pronunciation.transcribedText}"</p>
              </div>
            )}

            {/* Pronunciation Score */}
            {gradingReport.rawReport.pronunciation.pronunciationScore !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Accuracy:</span>
                  <span className={cn(
                    "text-sm font-semibold",
                    gradingReport.rawReport.pronunciation.pronunciationScore >= 0.85
                      ? "text-chart-4"
                      : gradingReport.rawReport.pronunciation.pronunciationScore >= 0.70
                      ? "text-chart-3"
                      : "text-destructive"
                  )}>
                    {(gradingReport.rawReport.pronunciation.pronunciationScore * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      gradingReport.rawReport.pronunciation.pronunciationScore >= 0.85
                        ? "bg-chart-4"
                        : gradingReport.rawReport.pronunciation.pronunciationScore >= 0.70
                        ? "bg-chart-3"
                        : "bg-destructive"
                    )}
                    style={{
                      width: `${gradingReport.rawReport.pronunciation.pronunciationScore * 100}%`
                    }}
                  />
                </div>

                {!gradingReport.rawReport.pronunciation.isAccurate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Try recording again and focus on matching the expected pronunciation.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Intonation Warnings */}
        {gradingReport?.rawReport?.intonation?.warnings &&
         gradingReport.rawReport.intonation.warnings.length > 0 && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h5 className="font-medium text-destructive">Intonation Warning</h5>
            </div>
            {gradingReport.rawReport.intonation.warnings.map((warning: any, index: number) => (
              <div key={index} className="space-y-1 text-sm">
                <p className="text-foreground">
                  Watch your stress on <strong>"{warning.word}"</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  You said: {warning.user_stress} → Expected: {warning.expected_stress}
                </p>
                <p className="text-xs text-destructive/80">
                  {warning.explanation}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Relevance Feedback (SPAM-B) */}
        {gradingReport?.rawReport?.relevance && (
          <RelevanceFeedback relevance={gradingReport.rawReport.relevance} />
        )}

        {/* Encouragement */}
        {response.feedback.encouragement && (
          <div className="p-3 rounded-xl bg-secondary/20 border border-secondary/30">
            <p className="text-sm italic text-foreground/80">"{response.feedback.encouragement}"</p>
          </div>
        )}

        {/* Next Question */}
        {response.nextQuestion && (
          <div className="p-4 rounded-xl bg-secondary/20 border border-secondary/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-secondary" />
              <h5 className="font-medium text-secondary-foreground">Next question:</h5>
            </div>
            <p className="text-sm">{response.nextQuestion}</p>
          </div>
        )}

        {/* Grading Report */}
        {gradingReport && (
          <div className="mt-4 p-4 rounded-xl bg-accent/10 border border-accent/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                <h5 className="font-medium text-accent">Overall Score</h5>
              </div>
              <div className="text-2xl font-bold text-accent">
                {gradingReport.overallScore}/100
              </div>
            </div>

            {/* Summary from formatted feedback */}
            {gradingReport.formattedFeedback?.summary && (
              <p className="text-sm text-muted-foreground mb-3">
                {gradingReport.formattedFeedback.summary}
              </p>
            )}

            {/* Component Status */}
            <div className="flex flex-wrap gap-2 mb-3">
              {gradingReport.componentStatus.grammar === 'success' && (
                <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/30">
                  Grammar ✓
                </Badge>
              )}
              {gradingReport.componentStatus.semantic === 'success' && (
                <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/30">
                  Meaning ✓
                </Badge>
              )}
              {gradingReport.componentStatus.pronunciation === 'success' && (
                <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/30">
                  Pronunciation ✓
                </Badge>
              )}
              {gradingReport.componentStatus.intonation === 'success' && (
                <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/30">
                  Intonation ✓
                </Badge>
              )}
              {gradingReport.componentStatus.relevance === 'success' && (
                <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/30">
                  On-topic ✓
                </Badge>
              )}
            </div>

            {/* Link to Error Garden */}
            <Link
              href="/error-garden"
              className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
            >
              View patterns in Error Garden
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function GrammarErrorCard({ error }: { error: GrammarError }) {
  const severityColors = {
    minor: "bg-destructive/10 text-destructive border-destructive/20",
    major: "bg-destructive/15 text-destructive border-destructive/30",
    critical: "bg-destructive/20 text-destructive border-destructive/40"
  }

  return (
    <div className={cn(
      "p-3 rounded-lg border text-sm",
      severityColors[error.severity]
    )}>
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-destructive" />
        <div className="flex-1">
          <span className="font-medium">{error.type}</span>
          <div className="text-xs opacity-80 mt-1">
            "{error.incorrect}" → "{error.correct}"
          </div>
        </div>
      </div>
      <p className="text-xs opacity-90">{error.explanation}</p>
    </div>
  )
}

export function GrammarSuggestionCard({ error }: { error: GrammarError }) {
  const severityColors = {
    minor: "bg-accent/10 text-accent border-accent/20",
    major: "bg-primary/10 text-primary border-primary/20",
    critical: "bg-primary/15 text-primary border-primary/30"
  }

  return (
    <div className={cn(
      "p-3 rounded-lg border text-sm",
      severityColors[error.severity]
    )}>
      <div className="flex items-start gap-2 mb-2">
        <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
        <div className="flex-1">
          <span className="font-medium">{error.type}</span>
          <div className="text-xs opacity-80 mt-1">
            "{error.incorrect}" → "{error.correct}"
          </div>
        </div>
      </div>
      <p className="text-xs opacity-90 italic">{error.explanation}</p>
      <p className="text-xs opacity-60 mt-1">💡 Both forms are valid, but this might sound more natural.</p>
    </div>
  )
}
