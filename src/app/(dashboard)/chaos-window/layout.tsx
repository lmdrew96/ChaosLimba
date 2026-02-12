import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Chaos Window",
  description: "Timed practice sessions with AI-powered feedback and smart content selection",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
