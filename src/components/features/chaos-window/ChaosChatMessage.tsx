"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  GraduationCap,
  User,
  Mic,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  ExternalLink,
  Volume2,
  MessageSquare,
} from "lucide-react"
import { TutorResponse, GrammarError } from "@/lib/ai/tutor"
import { GradingReport, GrammarErrorCard, GrammarSuggestionCard } from "./AIResponse"
import { RelevanceFeedback } from "@/components/features/feedback/RelevanceFeedback"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ChaosChatMessageProps {
  role: "user" | "tutor"
  content: string
  timestamp?: Date
  aiResponse?: TutorResponse | null
  gradingReport?: GradingReport | null
  hint?: string | null
  isQuestion?: boolean
  isSpeech?: boolean
}

function StatusBadge({ response }: { response: TutorResponse }) {
  const hasErrors = response.feedback.grammar.length > 0
  const isCorrect = response.isCorrect

  if (isCorrect) {
    return (
      <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30 text-xs">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Excelent!
      </Badge>
    )
  }

  if (hasErrors) {
    const hasRealErrors = response.feedback.grammar.some(
      (e) => e.feedbackType === "error" || !e.feedbackType
    )
    if (hasRealErrors) {
      return (
        <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Needs work
        </Badge>
      )
    }
    return (
      <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
        <Sparkles className="h-3 w-3 mr-1" />
        Consider improvements
      </Badge>
    )
  }

  return (
    <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30 text-xs">
      <CheckCircle2 className="h-3 w-3 mr-1" />
      No issues detected
    </Badge>
  )
}

