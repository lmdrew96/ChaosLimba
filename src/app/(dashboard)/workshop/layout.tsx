import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Workshop",
  description: "Grammar challenges targeting your weak spots with adaptive difficulty",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
