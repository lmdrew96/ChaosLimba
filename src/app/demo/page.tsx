"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import ReactMarkdown from "react-markdown"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Atom,
  Wrench,
  Flower2,
  Cloud,
  BookOpen,
  TrendingUp,
  Brain,
  Sparkles,
  ArrowRight,
  Check,
  Sun,
  Moon,
  Palette,
  Send,
  Lightbulb,
  ArrowRightLeft,
  PenLine,
  RotateCcw,
  CircleHelp,
  TriangleAlert,
  Zap,
  ScrollText,
  ChevronRight,
  Shuffle,
  Timer,
  Shield,
  RefreshCw,
  Loader2,
} from "lucide-react"

// ─── DEMO CHALLENGE DATA ───────────────────────────────────────────────────────

interface DemoChallenge {
  type: string
  prompt: string
  targetSentence?: string
  hint: string
  options?: string[]
  expectedAnswers: string[]
  featureKey: string
  featureName: string
  grammarRule: string
}

const DEMO_CHALLENGES: DemoChallenge[] = [
  {
    type: "fix",
    prompt: "Find the grammar error and rewrite the sentence correctly.",
    targetSentence: "Eu **merg** la magazin ieri.",
    hint: "Think about verb tense — does the time expression match the verb form?",
    expectedAnswers: ["Eu am mers la magazin ieri.", "Am mers la magazin ieri."],
    featureKey: "past_tense_perfect_compus",
    featureName: "Past Tense (Perfectul compus)",
    grammarRule: "\"Ieri\" (yesterday) requires perfectul compus. Present tense \"merg\" must become \"am mers\".",
  },
  {
    type: "transform",
    prompt: "Change this sentence from **informal** to **formal** (use the polite form).",
    targetSentence: "Tu **vrei** un ceai?",
    hint: "Romanian uses \"dumneavoastră\" for formal address, and verbs change to match.",
    expectedAnswers: ["Dumneavoastră vreți un ceai?", "Dvs. vreți un ceai?"],
    featureKey: "formal_informal_address",
    featureName: "Formal vs. Informal Address",
    grammarRule: "Romanian uses \"dumneavoastră\" for formal address. The verb conjugates to 2nd person plural: vrei → vreți.",
  },
  {
    type: "complete",
    prompt: "Fill in the blank with the correct form of the article.",
    targetSentence: "Am cumpărat _____ carte interesantă.",
    hint: "\"Carte\" is feminine. What's the feminine indefinite article?",
    expectedAnswers: ["o"],
    featureKey: "definite_article",
    featureName: "Romanian Articles",
    grammarRule: "\"Carte\" is feminine and needs the indefinite article \"o\". The definite article is a suffix (-a), the indefinite is a separate word.",
  },
  {
    type: "which_one",
    prompt: "Which sentence uses the **subjunctive** correctly?",
    options: [
      "Vreau că merg acasă.",
      "Vreau să merg acasă.",
      "Vreau de merg acasă.",
      "Vreau la merg acasă.",
    ],
    hint: "After verbs of wanting, Romanian uses a special particle before the verb.",
    expectedAnswers: ["Vreau să merg acasă."],
    featureKey: "subjunctive_sa",
    featureName: "Subjunctive Mood (Conjunctivul)",
    grammarRule: "After verbs of wanting/wishing, Romanian uses \"să\" + subjunctive, not \"că\".",
  },
  {
    type: "rewrite",
    prompt: "Translate this into Romanian using the **dative** case.",
    targetSentence: "I gave the book **to Maria**.",
    hint: "In Romanian, feminine names take the dative form with \"-ei\" suffix.",
    expectedAnswers: ["I-am dat cartea Mariei.", "Am dat cartea Mariei."],
    featureKey: "dative_case",
    featureName: "Dative Case",
    grammarRule: "Romanian marks indirect objects with the dative case. Feminine proper nouns like Maria → Mariei. Pronominal doubling with clitic \"i-\" is required.",
  },
  {
    type: "spot_the_trap",
    prompt: "This sentence looks correct but has a subtle error. Find it and fix it.",
    targetSentence: "Copiii **meu** sunt la școală.",
    hint: "Check if the possessive adjective agrees with the noun it modifies.",
    expectedAnswers: ["Copiii mei sunt la școală."],
    featureKey: "possessive_agreement",
    featureName: "Possessive Agreement",
    grammarRule: "Possessive adjectives must agree in gender and number with the noun. Copiii (masc. pl.) requires \"mei\" not \"meu\" (masc. sg.).",
  },
]

