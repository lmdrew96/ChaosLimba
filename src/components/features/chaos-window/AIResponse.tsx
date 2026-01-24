"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react"
import { TutorResponse, GrammarError } from "@/lib/ai/tutor"
import { cn } from "@/lib/utils"

interface AIResponseProps {
  response?: TutorResponse | null
  isLoading?: boolean
}

export function AIResponse({ response, isLoading }: AIResponseProps) {
  if (isLoading) {
    return (
      <Card className="rounded-xl border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-violet-500/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <MessageSquare className="h-5 w-5 text-purple-400 animate-pulse" />
            </div>
            <h4 className="font-medium">AI Tutor is thinking...</h4>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-purple-500/20 rounded-full animate-pulse" />
            <div className="h-3 bg-purple-500/20 rounded-full animate-pulse w-4/5" />
            <div className="h-3 bg-purple-500/20 rounded-full animate-pulse w-3/5" />
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
    <Card className="rounded-xl border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-violet-500/5">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <MessageSquare className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">AI Tutor</h4>
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Excelent!
                </Badge>
              ) : hasErrors ? (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Needs work
                </Badge>
              ) : (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Good attempt
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Overall Feedback */}
        <div className="p-3 rounded-lg bg-background/50">
          <p className="text-sm">{response.feedback.overall}</p>
        </div>

        {/* Grammar Errors */}
        {response.feedback.grammar.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-purple-300">Grammar Feedback:</h5>
            <div className="space-y-2">
              {response.feedback.grammar.map((error, index) => (
                <GrammarErrorCard key={index} error={error} />
              ))}
            </div>
          </div>
        )}

        {/* Semantic Feedback */}
        <div className="p-3 rounded-lg bg-background/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-purple-300">Understanding:</span>
            <span className="text-sm text-purple-400">
              {Math.round(response.feedback.semantic.score * 100)}% match
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{response.feedback.semantic.feedback}</p>
        </div>

        {/* Encouragement */}
        {response.feedback.encouragement && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <p className="text-sm italic text-purple-200">"{response.feedback.encouragement}"</p>
          </div>
        )}

        {/* Next Question */}
        {response.nextQuestion && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-pink-500/10 to-orange-500/10 border border-pink-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-pink-400" />
              <h5 className="font-medium text-pink-300">Next question:</h5>
            </div>
            <p className="text-sm">{response.nextQuestion}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function GrammarErrorCard({ error }: { error: GrammarError }) {
  const severityColors = {
    minor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    major: "bg-orange-500/10 text-orange-400 border-orange-500/20", 
    critical: "bg-red-500/10 text-red-400 border-red-500/20"
  }

  return (
    <div className={cn(
      "p-3 rounded-lg border text-sm",
      severityColors[error.severity]
    )}>
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
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
