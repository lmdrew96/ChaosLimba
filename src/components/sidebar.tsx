"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  Cloud,
  Flower2,
  TrendingUp,
  Menu,
  X,
  Atom,
  Wrench,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Your learning overview",
  },
  {
    name: "Chaos Window",
    href: "/chaos-window",
    icon: Atom,
    description: "Speak and write",
  },
  {
    name: "Workshop",
    href: "/workshop",
    icon: Wrench,
    description: "Grammar micro-challenges",
  },
  {
    name: "Deep Fog",
    href: "/deep-fog",
    icon: Cloud,
    description: "Immersive content",
  },
  {
    name: "Error Garden",
    href: "/error-garden",
    icon: Flower2,
    description: "Your error patterns",
  },
  {
    name: "Mystery Shelf",
    href: "/mystery-shelf",
    icon: BookOpen,
    description: "Collected unknowns",
  },
  {
    name: "Proficiency Tracker",
    href: "/proficiency-tracker",
    icon: TrendingUp,
    description: "Your CEFR progress",
  },
]


export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 border-r border-border/40 bg-gradient-to-b from-background via-background to-primary/10 transition-transform duration-300 ease-in-out md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-6 border-b border-border/40">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-foreground/70 to-primary/70 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">🤪</span>
                </div>
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-foreground to-primary/70 bg-clip-text text-transparent">
                ChaosLimbă
              </span>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-lg shadow-primary/5"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    <span
                      className={cn(
                        "text-xs transition-opacity",
                        isActive
                          ? "text-primary/70"
                          : "text-muted-foreground/50 group-hover:text-muted-foreground/70"
                      )}
                    >
                      {item.description}
                    </span>
                  </div>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border/40">
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 text-center">
              <p className="text-xs text-muted-foreground italic">
                "We provide the method.
                <br />
                You provide the mess."
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
