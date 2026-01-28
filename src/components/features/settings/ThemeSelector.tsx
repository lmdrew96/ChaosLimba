"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Check, Palette, Moon, Sun } from "lucide-react"

type Theme = "default" | "forest" | "nostalgia"
type Mode = "light" | "dark"

interface ThemeOption {
  id: Theme
  name: string
  description: string
  lightColors: string[]
  darkColors: string[]
}

const THEMES: ThemeOption[] = [
  {
    id: "default",
    name: "Modern Glass",
    description: "High-tech, glassy, and futuristic",
    lightColors: ["#FFFFFF", "#7B5FA1", "#4BB3C8", "#C5A5DC", "#D9534F"],
    darkColors: ["#2A2A2A", "#B591E8", "#6BD7ED", "#805DA8", "#E8705C"],
  },
  {
    id: "forest",
    name: "Forest Haven",
    description: "Natural greens, teals, and earth tones",
    lightColors: ["#FAFCF9", "#2C5F4F", "#5FA896", "#BDCFB3", "#C48B66"],
    darkColors: ["#1A3229", "#D9F0E8", "#6FC3B5", "#4F7765", "#E8A96E"],
  },
  {
    id: "nostalgia",
    name: "Neon Nostalgia",
    description: "2010s Tumblr aesthetic vibes",
    lightColors: ["#F5F3F7", "#4A4552", "#D896BC", "#C7EFDC", "#B8B4E8"],
    darkColors: ["#2A1E3F", "#87E7FF", "#FF4DA0", "#6B5AA6", "#FF87C8"],
  },
]

export default function ThemeSelector() {
  const [selectedTheme, setSelectedTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem("chaoslimba-theme") as Theme) || "default"
    }
    return "default"
  })

  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem("chaoslimba-mode") as Mode) || "dark"
    }
    return "dark"
  })

  // Apply theme to document
  useEffect(() => {
    const html = document.documentElement

    // Remove all theme classes
    html.classList.remove("theme-forest", "theme-nostalgia", "dark")

    // Apply selected theme
    if (selectedTheme === "forest") {
      html.classList.add("theme-forest")
    } else if (selectedTheme === "nostalgia") {
      html.classList.add("theme-nostalgia")
    }

    // Apply mode
    if (mode === "dark") {
      html.classList.add("dark")
    }

    // Save to localStorage
    localStorage.setItem("chaoslimba-theme", selectedTheme)
    localStorage.setItem("chaoslimba-mode", mode)
  }, [selectedTheme, mode])

  const handleThemeSelect = (theme: Theme) => {
    setSelectedTheme(theme)
  }

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"))
  }

  return (
    <div className="space-y-4">
      {/* Light/Dark Mode Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/40">
        <div className="flex items-center gap-3">
          {mode === "light" ? (
            <Sun className="h-5 w-5 text-amber-500" />
          ) : (
            <Moon className="h-5 w-5 text-violet-400" />
          )}
          <div>
            <Label className="text-base font-medium">
              {mode === "light" ? "Light Mode" : "Dark Mode"}
            </Label>
            <p className="text-sm text-muted-foreground">
              Switch between light and dark appearance
            </p>
          </div>
        </div>
        <button
          onClick={toggleMode}
          className="px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-medium transition-colors"
        >
          Toggle
        </button>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {THEMES.map((theme) => {
          const isSelected = selectedTheme === theme.id
          const colors = mode === "light" ? theme.lightColors : theme.darkColors

          return (
            <button
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              className={`
                relative text-left rounded-2xl border-2 transition-all duration-200
                hover:scale-[1.02] hover:shadow-lg
                ${
                  isSelected
                    ? "border-primary shadow-lg ring-4 ring-primary/20"
                    : "border-border/40 hover:border-primary/50"
                }
              `}
            >
              <div className="p-4 space-y-3">
                {/* Theme Name */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-base">{theme.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {theme.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Color Preview */}
                <div className="flex gap-1.5">
                  {colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="h-8 flex-1 rounded-lg border border-border/20 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Current Theme Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
        <Palette className="h-4 w-4" />
        <span>
          Currently using: <strong className="text-foreground">{THEMES.find(t => t.id === selectedTheme)?.name}</strong> ({mode} mode)
        </span>
      </div>
    </div>
  )
}
