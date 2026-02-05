# ChaosLimbă - Adaptive Romanian Language Learning Platform

**Version:** 3.0
**Architecture:** 10-Component AI Ensemble with Dual-Path Routing + Adaptation Engine
**Status:** MVP Development (90% Complete)

## Overview

ChaosLimbă is a sophisticated adaptive language learning platform designed specifically for Romanian language instruction. The system employs a 10-component AI ensemble with intelligent dual-path routing, a 3-tier fossilization adaptation engine, and grammar workshop system — all grounded in SLA theory.

### Key Features

- **Multimodal Input**: Accept both speech and text inputs from learners
- **Intelligent Routing**: Automatically detects input type and activates appropriate analysis components
- **Comprehensive Assessment**: Grammar, pronunciation, semantic similarity, and intonation analysis
- **3-Tier Adaptation Engine**: Fossilization detection with escalating intervention (nudge → push → destabilize)
- **Grammar Workshop**: Targeted micro-challenges (transform, complete, fix, rewrite) with vocab exercises
- **Smart Content Selection**: Weighted random content targeting based on error patterns and adaptation profile
- **Cost Optimized**: $0-5/month (72-100% under original budget — nearly all FREE APIs)

## Architecture Overview

### 10-Component AI Ensemble

| # | Component | Model/Technology | Active For | Status |
|---|-----------|------------------|------------|--------|
| 1 | Speech Recognition | whisper-large-v3 (Groq API) | Speech only | ✅ **COMPLETE** |
| 2 | Pronunciation Analysis | romanian-wav2vec2 (HF Inference) | Speech only | ✅ **COMPLETE** |
| 3 | Grammar Correction | Claude Haiku 4.5 (Anthropic API) | Both | ✅ **COMPLETE** |
| 4 | SPAM-A: Semantic Similarity | multilingual-MiniLM-L12-v2 (HF) | Both | ✅ **COMPLETE** |
| 5 | SPAM-B: Relevance Scorer | Reuses SPAM-A embeddings (HF) | Both | ✅ **COMPLETE** |
| 6 | SPAM-D: Intonation Mapper | Rule-based lookup (50-100 pairs) | Speech only | ✅ **COMPLETE** |
| 7 | Conductor | Conditional logic | Both | ✅ **COMPLETE** |
| 8 | Feedback Aggregator | Integration logic | Both | ✅ **COMPLETE** |
| 9 | AI Tutor | Llama 3.3 70B (Groq API) | Both | ✅ **COMPLETE** |
| 10 | Adaptation Engine | 3-tier fossilization system | Both | ✅ **COMPLETE** |

**Plus:** Workshop Challenge Generator (Groq API) — grammar/vocab micro-challenges ✅ **COMPLETE**

### Dual-Path Processing

**Speech Input Path** (1.0-1.5 seconds)
```
Audio → Speech Recognition (Groq) → Grammar + Pronunciation (parallel) →
SPAM-A Semantic → SPAM-D Intonation → Feedback Aggregator → Llama 3.3 Tutor
```

**Text Input Path** (0.5-0.8 seconds)
```
Text → Grammar (local) + SPAM-A Semantic (parallel) → Feedback Aggregator → Llama 3.3 Tutor
```

The text path skips pronunciation and intonation analysis, reducing processing time by 40-50% and API costs by ~40%.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui

### Backend & ML Infrastructure
- **Speech Recognition**: Groq API (whisper-large-v3) - **FREE**
- **Pronunciation**: HuggingFace Inference API (romanian-wav2vec2) - **FREE**
- **Grammar**: Anthropic API (Claude Haiku 4.5) - **~$0.001 per check**
- **Semantic (SPAM-A)**: HuggingFace Inference API (multilingual-MiniLM) - **FREE**
- **Relevance (SPAM-B)**: Reuses SPAM-A embeddings - **FREE**
- **AI Tutor**: Llama 3.3 70B (Groq API) - **FREE**
- **Workshop Challenges**: Llama 3.3 70B (Groq API) - **FREE**
- **Adaptation Engine**: In-app logic (3-tier fossilization) - **FREE**
- **Database**: Neon PostgreSQL + Drizzle ORM

### API Endpoints

#### POST /api/analyze
Analyzes user input (speech or text) and returns comprehensive grading report.

**Request:**
```json
{
  "user_id": "uuid",
  "input_type": "speech" | "text",
  "content": {
    "audio_blob": "base64_encoded_audio",  // for speech
    "text": "Romanian text string"          // for text
  },
  "context": {
    "expected_response": "Expected Romanian text",
    "difficulty_level": "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
  }
}
```

