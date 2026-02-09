"use client"

import { useEffect, useState } from "react"
import { Check, Palette } from "lucide-react"

type Theme = "default" | "forest" | "nostalgia" | "wild-runes" | "bathhouse" | "vinyl" | "neon-circuit" | "soft-bloom"
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
  {
    id: "wild-runes",
    name: "Wild Runes",
    description: "Ancient tech and open-world wonder",
    lightColors: ["#F4EFE6", "#2A98A8", "#C89040", "#88B07A", "#C25040"],
    darkColors: ["#1C2838", "#58D8F0", "#E0A848", "#488078", "#C8D8E8"],
  },
  {
    id: "bathhouse",
    name: "Bathhouse Glow",
    description: "Spirited warmth and lantern light",
    lightColors: ["#F0E0E4", "#C03028", "#C0A030", "#388890", "#7838A0"],
    darkColors: ["#181028", "#E85040", "#F0C050", "#388878", "#E8D8C0"],
  },
  {
    id: "vinyl",
    name: "Vinyl Era",
    description: "1970s warmth, retro soul",
    lightColors: ["#F2ECD8", "#C06830", "#C8A830", "#608848", "#984030"],
    darkColors: ["#302018", "#E08838", "#E0C040", "#58A050", "#F0E8D0"],
  },
  {
    id: "neon-circuit",
    name: "Neon Circuit",
    description: "Cyberpunk glow and electric edge",
    lightColors: ["#EEF0F8", "#2858D0", "#D038A0", "#48C060", "#E06030"],
    darkColors: ["#0C1020", "#4890FF", "#F048B0", "#50F078", "#E8EAF0"],
  },
  {
    id: "soft-bloom",
    name: "Soft Bloom",
    description: "Gentle pastels, calm and dreamy",
    lightColors: ["#F5E8EE", "#D88898", "#98D8B8", "#B8A8D8", "#D89870"],
    darkColors: ["#281830", "#E888A0", "#60C898", "#A888D0", "#F0E0E8"],
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
    html.classList.remove("theme-forest", "theme-nostalgia", "theme-wild-runes", "theme-bathhouse", "theme-vinyl", "theme-neon-circuit", "theme-soft-bloom", "dark")

    // Apply selected theme
    const themeClassMap: Record<string, string> = {
      forest: "theme-forest",
      nostalgia: "theme-nostalgia",
      "wild-runes": "theme-wild-runes",
      bathhouse: "theme-bathhouse",
      vinyl: "theme-vinyl",
      "neon-circuit": "theme-neon-circuit",
      "soft-bloom": "theme-soft-bloom",
    }
    const themeClass = themeClassMap[selectedTheme]
    if (themeClass) {
      html.classList.add(themeClass)
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


  return (
    <div className="space-y-4">
      {/* Theme Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