// ─── DEMO ERROR GARDEN DATA ────────────────────────────────────────────────────

interface DemoErrorPattern {
  name: string
  category: string
  frequency: number
  tier: number
  examples: string[]
  barClass: string
}

const DEMO_ERROR_PATTERNS: DemoErrorPattern[] = [
  {
    name: "Verb-Subject Agreement",
    category: "Morphology",
    frequency: 72,
    tier: 2,
    examples: ["Ei merge → Ei merg", "Noi face → Noi facem"],
    barClass: "bg-chart-4",
  },
  {
    name: "Article Placement",
    category: "Syntax",
    frequency: 58,
    tier: 1,
    examples: ["un casa → o casă", "cartea bună → buna carte"],
    barClass: "bg-chart-3",
  },
  {
    name: "Case Marking (Dative)",
    category: "Morphology",
    frequency: 45,
    tier: 1,
    examples: ["pentru Maria → Mariei", "la profesorul → profesorului"],
    barClass: "bg-primary",
  },
  {
    name: "L1 Transfer (word order)",
    category: "Transfer",
    frequency: 38,
    tier: 1,
    examples: ["Eu nu sunt acasă → Nu sunt acasă", "Am mers ieri → Ieri am mers"],
    barClass: "bg-accent",
  },
  {
    name: "Subjunctive Avoidance",
    category: "Syntax",
    frequency: 82,
    tier: 3,
    examples: ["Vreau că merg → Vreau să merg", "E bine că mergi → E bine să mergi"],
    barClass: "bg-destructive",
  },
]

// ─── THEME DATA ────────────────────────────────────────────────────────────────

type Theme = "default" | "forest" | "nostalgia" | "wild-runes" | "bathhouse" | "vinyl" | "neon-circuit" | "soft-bloom"

interface ThemeOption {
  id: Theme
  name: string
  description: string
  lightColors: string[]
  darkColors: string[]
}

const THEMES: ThemeOption[] = [
  { id: "default", name: "Modern Glass", description: "High-tech, glassy, futuristic", lightColors: ["#FFFFFF", "#7B5FA1", "#4BB3C8", "#C5A5DC", "#D9534F"], darkColors: ["#2A2A2A", "#B591E8", "#6BD7ED", "#805DA8", "#E8705C"] },
  { id: "forest", name: "Forest Haven", description: "Natural greens and earth tones", lightColors: ["#FAFCF9", "#2C5F4F", "#5FA896", "#BDCFB3", "#C48B66"], darkColors: ["#1A3229", "#D9F0E8", "#6FC3B5", "#4F7765", "#E8A96E"] },
  { id: "nostalgia", name: "Neon Nostalgia", description: "2010s Tumblr aesthetic vibes", lightColors: ["#F5F3F7", "#4A4552", "#D896BC", "#C7EFDC", "#B8B4E8"], darkColors: ["#2A1E3F", "#87E7FF", "#FF4DA0", "#6B5AA6", "#FF87C8"] },
  { id: "wild-runes", name: "Wild Runes", description: "Ancient tech and open-world wonder", lightColors: ["#F4EFE6", "#2A98A8", "#C89040", "#88B07A", "#C25040"], darkColors: ["#1C2838", "#58D8F0", "#E0A848", "#488078", "#C8D8E8"] },
  { id: "bathhouse", name: "Bathhouse Glow", description: "Spirited warmth and lantern light", lightColors: ["#F0E0E4", "#C03028", "#C0A030", "#388890", "#7838A0"], darkColors: ["#181028", "#E85040", "#F0C050", "#388878", "#E8D8C0"] },
  { id: "vinyl", name: "Vinyl Era", description: "1970s warmth, retro soul", lightColors: ["#F2ECD8", "#C06830", "#C8A830", "#608848", "#984030"], darkColors: ["#302018", "#E08838", "#E0C040", "#58A050", "#F0E8D0"] },
  { id: "neon-circuit", name: "Neon Circuit", description: "Cyberpunk glow and electric edge", lightColors: ["#EEF0F8", "#2858D0", "#D038A0", "#48C060", "#E06030"], darkColors: ["#0C1020", "#4890FF", "#F048B0", "#50F078", "#E8EAF0"] },
  { id: "soft-bloom", name: "Soft Bloom", description: "Gentle pastels, calm and dreamy", lightColors: ["#F5E8EE", "#D88898", "#98D8B8", "#B8A8D8", "#D89870"], darkColors: ["#281830", "#E888A0", "#60C898", "#A888D0", "#F0E0E8"] },
]