**Response (Speech Input):**
```json
{
  "input_type": "speech",
  "grammar": { "score": 0.85, "errors": [...] },
  "pronunciation": { "phoneme_score": 0.78, "stress_accuracy": 0.82 },
  "semantic": { "similarity_score": 0.90 },
  "intonation": { "warnings": [...] },
  "overall_score": 0.85
}
```

**Response (Text Input):**
```json
{
  "input_type": "text",
  "grammar": { "score": 0.85, "errors": [...] },
  "pronunciation": null,
  "semantic": { "similarity_score": 0.90 },
  "intonation": null,
  "overall_score": 0.87
}
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm/bun
- PostgreSQL database
- API keys:
  - Anthropic API key (for Claude Haiku 4.5 grammar checking)
  - Groq API key (for Whisper speech recognition & Llama 3.3 tutor)
  - HuggingFace token (for pronunciation & semantic analysis)
  - Clerk keys (for authentication)

### Environment Variables

Create a `.env.local` file:

```bash
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Database
DATABASE_URL=postgresql://...

# AI Providers
ANTHROPIC_API_KEY=your_anthropic_key     # For Claude Haiku 4.5 grammar checking
GROQ_API_KEY=your_groq_api_key           # For speech recognition & AI tutor
HUGGINGFACE_API_TOKEN=your_hf_token      # For pronunciation & semantic analysis

