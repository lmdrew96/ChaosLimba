# ChaosLimba

## Overview
ChaosLimba is a Next.js 16 application with React 19 and TypeScript. It uses Tailwind CSS v4 for styling.

## Project Structure
```
chaoslimba/          # Main Next.js application
├── src/
│   ├── app/         # Next.js App Router pages
│   └── lib/         # Utility functions
├── public/          # Static assets
├── next.config.ts   # Next.js configuration
└── package.json     # Dependencies and scripts

Guiding Documentation/  # Project documentation and specs
ML Resources/           # Machine learning resources and datasets
```

## Development

### Running the App
The app runs on port 5000 using:
```bash
cd chaoslimba && npm run dev
```

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
- Lucide React (icons)

## Recent Changes
- January 18, 2026: Initial Replit setup
  - Configured Next.js to run on port 5000
  - Added allowedDevOrigins for Replit proxy compatibility
  - Set up development workflow and deployment configuration
