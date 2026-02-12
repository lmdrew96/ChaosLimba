import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Deep Fog",
  description: "Explore content beyond your comfort zone with fog-depth guidance",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