export function ChaosChatMessage({
  role,
  content,
  timestamp,
  aiResponse,
  gradingReport,
  hint,
  isQuestion,
  isSpeech,
}: ChaosChatMessageProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  if (role === "user") {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[85%] space-y-1">
          <div className="rounded-2xl rounded-tr-sm bg-accent/15 border border-accent/20 px-4 py-3">
            {isSpeech ? (
              <div className="flex items-center gap-2 text-sm">
                <Mic className="h-4 w-4 text-accent" />
                <span>{content}</span>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{content}</p>
            )}
          </div>
          {timestamp && (
            <p className="text-xs text-muted-foreground text-right pr-1">
              {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
          <User className="h-4 w-4 text-accent" />
        </div>
      </div>
    )
  }

  // Tutor message
  const hasFeedbackDetails = aiResponse && (
    aiResponse.feedback.grammar.length > 0 ||
    aiResponse.vocabHelp ||
    gradingReport
  )

  return (
    <div className="flex justify-start gap-2">
      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
        <GraduationCap className="h-4 w-4 text-primary" />
      </div>
      <div className="max-w-[85%] space-y-1">
        <div className="rounded-2xl rounded-tl-sm bg-primary/10 border border-primary/20 px-4 py-3">
          {/* Main content text */}
          <p className="text-sm whitespace-pre-wrap">{content}</p>

          {/* Status badge + score for feedback messages */}
          {aiResponse && !isQuestion && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge response={aiResponse} />
              {gradingReport && (
                <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
                  <Target className="h-3 w-3 mr-1" />
                  {gradingReport.overallScore}/100
                </Badge>
              )}
            </div>
          )}

          {/* Collapsible details */}
          {hasFeedbackDetails && !isQuestion && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {detailsOpen ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {detailsOpen ? "Hide details" : "View details"}
              </button>

              {detailsOpen && (
                <div className="mt-3 space-y-3 border-t border-primary/10 pt-3">
                  {/* Vocabulary Help */}
                  {aiResponse.vocabHelp && (
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center gap-2 mb-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-accent" />
                        <span className="text-xs font-medium text-accent">Vocabulary Help</span>
                      </div>
                      <p className="text-xs text-muted-foreground italic mb-1">"{aiResponse.vocabHelp.question}"</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-accent">{aiResponse.vocabHelp.word}</span>
                        <span className="text-xs text-muted-foreground">→</span>
                        <span className="text-sm font-semibold text-accent">{aiResponse.vocabHelp.translation}</span>
                      </div>
                      {aiResponse.vocabHelp.context && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Example: <span className="italic">{aiResponse.vocabHelp.context}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Grammar Errors */}
                  {aiResponse.feedback.grammar.filter(
                    (e) => e.feedbackType === "error" || !e.feedbackType
                  ).length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-xs font-medium text-destructive">Needs work:</span>
                      </div>
                      {aiResponse.feedback.grammar
                        .filter((e) => e.feedbackType === "error" || !e.feedbackType)
                        .map((error, i) => (
                          <GrammarErrorCard key={i} error={error} />
                        ))}
                    </div>
                  )}

                  {/* Grammar Suggestions */}
                  {aiResponse.feedback.grammar.filter(
                    (e) => e.feedbackType === "suggestion"
                  ).length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                        <span className="text-xs font-medium text-accent">Consider:</span>
                      </div>
                      {aiResponse.feedback.grammar
                        .filter((e) => e.feedbackType === "suggestion")
                        .map((error, i) => (
                          <GrammarSuggestionCard key={i} error={error} />
                        ))}
                    </div>
                  )}

                  {/* Semantic Feedback */}
                  <div className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-primary">Understanding:</span>
                      <span className="text-xs text-primary">
                        {Math.round(aiResponse.feedback.semantic.score * 100)}% match
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{aiResponse.feedback.semantic.feedback}</p>
                  </div>

                  {/* Pronunciation */}
                  {gradingReport?.rawReport?.pronunciation && (
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Volume2 className="h-3.5 w-3.5 text-accent" />
                        <span className="text-xs font-medium text-accent">Pronunciation</span>
                      </div>
                      {gradingReport.rawReport.pronunciation.transcribedText && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground">You said:</p>
                          <p className="text-xs italic">"{gradingReport.rawReport.pronunciation.transcribedText}"</p>
                        </div>
                      )}
                      {gradingReport.rawReport.pronunciation.pronunciationScore !== undefined && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Accuracy:</span>
                            <span className={cn(
                              "text-xs font-semibold",
                              gradingReport.rawReport.pronunciation.pronunciationScore >= 0.85
                                ? "text-chart-4"
                                : gradingReport.rawReport.pronunciation.pronunciationScore >= 0.70
                                ? "text-chart-3"
                                : "text-destructive"
                            )}>
                              {(gradingReport.rawReport.pronunciation.pronunciationScore * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
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
                        </div>
                      )}
                    </div>
                  )}

                  {/* Intonation Warnings */}
                  {gradingReport?.rawReport?.intonation?.warnings &&
                   gradingReport.rawReport.intonation.warnings.length > 0 && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-xs font-medium text-destructive">Intonation</span>
                      </div>
                      {gradingReport.rawReport.intonation.warnings.map((warning: any, i: number) => (
                        <div key={i} className="space-y-0.5 text-xs">
                          <p>Watch stress on <strong>"{warning.word}"</strong></p>
                          <p className="text-muted-foreground">
                            {warning.user_stress} → {warning.expected_stress}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Relevance */}
                  {gradingReport?.rawReport?.relevance && (
                    <RelevanceFeedback relevance={gradingReport.rawReport.relevance} />
                  )}

                  {/* Encouragement */}
                  {aiResponse.feedback.encouragement && (
                    <div className="p-2.5 rounded-lg bg-secondary/15 border border-secondary/20">
                      <p className="text-xs italic text-foreground/80">"{aiResponse.feedback.encouragement}"</p>
                    </div>
                  )}

                  {/* Grading Report Component Status */}
                  {gradingReport && (
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                      {gradingReport.formattedFeedback?.summary && (
                        <p className="text-xs text-muted-foreground mb-2">
                          {gradingReport.formattedFeedback.summary}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {gradingReport.componentStatus.grammar === "success" && (
                          <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/30 text-xs py-0">
                            Grammar ✓
                          </Badge>
                        )}
                        {gradingReport.componentStatus.semantic === "success" && (
                          <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/30 text-xs py-0">
                            Meaning ✓
                          </Badge>
                        )}
                        {gradingReport.componentStatus.pronunciation === "success" && (
                          <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/30 text-xs py-0">
                            Pronunciation ✓
                          </Badge>
                        )}
                        {gradingReport.componentStatus.intonation === "success" && (
                          <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/30 text-xs py-0">
                            Intonation ✓
                          </Badge>
                        )}
                        {gradingReport.componentStatus.relevance === "success" && (
                          <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/30 text-xs py-0">
                            On-topic ✓
                          </Badge>
                        )}
                      </div>
                      <Link
                        href="/error-garden"
                        className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                      >
                        View patterns in Error Garden
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hint for A1/A2 */}
        {hint && isQuestion && (
          <p className="text-xs text-muted-foreground pl-1">
            💡 Hint: {hint}
          </p>
        )}

        {timestamp && (
          <p className="text-xs text-muted-foreground pl-1">
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  )
}
