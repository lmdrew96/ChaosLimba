import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account, learning preferences, and privacy settings",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
