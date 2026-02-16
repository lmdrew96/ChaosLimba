"use client"

import { useEffect, useRef } from "react"

/**
 * Warns the user before navigating away from the page when a session is active.
 * Covers browser-level navigation (refresh, close tab) and client-side navigation (sidebar links, back/forward).
 */
export function useNavigationGuard(shouldBlock: boolean) {
  const shouldBlockRef = useRef(shouldBlock)
  shouldBlockRef.current = shouldBlock

  useEffect(() => {
    if (!shouldBlock) return

    // 1. Browser-level navigation (refresh, close tab, address bar)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!shouldBlockRef.current) return
      e.preventDefault()
    }

    // 2. Client-side navigation (Next.js Link clicks use pushState)
    const originalPushState = history.pushState.bind(history)
    history.pushState = function (...args: Parameters<typeof history.pushState>) {
      if (shouldBlockRef.current) {
        const confirmed = window.confirm(
          "You have an active session. Leaving will end it. Are you sure?"
        )
        if (!confirmed) return
      }
      return originalPushState(...args)
    }

    // 3. Back/forward button
    const handlePopState = () => {
      if (!shouldBlockRef.current) return
      const confirmed = window.confirm(
        "You have an active session. Leaving will end it. Are you sure?"
      )
      if (!confirmed) {
        // Push current URL back to undo the back navigation
        history.pushState(null, "", window.location.href)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
      history.pushState = originalPushState
    }
  }, [shouldBlock])
}
