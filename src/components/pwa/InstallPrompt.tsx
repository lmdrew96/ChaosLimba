"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "chaoslimba-pwa-install-dismissed"

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(display-mode: standalone)").matches) return
    if (localStorage.getItem(DISMISS_KEY) === "1") return

    const handler = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const dismiss = () => {
    setVisible(false)
    setDeferredPrompt(null)
    try {
      localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      // ignore private-mode storage failures
    }
  }

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted" || outcome === "dismissed") {
      dismiss()
    }
  }

  if (!visible || !deferredPrompt) return null

  return (
    <div
      role="dialog"
      aria-label="Install ChaosLimbă"
      className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-lg"
    >
      <Download className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium">Install ChaosLimbă</p>
        <p className="text-xs text-muted-foreground">
          Add it to your home screen for faster, app-like access.
        </p>
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={install}>
            Install
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Not now
          </Button>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
