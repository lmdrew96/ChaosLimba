/* ChaosLimbă service worker — conservative app-shell strategy.
   Caches static Next.js assets and the offline fallback. Passes through
   all API, auth, and webhook requests (NetworkOnly) so user-specific
   responses never get cached or leak across sessions. */

const VERSION = "v1"
const STATIC_CACHE = `chaoslimba-static-${VERSION}`
const OFFLINE_URL = "/offline.html"

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/logo.svg",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/apple-touch-icon.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("chaoslimba-") && key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

const isApiOrAuth = (url) => {
  if (url.origin !== self.location.origin) return true
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/sign-in") ||
    url.pathname.startsWith("/sign-up") ||
    url.pathname.startsWith("/__clerk") ||
    url.pathname.startsWith("/clerk")
  )
}

const isStaticAsset = (url) => {
  if (url.origin !== self.location.origin) return false
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/audio/") ||
    /\.(?:js|css|woff2?|ttf|png|jpg|jpeg|svg|ico|webp)$/i.test(url.pathname)
  )
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)

  if (isApiOrAuth(url)) return

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request)
          .then((response) => {
            if (response.ok && url.origin === self.location.origin) {
              const copy = response.clone()
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy))
            }
            return response
          })
          .catch(() => cached)
      })
    )
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((res) => res || Response.error())
      )
    )
  }
})
