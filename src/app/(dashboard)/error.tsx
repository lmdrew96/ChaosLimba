"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import Link from "next/link"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Error boundary caught an error — logged automatically by Next.js
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full rounded-2xl border-destructive/30 bg-card/50 backdrop-blur">
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. This has been logged and we&apos;ll look into it.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={reset}
              variant="default"
              className="rounded-xl gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl gap-2"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>

          {error.digest && (
            <p className="text-xs text-muted-foreground/50">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
