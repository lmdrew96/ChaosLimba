# ChaosLimbă - Adaptive Romanian Language Learning Platform

**Version:** 2.0
**Architecture:** 7-Component Ensemble with Dual-Path Routing
**Status:** MVP Development

## Overview

ChaosLimbă is a sophisticated adaptive language learning platform designed specifically for Romanian language instruction. The system employs a 7-component ensemble architecture with intelligent dual-path routing that optimizes processing based on input type (speech vs. text).

### Key Features

- **Multimodal Input**: Accept both speech and text inputs from learners
- **Intelligent Routing**: Automatically detects input type and activates appropriate analysis components
- **Comprehensive Assessment**: Grammar, pronunciation, semantic similarity, and intonation analysis
- **Adaptive Learning**: Personalized instruction based on individual error patterns
- **Cost Optimized**: $10-18/month hosting costs with per-request costs of $0.001-0.005

## Architecture Overview

### 7-Component Ensemble

| # | Component | Model/Technology | Active For | Status |
|---|-----------|------------------|------------|--------|
| 1 | Speech Recognition | whisper-large-v3 (Groq API) | Speech only | ✅ **COMPLETE** |
| 2 | Pronunciation Analysis | romanian-wav2vec2 (HF Inference) | Speech only | ✅ **COMPLETE** |
| 3 | Grammar Correction | Claude Haiku 4.5 (Anthropic API) | Both | ✅ **COMPLETE** |
| 4 | SPAM-A: Semantic Similarity | multilingual-MiniLM-L12-v2 (HF) | Both | ✅ **COMPLETE** |
| 5 | SPAM-D: Intonation Mapper | Rule-based lookup (50-100 pairs) | Speech only | ✅ **COMPLETE** |
| 6 | Conductor | Conditional logic | Both | ✅ **COMPLETE** |
| 7 | Feedback Aggregator | Integration logic | Both | ✅ **COMPLETE** |

**Plus:** Llama 3.3 70B (Groq API) - AI Tutor for feedback formatting ✅ **COMPLETE**

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
- **Semantic**: HuggingFace Inference API (multilingual-MiniLM) - **FREE**
- **AI Tutor**: Llama 3.3 70B (Groq API) - **FREE**
- **Database**: PostgreSQL (user profiles, grading reports)

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

# Grammar Provider (optional, defaults to 'claude')
GRAMMAR_PROVIDER=claude                   # Options: 'claude' | 'openai'

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
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   └── features/           # Feature-specific components
├── lib/                    # Core logic
│   ├── router.ts           # Input routing logic
│   ├── feedback-aggregator.ts  # Score aggregation
│   ├── spam-d-minimal-pairs.ts # Intonation rules
│   └── components/         # ML component wrappers
│       ├── speech.ts
│       ├── pronunciation.ts
│       ├── grammar.ts
│       ├── spam-a.ts
│       └── spam-d.ts
├── api/
│   └── routes/
│       └── analyze.ts      # Main analysis endpoint
└── public/                 # Static assets
```

## Core Features

### Deep Fog Mode
Passive immersion experience with content 1-3 levels above learner's proficiency, designed to build tolerance for ambiguity and contextual awareness.

### Chaos Window
Interactive practice environment with real-time feedback on grammar, pronunciation, and semantic accuracy.

### Mystery Shelf
Collection system for unknown words/phrases encountered during Deep Fog sessions, with contextual preservation.

### Error Garden
Pattern clustering and interlanguage analysis system that tracks errors by input type (speech vs. text) and updates user profiles.

### Adaptive Tutoring
DeepSeek-R1-powered conversational system that generates "productive confusion" responses tailored to individual learner patterns.

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
- **Monthly Hosting**: **$2-5** (mostly FREE APIs + Claude Haiku)
- **Per Request**: **~$0.001** (Claude Haiku grammar checking with caching)

> **Cost Breakdown:**
> - Speech Recognition (Groq): FREE
> - Pronunciation (HuggingFace): FREE
> - Grammar (Claude Haiku): ~$0.001 per check (~$2/mo with caching)
> - Semantic (HuggingFace): FREE
> - AI Tutor (Groq): FREE

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

- **System Architecture**: `/ML Resources/system-architecture-description.md`
- **Feature Specifications**: `/Guiding Documentation/feature-specifications.md`
- **Curriculum Framework**: `/Guiding Documentation/chaoslimbă-curriculum-framework.md`
- **Dataset Documentation**: `/ML Resources/datasets/datasets-list.md`
- **Complete Technical Spec**: See `chaoslimba-ensemble-complete-spec.md` for detailed component specifications

## Model URLs & Resources

- [gigant/whisper-medium-romanian](https://huggingface.co/gigant/whisper-medium-romanian)
- [gigant/romanian-wav2vec2](https://huggingface.co/gigant/romanian-wav2vec2)
- [dumitrescustefan/bert-base-romanian-cased-v1](https://huggingface.co/dumitrescustefan/bert-base-romanian-cased-v1)
- [google/mt5-small](https://huggingface.co/google/mt5-small)

## Contributing

This is a research and development project. Contributions are welcome! Please see the development guides in `/Guiding Documentation/Development Guides/` for coding standards and workflow.

## License

[Your License Here]

## Contact

For questions or collaboration: lmdrew96@gmail.com

---

Built with ❤️ for Romanian language learners
