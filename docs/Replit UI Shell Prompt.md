I'm building ChaosLimbă - an AI-powered Romanian language learning platform for ADHD brains.

CONTEXT:
You have access to chaoslimba-prototype.html. This is SCAFFOLDING, not a blueprint.
- It shows HOW features are organized (structure, flow)
- It shows the ESSENCE of the vision (chaos-themed, playful but serious)
- It shows WHAT features exist and how they relate

DO NOT recreate it visually. Use it to understand the vision, then build something better.

YOUR MISSION:
Take the skeleton from the prototype and build a production-quality Next.js app that is:
- ✨ Attractive (professional but playful)
- 🌀 Unique (doesn't look like every other Next.js app)
- ⚙️ Functional (real Next.js components, not HTML mockups)

TECH STACK (already installed):
- Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui
- Color scheme: Stone base (already configured)

DESIGN PHILOSOPHY:
- For ADHD brains: Clear, not overwhelming. Energetic, not chaotic.
- Chaos-themed: Playful gradients, rounded elements, micro-animations
- NOT: Corporate blue, gamified badges, Duolingo vibes
- Think: Notion's clarity + Discord's personality + a linguistics lab's seriousness

FEATURES TO BUILD (reference prototype for structure):

1. SIDEBAR NAVIGATION
   Structure from prototype: Dashboard, Mystery Shelf, Chaos Window, Deep Fog, Error Garden
   
   Your job: Make it beautiful and functional
   - Active state highlighting (your design choice)
   - Icons from lucide-react (choose appropriate ones)
   - Collapsible on mobile (smooth animation)
   - Sticky positioning (stays visible while scrolling)

2. TOP BAR
   From prototype: Logo area, user controls
   
   Your job: Design it properly
   - "ChaosLimbă" wordmark (your typography choice)
   - User avatar/dropdown (shadcn DropdownMenu)
   - Dark mode toggle (respect system preference)
   - Make it feel welcoming, not corporate

3. FIVE PAGES (create placeholder content)
   Structure from prototype shows what each does:
   
   Dashboard: Overview of learning journey
   - Your design: Welcome card, quick stats, recent activity
   
   Mystery Shelf: Collected unknowns
   - Your design: Collection of saved items

   Deep Fog Mode: Browse videos/audio/text
   - Your design: Grid of content cards, filters
   
   Chaos Window: Timed practice sessions
   - Your design: Timer UI, session controls

   Error Garden: View error patterns
   - Your design: Beautiful visualization of errors (make errors feel valuable, not shameful)

4. COLOR & STYLE DIRECTION
   The prototype has chaos-themed gradients and purples. Good bones.
   
   Your interpretation:
   - Use purple as accent (#8B5CF6 or your variation)
   - Add subtle gradients where they enhance, not overwhelm
   - Rounded corners (rounded-xl, rounded-2xl)
   - Shadows: subtle, not heavy
   - Hover states: scale, glow, color shift (pick what feels right)
   - Spacing: generous (ADHD-friendly = not cramped)
   
5. WHAT MAKES THIS UNIQUE
   Don't make it look like:
   - Every SaaS dashboard (corporate, boring)
   - Duolingo (gamified, childish)
   - Generic Next.js template (soulless)
   
   Make it feel like:
   - Someone who loves linguistics built this
   - It respects your intelligence
   - It's designed for curious, chaotic brains
   - Productive confusion is a feature, not a bug

FILES TO CREATE:
- app/layout.tsx (root with dark mode provider)
- app/(dashboard)/layout.tsx (sidebar layout)
- app/(dashboard)/page.tsx (Dashboard)
- app/(dashboard)/content/page.tsx (Content Library)
- app/(dashboard)/error-garden/page.tsx (Error Garden)
- app/(dashboard)/chaos-window/page.tsx (Chaos Window)
- app/(dashboard)/mystery-shelf/page.tsx (Mystery Shelf)
- components/sidebar.tsx
- components/top-bar.tsx

USE SHADCN/UI: Button, Card, Avatar, DropdownMenu, etc.

REFERENCE THE PROTOTYPE FOR:
✅ Feature organization (what goes where)
✅ User flow (how things connect)
✅ The spirit/vibe (chaos-themed but functional)

IGNORE THE PROTOTYPE FOR:
❌ Exact visual recreation
❌ HTML structure (this is Next.js/React)
❌ Specific colors/gradients (use as inspiration, not instruction)

BUILD SOMETHING BEAUTIFUL. 
The prototype showed you the essence. Now give it a body. 🌀