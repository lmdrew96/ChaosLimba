"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"

const errorTypes = [
  { value: "grammar", label: "Grammar" },
  { value: "pronunciation", label: "Pronunciation" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "word_order", label: "Word Order" },
] as const

const categoryPresets: Record<string, string[]> = {
  grammar: ["Genitive Case", "Dative Case", "Verb Conjugation", "Article Usage", "Plurals"],
  pronunciation: ["î/â Distinction", "Vowel Sounds", "Stress Patterns", "Consonant Clusters"],
  vocabulary: ["False Friends", "Word Choice", "Collocation", "Register"],
  word_order: ["Adjective Position", "Clitic Placement", "Negation Position", "Question Formation"],
}

type ErrorLogModalProps = {
  onErrorLogged?: () => void
}

export function ErrorLogModal({ onErrorLogged }: ErrorLogModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorType, setErrorType] = useState<string>("")
  const [category, setCategory] = useState("")
  const [context, setContext] = useState("")
  const [correction, setCorrection] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!errorType) return

    setLoading(true)
    try {
      const response = await fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorType,
          category: category || null,
          context: context || null,
          correction: correction || null,
          source: "manual",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to log error")
      }

      // Reset form
      setErrorType("")
      setCategory("")
      setContext("")
      setCorrection("")
      setOpen(false)
      onErrorLogged?.()
    } catch (error) {
      console.error("Failed to log error:", error)
    } finally {
      setLoading(false)
    }
  }

  const availableCategories = errorType ? categoryPresets[errorType] || [] : []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-lg bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Log Error
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log a New Error</DialogTitle>
          <DialogDescription>
            Track your mistakes to build your personalized learning curriculum
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="errorType">Error Type *</Label>
            <Select value={errorType} onValueChange={setErrorType}>
              <SelectTrigger>
                <SelectValue placeholder="Select error type" />
              </SelectTrigger>
              <SelectContent>
                {errorTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={!errorType}>
              <SelectTrigger>
                <SelectValue placeholder={errorType ? "Select category" : "Select error type first"} />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">What you wrote/said (optional)</Label>
            <Input
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., al casei"
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="correction">Correct form (optional)</Label>
            <Input
              id="correction"
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              placeholder="e.g., a casei"
              className="font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!errorType || loading}
              className="rounded-lg bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : (
                "Log Error"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