# Cloudflare R2 Storage
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name
NEXT_PUBLIC_R2_PUBLIC_URL=your_public_url
```

### Installation

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### System Dependencies

ChaosLimbă requires the following system dependencies:

#### Required
- **Node.js 20+** (for Next.js)
- **FFmpeg** (for audio processing)
  ```bash
  # macOS
  brew install ffmpeg

  # Ubuntu/Debian
  sudo apt-get install ffmpeg

  # Windows
  choco install ffmpeg
  ```

#### Optional (for YouTube audio extraction fallback)
- **yt-dlp** (extracts audio from YouTube videos when captions unavailable)
  ```bash
  # macOS
  brew install yt-dlp

  # Linux/macOS (pip)
  pip install yt-dlp

  # Windows
  choco install yt-dlp
  ```

  **Note:** Without yt-dlp, videos without captions will show title-only questions (graceful degradation).

#### Verification
```bash
# Check installations
ffmpeg -version
yt-dlp --version  # Optional
```

### Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

## Project Structure

```
chaoslimba/
├── src/
│   ├── app/                     # Next.js app router
│   │   ├── (dashboard)/         # Dashboard layout group
│   │   │   ├── chaos-window/    # Interactive AI tutor sessions
│   │   │   ├── deep-fog/        # Passive immersion mode
│   │   │   ├── error-garden/    # Error pattern visualization
│   │   │   ├── mystery-shelf/   # Unknown word collection
│   │   │   ├── workshop/        # Grammar/vocab micro-challenges
│   │   │   └── proficiency-tracker/
│   │   └── api/                 # API routes
│   │       ├── speech-to-text/
│   │       ├── analyze-pronunciation/
│   │       ├── spam-a/
│   │       ├── aggregate-feedback/
│   │       ├── chaos-window/
│   │       └── workshop/        # Challenge + evaluation endpoints
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   └── features/            # Feature-specific components
│   └── lib/
│       ├── ai/                  # AI component wrappers
│       │   ├── conductor.ts     # Orchestration logic
│       │   ├── aggregator.ts    # Feedback combination
│       │   ├── tutor.ts         # AI tutor (Llama 3.3 70B)
│       │   ├── adaptation.ts    # 3-tier fossilization engine
│       │   ├── workshop.ts      # Challenge generation + evaluation
│       │   ├── grammar.ts       # Grammar analysis (Claude Haiku)
│       │   ├── groq.ts          # Speech recognition + Groq client
│       │   ├── pronunciation.ts # Wav2Vec2 pronunciation
│       │   ├── spamA.ts         # Semantic similarity
│       │   ├── spamB.ts         # Relevance scoring
│       │   └── spamD.ts         # Intonation mapping
│       └── db/
│           ├── schema.ts        # Drizzle ORM schema
│           └── queries.ts       # Smart content selection + queries
├── content/                     # Curated learning content
├── scripts/                     # Audio processing + content tools
└── public/                      # Static assets
```

## Core Features

### Deep Fog Mode
Passive immersion experience with content 1-3 levels above learner's proficiency, designed to build tolerance for ambiguity and contextual awareness.

### Chaos Window
Interactive practice environment with real-time feedback on grammar, pronunciation, and semantic accuracy.

### Mystery Shelf
Collection system for unknown words/phrases encountered during Deep Fog sessions, with contextual preservation.

### Error Garden
Pattern clustering and interlanguage analysis system that tracks errors by input type (speech vs. text) and updates user profiles. Powers the Adaptation Engine's fossilization detection.

### Workshop
Grammar and vocabulary micro-challenge system with 4 grammar types (transform, complete, fix, rewrite) and 3 vocab types (use_it, which_one, spot_the_trap). Features non-linear flow, multiple choice UI, and destabilization-tier-aware challenge generation.

### Adaptation Engine
3-tier fossilization escalation system: Tier 1 (nudge, 40-69% error frequency), Tier 2 (push, ≥70% + 2 failed interventions), Tier 3 (destabilize, ≥70% + 4 failed interventions). Drives smart content selection and workshop feature targeting with dynamic weight adjustment.

### Adaptive Tutoring
Llama 3.3 70B-powered conversational system (via Groq, FREE) that generates "productive confusion" responses tailored to individual learner patterns. Receives fossilization alerts from the Adaptation Engine to target weak structures.

## Performance Metrics

### Response Times
- **Text Input**: 0.5-0.8 seconds
- **Speech Input**: 1.0-1.5 seconds

### Model Accuracy
- **Speech Recognition**: 10-15% WER
- **Pronunciation**: 75-85% phoneme accuracy
- **Grammar**: LLM-based contextual analysis (Claude Haiku 4.5)
- **Semantic**: 80-85% similarity accuracy
- **Intonation**: >90% minimal pair detection

### Cost
- **Monthly Hosting**: **$0-5** (nearly all FREE APIs + minimal Claude Haiku usage)
- **Per Request**: **~$0.001** (Claude Haiku grammar checking with caching)

> **Cost Breakdown:**
> - Speech Recognition (Groq): FREE
> - Pronunciation (HuggingFace): FREE
> - Grammar (Claude Haiku): ~$0.001 per check (~$2/mo with caching)
> - Semantic / Relevance (HuggingFace): FREE
> - AI Tutor + Workshop (Groq): FREE
> - Adaptation Engine: FREE (in-app logic)
> - **72-100% under original $10-18/month budget**

## Development Timeline

### MVP Build Status

**Phase 1: Text Path (Days 1-4)**
- ✅ Conductor (text branch)
- ✅ SPAM-A deployment (HF Inference)
- ✅ Feedback aggregator (text-only)
- ✅ Integration testing

**Phase 2: Speech Path (Days 5-10)**
- ✅ Whisper deployment (Groq API)
- ✅ Wav2Vec2 deployment (HF Inference)
- ✅ SPAM-D intonation mapper (implemented)
- ✅ Conductor extension (speech branch)
- ✅ Aggregator extension (speech data)

**Phase 3: Integration (Days 11-13)**
- ✅ Llama 3.3 70B tutor integration (Groq API)
- ✅ End-to-end testing
- ✅ All 7 components complete!
- 🔧 Bug fixes and polish

## Documentation

- **System Architecture**: `/docs/system-architecture-description.md`
- **Feature Specifications**: `/docs/feature-specifications.md`
- **AI Ensemble Implementation**: `/docs/AI-ENSEMBLE-IMPLEMENTATION.md`
- **Curriculum Framework**: `/docs/chaoslimbă-curriculum-framework.md`
- **Dataset Documentation**: `/docs/datasets/datasets-list.md`
- **Development Timeline**: `/docs/Development Guides/ChaosLimba-Development-Documentation-Timeline.md`
- **Development Guide**: `/docs/Development Guides/Naes-Structured-Chaos-Development-Guide.md`

## Model URLs & Resources

**Deployed Models:**
- [whisper-large-v3](https://console.groq.com/) (via Groq API - Speech Recognition)
- [gigant/romanian-wav2vec2](https://huggingface.co/gigant/romanian-wav2vec2) (Pronunciation)
- [Claude Haiku 4.5](https://www.anthropic.com/api) (Grammar Correction)
- [sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2) (SPAM-A/B)
- [Llama 3.3 70B](https://console.groq.com/) (via Groq API - AI Tutor + Workshop)

**Planned Models (Post-MVP):**
- [dumitrescustefan/bert-base-romanian-cased-v1](https://huggingface.co/dumitrescustefan/bert-base-romanian-cased-v1) (for SPAM-C Dialectal)

## Contributing

This is a research and development project. Contributions are welcome! Please see the development guides in `/docs/Development Guides/` for coding standards and workflow.

## License

[Your License Here]

## Contact

For questions or collaboration: lmdrew96@gmail.com

---

Built with ❤️ for Romanian language learners
