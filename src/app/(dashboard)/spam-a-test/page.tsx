"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Loader2, Shield, CheckCircle2, XCircle } from "lucide-react"

interface SpamAResult {
  similarity: number
  semanticMatch: boolean
  threshold: number
  fallbackUsed: boolean
}

export default function SpamATestPage() {
  const [userText, setUserText] = useState("")
  const [expectedText, setExpectedText] = useState("")
  const [threshold, setThreshold] = useState(0.75)
  const [result, setResult] = useState<SpamAResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async () => {
    if (!userText.trim() || !expectedText.trim()) {
      setError("Both texts are required")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/spam-a", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText, expectedText, threshold }),
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
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SPAM-A: Semantic Similarity Test (Romanian)
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Compare two Romanian texts to see how semantically similar they are using BERT embeddings
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userText">User's Response</Label>
              <Textarea
                id="userText"
                placeholder="e.g., Aceasta este o casă frumoasă"
                value={userText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserText(e.target.value)}
                className="mt-1 min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="expectedText">Expected Answer</Label>
              <Textarea
                id="expectedText"
                placeholder="e.g., Aceasta este o locuință minunată"
                value={expectedText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExpectedText(e.target.value)}
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="threshold">
              Similarity Threshold: {(threshold * 100).toFixed(0)}%
            </Label>
            <Slider
              id="threshold"
              min={0}
              max={100}
              step={5}
              value={[threshold * 100]}
              onValueChange={(values: number[]) => setThreshold(values[0] / 100)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum similarity required to consider texts as semantically matching
            </p>
          </div>

          <Button
            onClick={handleTest}
            disabled={loading || !userText.trim() || !expectedText.trim()}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Compare Semantic Similarity
          </Button>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                {result.semanticMatch ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <h3 className="font-semibold">
                  {result.semanticMatch ? "Semantic Match ✓" : "No Match ✗"}
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between bg-muted p-3 rounded">
                  <span className="text-sm font-medium">Similarity Score:</span>
                  <span className="text-2xl font-bold">
                    {(result.similarity * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Threshold:</span>
                  <span>{(result.threshold * 100).toFixed(0)}%</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fallback used:</span>
                  <span>{result.fallbackUsed ? "Yes" : "No"}</span>
                </div>

                {result.fallbackUsed && (
                  <p className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-950 p-2 rounded">
                    ⚠️ The model call failed; a fallback result was returned.
                  </p>
                )}

                {!result.fallbackUsed && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                    <p className="font-medium mb-2">How to interpret the score:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• <strong>90-100%</strong>: Nearly identical meaning</li>
                      <li>• <strong>75-90%</strong>: Very similar, acceptable variation</li>
                      <li>• <strong>60-75%</strong>: Related but different meaning</li>
                      <li>• <strong>&lt;60%</strong>: Different meanings</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example scenarios */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Example Test Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="font-medium">Try these Romanian examples:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <strong>High similarity:</strong><br />
                User: "Aceasta este o casă frumoasă"<br />
                Expected: "Aceasta este o locuință minunată"
              </li>
              <li>
                <strong>Medium similarity:</strong><br />
                User: "Îmi place să citesc cărți"<br />
                Expected: "Îmi place literatura"
              </li>
              <li>
                <strong>Low similarity:</strong><br />
                User: "Vremea este frumoasă astăzi"<br />
                Expected: "Mâine va ploua"
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
