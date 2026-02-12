import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ce Înseamnă?",
  description: "Look up Romanian words and phrases with AI-powered definitions and examples",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
