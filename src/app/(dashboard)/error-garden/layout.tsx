import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Error Garden",
  description: "Visualize your error patterns, track fossilization risks, and grow from mistakes",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