// ─── CHALLENGE TYPE CONFIG ─────────────────────────────────────────────────────

const challengeTypeConfig: Record<string, { label: string; color: string; borderColor: string; icon: React.ElementType }> = {
  transform: { label: "Transform", color: "bg-accent/20 text-accent border-accent/30", borderColor: "border-l-accent", icon: ArrowRightLeft },
  complete: { label: "Complete", color: "bg-chart-4/20 text-chart-4 border-chart-4/30", borderColor: "border-l-chart-4", icon: PenLine },
  fix: { label: "Fix", color: "bg-chart-3/20 text-chart-3 border-chart-3/30", borderColor: "border-l-chart-3", icon: Wrench },
  rewrite: { label: "Rewrite", color: "bg-primary/20 text-primary border-primary/30", borderColor: "border-l-primary", icon: RotateCcw },
  which_one: { label: "Which One?", color: "bg-secondary/20 text-secondary border-secondary/30", borderColor: "border-l-secondary", icon: CircleHelp },
  spot_the_trap: { label: "Spot the Trap", color: "bg-destructive/20 text-destructive border-destructive/30", borderColor: "border-l-destructive", icon: TriangleAlert },
}

// ─── FEATURE CARDS ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    name: "Chaos Window",
    description: "Time-boxed practice sessions with AI feedback on your speaking and writing. No streaks, no guilt — just focused chaos.",
    icon: Atom,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    name: "Workshop",
    description: "7 types of grammar micro-challenges that target your actual weak spots — not generic textbook exercises.",
    icon: Wrench,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    name: "Error Garden",
    description: "Your errors aren't failures — they're data. Watch patterns emerge, track fossilization risks, and see your interlanguage evolve.",
    icon: Flower2,
    color: "text-chart-4",
    bg: "bg-chart-4/10",
  },
  {
    name: "Deep Fog",
    description: "Immerse yourself in authentic Romanian content at your level. Productive confusion is the threshold of understanding.",
    icon: Cloud,
    color: "text-chart-3",
    bg: "bg-chart-3/10",
  },
  {
    name: "Mystery Shelf",
    description: "Collect unknown words and phrases as you learn. Explore them with AI, listen to pronunciation, build your lexicon.",
    icon: BookOpen,
    color: "text-chart-5",
    bg: "bg-chart-5/10",
  },
  {
    name: "AI Tutor",
    description: "Ask anything about Romanian. Get explanations grounded in linguistics, not just translations. Powered by a 10-component AI ensemble.",
    icon: Brain,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    name: "Proficiency Tracker",
    description: "CEFR-aligned progress tracking across reading, writing, speaking, and listening. Real data, not gamified illusions.",
    icon: TrendingUp,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    name: "Journey",
    description: "AI-generated learning narratives that reflect on your progress. A linguistic autobiography that grows with you.",
    icon: ScrollText,
    color: "text-accent",
    bg: "bg-accent/10",
  },
]

