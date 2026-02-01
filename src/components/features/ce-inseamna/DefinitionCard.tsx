"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookmarkPlus, GraduationCap, BookOpen, Quote, History } from "lucide-react"
import Link from "next/link"

interface DefinitionCardProps {
  word: string
  definition: string
  context: string
  examples: string[]
  etymology?: string
  onSaveToShelf: () => void
  isSaving: boolean
  savedToShelf: boolean
}

export function DefinitionCard({
  word,
  definition,
  context,
  examples,
  etymology,
  onSaveToShelf,
  isSaving,
  savedToShelf,
}: DefinitionCardProps) {
  return (
    <Card className="rounded-2xl border-border bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-3xl font-bold text-primary">{word}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Definition */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Definition
          </h3>
          <p className="text-foreground leading-relaxed">{definition}</p>
        </div>

        {/* Context */}
        {context && (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Quote className="h-3.5 w-3.5" />
              Context
            </h3>
            <p className="text-foreground/80 italic border-l-2 border-primary/30 pl-3">
              {context}
            </p>
          </div>
        )}

        {/* Examples */}
        {examples.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Examples
            </h3>
            <ul className="space-y-1.5">
              {examples.map((example, i) => (
                <li key={i} className="text-foreground/80 flex items-start gap-2">
                  <span className="text-primary font-mono text-xs mt-1">{i + 1}.</span>
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Etymology */}
        {etymology && (
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Etymology
            </h3>
            <p className="text-foreground/70 text-sm">{etymology}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSaveToShelf}
            disabled={isSaving || savedToShelf}
            className="gap-1.5"
          >
            <BookmarkPlus className="h-4 w-4" />
            {savedToShelf ? "Saved!" : isSaving ? "Saving..." : "Save to Mystery Shelf"}
          </Button>
          <Link href={`/ask-tutor?q=${encodeURIComponent(`Tell me more about "${word}"`)}`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <GraduationCap className="h-4 w-4" />
              Ask Tutor about this
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
