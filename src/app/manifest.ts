import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ChaosLimbă",
    short_name: "ChaosLimbă",
    description:
      "AI-powered Romanian language learning through productive confusion and structured chaos",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#1E1830",
    background_color: "#1E1830",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
