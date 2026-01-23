"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Shield } from "lucide-react"

interface SpamAResult {
  label: string
  score: number
  raw: unknown
  fallbackUsed: boolean
}

export default function SpamATestPage() {
  const [text, setText] = useState("")
  const [result, setResult] = useState<SpamAResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async () => {
    if (!text.trim()) {
      setError("Text cannot be empty")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/spam-a", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const err = await response.text()
        setError(`API error: ${response.status} ${err}`)
        return
      }

      const data = await response.json()
      setResult(data.result)
    } catch (e) {
      setError(`Network error: ${e}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SPAM-A Test (Romanian)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="text">Romanian text to analyze</Label>
            <Input
              id="text"
              placeholder="Introduceți textul aici..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1"
            />
          </div>

          <Button onClick={handleTest} disabled={loading || !text.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze
          </Button>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-2">
              <h3 className="font-semibold">Result</h3>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Label:</strong> {result.label}
                </p>
                <p>
                  <strong>Score:</strong> {result.score.toFixed(4)}
                </p>
                <p>
                  <strong>Fallback used:</strong> {result.fallbackUsed ? "Yes" : "No"}
                </p>
                {result.fallbackUsed && (
                  <p className="text-muted-foreground">
                    The model call failed; a fallback result was returned.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
