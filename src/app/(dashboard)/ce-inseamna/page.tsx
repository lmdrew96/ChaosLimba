"use client"

import { useState, type FormEvent } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CircleQuestionMark, Search, Loader2 } from "lucide-react"
import { DefinitionCard } from "@/components/features/ce-inseamna/DefinitionCard"

type MysteryAnalysis = {
  definition: string
  context: string
  examples: string[]
  etymology?: string
}

type HistoryItem = {
  word: string
  result: MysteryAnalysis
}

export default function CeInseamnaPage() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<MysteryAnalysis | null>(null)
  const [currentWord, setCurrentWord] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [savedToShelf, setSavedToShelf] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const word = query.trim()
    if (!word) return

    // Check session history cache first
    const cached = history.find(
      (h) => h.word.toLowerCase() === word.toLowerCase()
    )
    if (cached) {
      setResult(cached.result)
      setCurrentWord(cached.word)
      setSavedToShelf(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setSavedToShelf(false)

    try {
      const res = await fetch("/api/ce-inseamna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      const data: MysteryAnalysis = await res.json()
      setResult(data)
      setCurrentWord(word)
      setHistory((prev) => [{ word, result: data }, ...prev.filter((h) => h.word.toLowerCase() !== word.toLowerCase())])
    } catch (err) {
      console.error("[Ce înseamnă]", err)
      setError("Nu am putut analiza cuvântul. Încearcă din nou.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveToShelf() {
    if (!result || !currentWord) return
    setIsSaving(true)

    try {
      const res = await fetch("/api/mystery-shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: currentWord,
          context: result.context,
          definition: result.definition,
          source: "ce-inseamna",
        }),
      })

      if (!res.ok) throw new Error("Failed to save")
      setSavedToShelf(true)
    } catch (err) {
      console.error("[Ce înseamnă] Save failed:", err)
    } finally {
      setIsSaving(false)
    }
  }

  function handleHistoryClick(item: HistoryItem) {
    setQuery(item.word)
    setResult(item.result)
    setCurrentWord(item.word)
    setSavedToShelf(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CircleQuestionMark className="h-7 w-7 text-primary" />
          Ce înseamnă?
        </h1>
        <p className="text-muted-foreground">
          Quick translations and definitions for Romanian words and phrases
        </p>
      </div>

      {/* Search */}
      <Card className="rounded-2xl border-border">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a Romanian word or phrase..."
                className="pl-9"
                maxLength={200}
                autoFocus
              />
            </div>
            <Button type="submit" disabled={isLoading || !query.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Ce înseamnă?"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="text-destructive text-sm text-center">{error}</div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground text-sm">
              Asking the Oracle...
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !isLoading && (
        <DefinitionCard
          word={currentWord}
          definition={result.definition}
          context={result.context}
          examples={result.examples}
          etymology={result.etymology}
          onSaveToShelf={handleSaveToShelf}
          isSaving={isSaving}
          savedToShelf={savedToShelf}
        />
      )}

      {/* Session History */}
      {history.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Looked up this session
          </h3>
          <div className="flex flex-wrap gap-2">
            {history.map((item) => (
              <button
                key={item.word}
                onClick={() => handleHistoryClick(item)}
                className="px-3 py-1 rounded-full bg-muted text-sm text-foreground hover:bg-primary/20 transition-colors"
              >
                {item.word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
