# ChaosLimbă

## Overview
ChaosLimbă is an AI-powered Romanian language learning platform designed for ADHD brains. It uses the philosophy of "productive confusion" and "structured chaos" to help learners acquire Romanian through immersive, engaging experiences rather than traditional linear progression.

## Project Structure
```
chaoslimba/                    # Main Next.js application
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with ThemeProvider
│   │   ├── globals.css        # Global styles and CSS variables
│   │   └── (dashboard)/       # Dashboard route group
│   │       ├── layout.tsx     # Dashboard layout with Sidebar + TopBar
│   │       ├── page.tsx       # Dashboard/Home page
│   │       ├── mystery-shelf/ # Mystery Shelf page
│   │       ├── deep-fog/      # Deep Fog Mode page
│   │       ├── chaos-window/  # Chaos Window page
│   │       └── error-garden/  # Error Garden page
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── sidebar.tsx       # Navigation sidebar
│   │   ├── top-bar.tsx       # Top header bar
│   │   └── theme-provider.tsx # Dark mode provider
│   └── lib/
│       └── utils.ts          # Utility functions (cn helper)
├── public/                   # Static assets
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies and scripts
└── components.json          # shadcn/ui configuration

Guiding Documentation/        # Project philosophy and specs
ML Resources/                 # Machine learning resources
```

## Features

### Dashboard
- Welcome message and quick stats
- Practice streak, words collected, error patterns, time tracking
- Quick actions to navigate to other features
- Recent activity feed

### Mystery Shelf
- Collection of unknown words gathered from Deep Fog mode
- Deep Explore and Quick Review options
- Word definitions, examples, and practice prompts
- Filter by new/explored status

### Deep Fog Mode
- Browse above-level content (articles, podcasts, videos)
- Content filtering by type
- Interactive reading with word highlighting
- Collect unknown words to Mystery Shelf

### Chaos Window
- Timed practice sessions with countdown timer
- Randomized content at/above learner level
- AI tutor interaction with targeted questions
- Based on Error Garden patterns

### Error Garden
- Visualization of error patterns (grammar, phonology, etc.)
- Frequency bars and improvement tracking
- Fossilization risk alerts
- Targeted practice recommendations

## Development

### Running the App
```bash
cd chaoslimba && npm run dev
```
The app runs on port 5000 at http://0.0.0.0:5000

### Build & Production
```bash
cd chaoslimba && npm run build
cd chaoslimba && npm run start
```

## Tech Stack
- Next.js 16.1.3 with App Router
- React 19.2.3
- TypeScript 5
- Tailwind CSS v4
- shadcn/ui (New York style, Stone base)
- next-themes for dark mode
- Lucide React for icons

## Design Philosophy
- ADHD-friendly: Clear, not overwhelming. Energetic, not chaotic.
- Chaos-themed: Playful gradients, rounded elements, micro-animations
- Purple/violet as primary accent colors
- Dark mode by default
- Generous spacing and rounded corners

## Recent Changes
- January 18, 2026: Complete app implementation
  - Built all 5 feature pages with chaos-themed design
  - Implemented responsive sidebar with mobile support
  - Added dark mode with hydration-safe toggle
  - Configured for Replit deployment
  - Added accessibility improvements (aria labels)

## User Preferences
- Default theme: Dark mode
- Design style: Modern, playful but professional
- Color scheme: Purple/violet gradients on dark backgrounds
