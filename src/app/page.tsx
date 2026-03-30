"use client"

import { useRef, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Flower2,
  Zap,
  Bot,
  BookMarked,
  Cloud,
  Wrench,
  ArrowRight,
  Sparkles,
  Brain,
  Timer,
  GitBranch,
  Atom,
} from "lucide-react"

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function FloatingOrb({
  className,
  delay = 0,
}: {
  className: string
  delay?: number
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{
        x: [0, 28, -18, 10, 0],
        y: [0, -18, 26, -10, 0],
        scale: [1, 1.08, 0.96, 1.04, 1],
      }}
      transition={{
        duration: 14,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const features = [
  {
    emoji: "🌸",
    name: "Error Garden",
    tagline: "Your mistakes become your curriculum.",
    description:
      "Every error gets analyzed, clustered, and turned into targeted practice. Fossilization patterns detected before they harden.",
    accent: "from-rose-500/15 to-rose-500/5 hover:border-rose-500/30",
    labelColor: "text-rose-400",
  },
  {
    emoji: "⚡",
    name: "Chaos Window",
    tagline: "5-10 minute timed sessions.",
    description:
      "AI adapts to your fossilization patterns in real-time. No open-ended sessions. Pure focused chaos with a hard stop.",
    accent: "from-amber-500/15 to-amber-500/5 hover:border-amber-500/30",
    labelColor: "text-amber-400",
  },
  {
    emoji: "🤖",
    name: "AI Ensemble",
    tagline: "10 AI components, working in concert.",
    description:
      "Grammar checker, speech recognition, tutor, pronunciation analysis, workshop challenger and more — all free.",
    accent: "from-sky-500/15 to-sky-500/5 hover:border-sky-500/30",
    labelColor: "text-sky-400",
  },
  {
    emoji: "📚",
    name: "Mystery Shelf",
    tagline: "Collect what confuses you.",
    description:
      "Unknown words and phrases stored for later. Explore meanings, etymology, and context on your own timeline.",
    accent: "from-violet-500/15 to-violet-500/5 hover:border-violet-500/30",
    labelColor: "text-violet-400",
  },
  {
    emoji: "☁️",
    name: "Deep Fog",
    tagline: "Let confusion be the teacher.",
    description:
      "Immerse yourself in authentic Romanian content. No hand-holding. The ambiguity is the pedagogy.",
    accent: "from-teal-500/15 to-teal-500/5 hover:border-teal-500/30",
    labelColor: "text-teal-400",
  },
  {
    emoji: "🔧",
    name: "Workshop",
    tagline: "7 grammar challenge types.",
    description:
      "Non-linear. Dopamine-driven. Never the same session twice. Grammar transformed into play.",
    accent: "from-orange-500/15 to-orange-500/5 hover:border-orange-500/30",
    labelColor: "text-orange-400",
  },
]

const marqueeItems = [
  "Grounded in SLA theory",
  "10-component AI ensemble",
  "Free forever",
  "ADHD-native design",
  "No streaks. No guilt.",
  "Productive confusion",
]

const steps = [
  {
    number: "01",
    Icon: Atom,
    title: "Practice with real Romanian",
    description:
      "Speak, write, and explore authentic content. Make mistakes — that's the whole plan.",
  },
  {
    number: "02",
    Icon: Flower2,
    title: "Error Garden clusters your patterns",
    description:
      "Your errors are analyzed, grouped, and tracked. Fossilization detected before it sets in.",
  },
  {
    number: "03",
    Icon: Brain,
    title: "AI adapts every session",
    description:
      "The ensemble routes you toward your weakest patterns. Every session targeted. Always evolving.",
  },
]

const philosophyPoints = [
  {
    Icon: Brain,
    title: "ADHD-native by design",
    desc: "Randomization over predictability. Dopamine-driven exploration. Built for brains that need novelty to focus.",
  },
  {
    Icon: Timer,
    title: "No streaks. No guilt.",
    desc: "Time-boxed sessions mean you always finish. Miss a day? The chaos waits patiently.",
  },
  {
    Icon: GitBranch,
    title: "Productive confusion",
    desc: "Encountering genuine difficulty builds deeper understanding than comfortable repetition ever will.",
  },
]

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  // Redirect authenticated users straight to their dashboard
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/home")
    }
  }, [isLoaded, isSignedIn, router])

  // doubled for seamless marquee loop
  const allMarquee = [...marqueeItems, ...marqueeItems]

  if (!isLoaded || isSignedIn) return null

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      {/* Subtle grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-10 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "120px",
        }}
      />

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">ChaosLimbă</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            asChild
            className="text-muted-foreground hover:text-foreground hidden sm:inline-flex"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full px-5 shadow-md shadow-primary/20">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 pt-12 pb-36 max-w-7xl mx-auto">
        {/* Orbs */}
        <FloatingOrb
          className="w-[480px] h-[480px] bg-primary/20 -top-24 -right-24 opacity-30"
          delay={0}
        />
        <FloatingOrb
          className="w-72 h-72 bg-rose-500/25 bottom-8 -left-20 opacity-20"
          delay={4}
        />
        <FloatingOrb
          className="w-56 h-56 bg-amber-500/20 top-48 right-64 opacity-20"
          delay={8}
        />

        <div className="max-w-4xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/60 backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground mb-10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Romanian · AI-powered · Built for ADHD brains
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(3.2rem,9vw,6.5rem)] font-black leading-[0.92] tracking-tight mb-8"
          >
            <span className="block text-foreground">Embrace</span>
            <span className="block bg-linear-to-r from-primary via-primary/70 to-primary/35 bg-clip-text text-transparent">
              the Chaos.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22 }}
            className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
          >
            The first Romanian learning platform that transforms your errors into curriculum.
            Grounded in Second Language Acquisition theory — designed for the way ADHD brains
            actually work.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32 }}
            className="flex flex-wrap gap-4"
          >
            <Button
              asChild
              size="lg"
              className="rounded-full px-9 h-12 text-base shadow-xl shadow-primary/25"
            >
              <Link href="/sign-up">
                Start Learning Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full px-9 h-12 text-base border-border/40 backdrop-blur-sm hover:bg-card/50"
            >
              <Link href="/demo">See the Demo</Link>
            </Button>
          </motion.div>
        </div>

        {/* Floating activity cards — desktop only */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="hidden xl:flex flex-col gap-3 absolute right-12 top-1/2 -translate-y-1/2 w-72"
        >
          {[
            {
              emoji: "🌸",
              label: "Error detected",
              sub: 'Article usage: "un" → "o"',
              color: "text-rose-400",
            },
            {
              emoji: "📊",
              label: "Pattern found",
              sub: "Subjunctive mood — 73% error rate",
              color: "text-amber-400",
            },
            {
              emoji: "⚡",
              label: "Session adapted",
              sub: "Routing to Workshop: Subjunctive",
              color: "text-sky-400",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75 + i * 0.14, ease: [0.22, 1, 0.36, 1] }}
              className="bg-card/75 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">{card.emoji}</span>
                <div>
                  <p className={`text-sm font-semibold ${card.color}`}>{card.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────── */}
      <div className="relative z-10 border-y border-border/25 bg-card/15 backdrop-blur-sm py-4 overflow-hidden">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="flex gap-10 whitespace-nowrap w-max"
        >
          {allMarquee.map((item, i) => (
            <span key={i} className="text-sm text-muted-foreground/70 flex items-center gap-10">
              {item}
              <span className="text-primary/30">◆</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-32 max-w-7xl mx-auto">
        <FadeIn className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-primary/60 mb-4 font-mono">
            The System
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Everything works together.
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Six interconnected systems, all feeding each other. Your chaos has structure.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <FadeIn key={f.name} delay={i * 0.07}>
              <div
                className={`group relative h-full p-6 rounded-2xl bg-linear-to-br ${f.accent} border border-border/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{f.emoji}</span>
                  <h3 className={`font-bold text-base ${f.labelColor}`}>{f.name}</h3>
                </div>
                <p className="font-semibold text-foreground mb-2 leading-snug">{f.tagline}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── PHILOSOPHY ───────────────────────────────────── */}
      <section className="relative z-10 overflow-hidden border-y border-border/20 bg-card/10">
        {/* Watermark */}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        >
          <span
            className="text-[160px] md:text-[240px] font-black text-foreground/[0.025] whitespace-nowrap tracking-[-0.05em] leading-none font-mono"
          >
            HAOS
          </span>
        </div>

        <div className="relative px-6 md:px-12 py-32 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <p className="text-xs uppercase tracking-[0.2em] text-primary/60 mb-6 font-mono">
                Philosophy
              </p>
              <h2 className="text-5xl md:text-6xl font-black leading-[0.95] tracking-tight">
                We provide{" "}
                <span className="text-muted-foreground">the method.</span>
                <br />
                You provide{" "}
                <span className="bg-linear-to-r from-primary to-primary/45 bg-clip-text text-transparent">
                  the mess.
                </span>
              </h2>
            </FadeIn>

            <FadeIn delay={0.14}>
              <div className="space-y-7">
                {philosophyPoints.map(({ Icon, title, desc }, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1.5">{title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 py-32 max-w-7xl mx-auto">
        <FadeIn className="text-center mb-20">
          <p className="text-xs uppercase tracking-[0.2em] text-primary/60 mb-4 font-mono">
            How it works
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            The feedback loop.
          </h2>
        </FadeIn>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {/* Connector line */}
          <div
            aria-hidden
            className="hidden md:block absolute top-[3.25rem] left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-linear-to-r from-transparent via-primary/30 to-transparent"
          />

          {steps.map(({ number, Icon, title, description }, i) => (
            <FadeIn key={i} delay={i * 0.13}>
              <div className="relative text-center group">
                <div className="relative w-28 h-28 mx-auto mb-7">
                  <div className="absolute inset-0 rounded-full bg-primary/8 border border-primary/15 group-hover:border-primary/35 transition-colors duration-300" />
                  <div className="absolute inset-0 rounded-full bg-linear-to-br from-primary/10 to-transparent" />
                  <div className="relative h-full flex flex-col items-center justify-center gap-1">
                    <span className="text-[10px] font-mono text-primary/50 tracking-widest">
                      {number}
                    </span>
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-12 pb-24 max-w-7xl mx-auto">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary/12 via-background to-primary/5 p-12 md:p-20 text-center">
            {/* Background orbs inside card */}
            <div
              aria-hidden
              className="absolute -top-24 -right-24 w-80 h-80 bg-primary/15 rounded-full blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl"
            />

            <div className="relative">
              <div className="text-5xl mb-8">🌸</div>
              <h2 className="text-4xl md:text-[3.5rem] font-black tracking-tight leading-tight mb-5">
                Ready to embrace some
                <br />
                <span className="bg-linear-to-r from-primary via-primary/75 to-primary/40 bg-clip-text text-transparent">
                  productive confusion?
                </span>
              </h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto leading-relaxed">
                Free forever. No credit card. No streaks. Just you, Romanian, and beautifully
                structured chaos.
              </p>
              <Button
                asChild
                size="lg"
                className="rounded-full px-12 h-14 text-lg shadow-2xl shadow-primary/30"
              >
                <Link href="/sign-up">
                  Start Learning Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-5">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-primary hover:underline underline-offset-2">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  )
}