// ─── COMPONENT ─────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const { resolvedTheme, setTheme: setMode } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<Theme>("default")

  // Workshop demo state
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [response, setResponse] = useState("")
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState<{
    isCorrect: boolean
    score: number
    feedback: string
    correction?: string
    ruleExplanation: string
  } | null>(null)

  const challenge = DEMO_CHALLENGES[challengeIndex]
  const isMultipleChoice = challenge.type === "which_one" && (challenge.options?.length ?? 0) > 0
  const config = challengeTypeConfig[challenge.type] || challengeTypeConfig.transform
  const TypeIcon = config.icon

  useEffect(() => { setMounted(true) }, [])

  // Theme switching
  useEffect(() => {
    if (!mounted) return
    const html = document.documentElement
    html.classList.remove("theme-forest", "theme-nostalgia", "theme-wild-runes", "theme-bathhouse", "theme-vinyl", "theme-neon-circuit", "theme-soft-bloom")
    const themeClassMap: Record<string, string> = {
      forest: "theme-forest", nostalgia: "theme-nostalgia", "wild-runes": "theme-wild-runes",
      bathhouse: "theme-bathhouse", vinyl: "theme-vinyl", "neon-circuit": "theme-neon-circuit", "soft-bloom": "theme-soft-bloom",
    }
    const themeClass = themeClassMap[selectedTheme]
    if (themeClass) html.classList.add(themeClass)
    localStorage.setItem("chaoslimba-theme", selectedTheme)
  }, [selectedTheme, mounted])

  const resetChallengeState = useCallback(() => {
    setResponse("")
    setSelectedOption(null)
    setShowHint(false)
    setSubmitted(false)
    setIsEvaluating(false)
    setEvaluation(null)
  }, [])

  const nextChallenge = useCallback(() => {
    setChallengeIndex((i) => (i + 1) % DEMO_CHALLENGES.length)
    resetChallengeState()
  }, [resetChallengeState])

  const shuffleChallenge = useCallback(() => {
    let next: number
    do { next = Math.floor(Math.random() * DEMO_CHALLENGES.length) } while (next === challengeIndex && DEMO_CHALLENGES.length > 1)
    setChallengeIndex(next)
    resetChallengeState()
  }, [challengeIndex, resetChallengeState])

  const handleSubmit = async () => {
    const answer = isMultipleChoice ? selectedOption : response.trim()
    if (!answer) return

    setSubmitted(true)
    setIsEvaluating(true)

    try {
      const res = await fetch("/api/demo/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge: {
            type: challenge.type,
            prompt: challenge.prompt,
            targetSentence: challenge.targetSentence,
            expectedAnswers: challenge.expectedAnswers,
            options: challenge.options,
            hint: challenge.hint,
            grammarRule: challenge.grammarRule,
            featureKey: challenge.featureKey,
            featureName: challenge.featureName,
          },
          response: answer,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setEvaluation(data.evaluation)
      } else {
        // Fallback to simple comparison if API fails
        const isRight = challenge.expectedAnswers.some(
          (ea) => ea.toLowerCase() === answer.toLowerCase()
        )
        setEvaluation({
          isCorrect: isRight,
          score: isRight ? 100 : 0,
          feedback: isRight ? "Correct!" : "Not quite right.",
          correction: isRight ? undefined : challenge.expectedAnswers[0],
          ruleExplanation: challenge.grammarRule,
        })
      }
    } catch {
      // Fallback to simple comparison on network error
      const isRight = challenge.expectedAnswers.some(
        (ea) => ea.toLowerCase() === answer.toLowerCase()
      )
      setEvaluation({
        isCorrect: isRight,
        score: isRight ? 100 : 0,
        feedback: isRight ? "Correct!" : "Not quite right.",
        correction: isRight ? undefined : challenge.expectedAnswers[0],
        ruleExplanation: challenge.grammarRule,
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  const currentMode = mounted ? resolvedTheme : "dark"

  return (
    <div className="min-h-screen bg-background">
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28">
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1.5">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Interactive Demo — No account needed
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-foreground via-primary to-primary/50 bg-clip-text text-transparent">
              ChaosLimb
            </span>
            <span className="bg-gradient-to-r from-primary/50 to-accent bg-clip-text text-transparent">
              ă
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-2">
            AI-powered Romanian learning for ADHD brains.
          </p>
          <p className="text-lg text-muted-foreground/80 max-w-xl mb-8">
            We provide the method. You provide the mess.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/70 hover:from-primary hover:to-primary/80 rounded-xl shadow-lg shadow-primary/20 text-base">
              <Link href="/sign-up">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl border-muted-foreground/30 hover:bg-muted-foreground/10 text-base">
              <a href="#try-it">
                Try It Below
                <ChevronRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Philosophy pills */}
          <div className="flex flex-wrap gap-2 mt-10">
            {[
              { icon: Brain, text: "SLA Theory-Grounded" },
              { icon: Zap, text: "ADHD-Native Design" },
              { icon: Shield, text: "Privacy-First" },
              { icon: Sparkles, text: "10-Component AI Ensemble" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/30 border border-border/40 rounded-full px-3 py-1.5">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHAOSLIMBA ──────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">Why ChaosLimba?</h2>
        <p className="text-muted-foreground mb-10 max-w-2xl">
          Most language apps punish mistakes, enforce streaks, and follow rigid paths.
          ChaosLimba turns that upside down — your errors become your curriculum, and productive confusion drives real acquisition.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="rounded-2xl border-border/40 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="p-3 rounded-xl bg-destructive/10 w-fit mb-4">
                <Flower2 className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Errors Are Gold</h3>
              <p className="text-sm text-muted-foreground">
                Every mistake feeds your Error Garden. Patterns emerge, fossilization risks get flagged, and the AI adapts your practice to target weak spots.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/40 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                <Timer className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No Streaks, No Guilt</h3>
              <p className="text-sm text-muted-foreground">
                Time-boxed Chaos Windows (5-10 min) work with your attention span. Skip a day? A week? Your progress is always waiting — no punishment.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/40 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="p-3 rounded-xl bg-accent/10 w-fit mb-4">
                <Shuffle className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Embrace the Chaos</h3>
              <p className="text-sm text-muted-foreground">
                Randomized content, non-linear challenges, and exploration-driven learning. The unpredictable path is the effective path.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── INTERACTIVE WORKSHOP DEMO ───────────────────────────────────── */}
      <section id="try-it" className="bg-gradient-to-b from-background via-muted/20 to-background border-y border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-accent/10">
              <Wrench className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Try the Workshop</h2>
          </div>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Grammar micro-challenges that target real patterns. No textbook drills — these are based on actual learner errors.
          </p>

          <div className="max-w-2xl mx-auto space-y-4">
            {/* Challenge Card */}
            <Card className={`rounded-2xl border-border/40 bg-gradient-to-br from-accent/5 via-background to-accent/5 border-l-4 ${config.borderColor}`}>
              <CardContent className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <Badge className={`${config.color} gap-1.5`}>
                    <TypeIcon className="h-3.5 w-3.5" />
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{challenge.featureName}</span>
                </div>

                {/* Prompt */}
                <div className="space-y-3">
                  <div className="text-lg font-medium leading-relaxed">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                      }}
                    >
                      {challenge.prompt}
                    </ReactMarkdown>
                  </div>

                  {challenge.targetSentence && (
                    <div className="rounded-xl bg-muted/50 pl-4 pr-4 py-3 border-l-2 border-accent/40">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Romanian</span>
                      <div className="text-base italic text-foreground/90 mt-0.5">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                          }}
                        >
                          {challenge.targetSentence}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hint */}
                {challenge.hint && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowHint(!showHint)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Lightbulb className="h-4 w-4" />
                      {showHint ? "Hide hint" : "Show hint"}
                    </button>
                    <div
                      className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                      style={{ gridTemplateRows: showHint ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-2 text-sm text-muted-foreground bg-chart-3/5 border border-chart-3/20 rounded-lg px-3 py-2">
                          {challenge.hint}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input */}
                {!submitted && (
                  <>
                    {isMultipleChoice ? (
                      <div className="grid gap-2" role="radiogroup">
                        {challenge.options!.map((option, i) => {
                          const letter = String.fromCharCode(65 + i)
                          const isSelected = selectedOption === option
                          return (
                            <button
                              key={i}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => setSelectedOption(option)}
                              className={`flex items-start gap-3 text-left px-4 py-3 rounded-xl border transition-all ${
                                isSelected
                                  ? "border-accent ring-2 ring-accent/30 bg-accent/10"
                                  : "border-border/40 bg-background/50 hover:border-accent/30 hover:bg-accent/5"
                              } cursor-pointer`}
                            >
                              <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-semibold ${
                                isSelected ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                              }`}>
                                {letter}
                              </span>
                              <span className="text-sm leading-relaxed pt-0.5">{option}</span>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <Textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit() }
                        }}
                        placeholder="Type your answer in Romanian..."
                        className="min-h-[80px] rounded-xl border-border/40 bg-background/50 focus:border-accent/50 resize-none"
                      />
                    )}

                    {/* Submit */}
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" onClick={shuffleChallenge} className="text-muted-foreground hover:text-foreground">
                        <Shuffle className="mr-1.5 h-4 w-4" />
                        Random
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={isMultipleChoice ? !selectedOption : response.trim().length < 2}
                        className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 rounded-xl shadow-lg shadow-accent/20"
                      >
                        <Send className="mr-1.5 h-4 w-4" />
                        Submit
                      </Button>
                    </div>
                  </>
                )}

                {/* Evaluating spinner */}
                {submitted && isEvaluating && (
                  <div className="flex items-center justify-center gap-3 py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">AI is evaluating your answer...</span>
                  </div>
                )}

                {/* Result */}
                {submitted && evaluation && !isEvaluating && (
                  <div className="space-y-4">
                    {/* Score + feedback */}
                    <div className={`rounded-xl p-4 border ${evaluation.isCorrect ? "bg-chart-3/10 border-chart-3/30" : evaluation.score >= 50 ? "bg-chart-4/10 border-chart-4/30" : "bg-destructive/10 border-destructive/30"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {evaluation.isCorrect ? (
                            <Check className="h-5 w-5 text-chart-3" />
                          ) : (
                            <ArrowRight className="h-5 w-5 text-chart-4" />
                          )}
                          <span className={`font-semibold ${evaluation.isCorrect ? "text-chart-3" : "text-chart-4"}`}>
                            {evaluation.isCorrect ? "Correct!" : "Not quite"}
                          </span>
                        </div>
                        <Badge className={`text-xs ${
                          evaluation.score >= 80 ? "bg-chart-3/20 text-chart-3 border-chart-3/30"
                          : evaluation.score >= 50 ? "bg-chart-4/20 text-chart-4 border-chart-4/30"
                          : "bg-destructive/20 text-destructive border-destructive/30"
                        }`}>
                          {evaluation.score}/100
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{evaluation.feedback}</p>
                      {evaluation.correction && (
                        <div className="mt-3 pt-3 border-t border-border/40">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Correct form</span>
                          <p className="text-sm font-medium mt-0.5">{evaluation.correction}</p>
                        </div>
                      )}
                    </div>

                    {/* Rule explanation from AI */}
                    <div className="rounded-xl bg-muted/30 border border-border/40 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">Grammar Rule</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{evaluation.ruleExplanation}</p>
                      <div className="flex items-center gap-1.5 mt-3 text-xs text-primary/60">
                        <Sparkles className="h-3 w-3" />
                        <span>Evaluated by ChaosLimba AI — same engine used in the full app</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Challenge {challengeIndex + 1} of {DEMO_CHALLENGES.length}
                      </span>
                      <Button onClick={nextChallenge} className="rounded-xl">
                        <RefreshCw className="mr-1.5 h-4 w-4" />
                        Next Challenge
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── ERROR GARDEN PREVIEW ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-chart-4/10">
            <Flower2 className="h-5 w-5 text-chart-4" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">Error Garden Preview</h2>
        </div>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Your errors grow into patterns. The Error Garden visualizes them, detects fossilization risks, and helps the AI adapt your practice.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_ERROR_PATTERNS.map((pattern) => (
            <Card key={pattern.name} className="rounded-2xl border-border/40 bg-card/50 backdrop-blur hover:border-primary/30 transition-all duration-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{pattern.name}</h3>
                    <span className="text-xs text-muted-foreground">{pattern.category}</span>
                  </div>
                  <Badge className={`text-xs ${
                    pattern.tier === 3
                      ? "bg-destructive/20 text-destructive border-destructive/30"
                      : pattern.tier === 2
                        ? "bg-chart-4/20 text-chart-4 border-chart-4/30"
                        : "bg-muted text-muted-foreground border-border/40"
                  }`}>
                    {pattern.tier === 3 ? "Fossilizing" : pattern.tier === 2 ? "Watch" : "Active"}
                  </Badge>
                </div>

                {/* Frequency bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Frequency</span>
                    <span>{pattern.frequency}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pattern.barClass} transition-all duration-500`}
                      style={{ width: `${pattern.frequency}%` }}
                    />
                  </div>
                </div>

                {/* Example errors */}
                <div className="space-y-1.5">
                  {pattern.examples.map((ex, i) => {
                    const [wrong, right] = ex.split(" → ")
                    return (
                      <div key={i} className="text-xs flex items-center gap-1.5">
                        <span className="text-destructive/70 line-through">{wrong}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-chart-3 font-medium">{right}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6 italic">
          Sample data — in the real app, this is generated from your actual practice sessions.
        </p>
      </section>

      {/* ─── FEATURES GRID ───────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-background via-muted/10 to-background border-y border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Everything You Get</h2>
          <p className="text-muted-foreground mb-10 max-w-2xl">
            A complete language learning ecosystem, built for brains that don&apos;t follow straight lines.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feature) => (
              <Card key={feature.name} className="rounded-2xl border-border/40 bg-card/50 backdrop-blur hover:border-primary/20 transition-all duration-200 hover:scale-[1.02]">
                <CardContent className="p-5">
                  <div className={`p-2.5 rounded-xl ${feature.bg} w-fit mb-3`}>
                    <feature.icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5">{feature.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THEME PLAYGROUND ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">8 Color Themes</h2>
        </div>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Pick the vibe that keeps your brain happy. Each theme has light and dark variants — switch live right here.
        </p>

        {/* Mode toggle */}
        <div className="mb-6">
          <div className="inline-flex rounded-xl border border-border/40 p-1 bg-muted/30">
            <button
              onClick={() => setMode("light")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentMode === "light" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
            <button
              onClick={() => setMode("dark")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentMode === "dark" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
          </div>
        </div>

        {/* Theme grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {THEMES.map((theme) => {
            const isSelected = selectedTheme === theme.id
            const colors = currentMode === "light" ? theme.lightColors : theme.darkColors
            return (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`relative text-left rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                  isSelected ? "border-primary shadow-lg ring-4 ring-primary/20" : "border-border/40 hover:border-primary/50"
                }`}
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{theme.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{theme.description}</p>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="h-6 flex-1 rounded-lg border border-border/20 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground italic mt-4">
          <Palette className="h-4 w-4" />
          <span>
            Currently using: <strong className="text-foreground">{THEMES.find(t => t.id === selectedTheme)?.name}</strong> ({currentMode} mode) — the whole page updates live!
          </span>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="border-t border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Embrace the Chaos?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Free to use. No credit card. No streaks to maintain. Just you, Romanian, and productive confusion.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/70 hover:from-primary hover:to-primary/80 rounded-xl shadow-lg shadow-primary/20 text-base px-8">
              <Link href="/sign-up">
                Start Learning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-10">
            Built by ADHD, for ADHD. Grounded in Second Language Acquisition theory.
          </p>
        </div>
      </section>
    </div>
  )
}
