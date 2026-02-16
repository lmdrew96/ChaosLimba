# AI Ensemble Implementation Guide

**Version:** 2.2
**Last Updated:** February 13, 2026
**Purpose:** Single source of truth for AI ensemble technical details

---

## Overview

ChaosLimbă's AI ensemble consists of 10 core components plus a Workshop challenge generator, orchestrated by the Conductor system and driven by a 3-tier Adaptation Engine. All MVP components are implemented and running on **FREE APIs**, resulting in massive cost savings from the original $10-18/month budget to $0-5/month.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     User Input Layer                        │
│   Speech (audio) or Text → Conductor → Component Routing    │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼─────────┐  ┌───▼──────────────────────────────────┐
│  Speech Path    │  │      Text Path                       │
│  (5 components) │  │    (2 components)                    │
│                 │  │                                       │
│ 1. Speech Rec   │  │ 1. Grammar (local)                   │
│ 2. Pronunciation│  │ 2. SPAM-A (HF Inference)             │
│ 3. Grammar      │  │                                       │
│ 4. SPAM-A       │  └───────────────────────────────────────┘
│ 5. SPAM-D       │                    │
└───────┬─────────┘                    │
        │                               │
        └───────────────┬───────────────┘
                        │
        ┌───────────────▼───────────────┐
        │    Feedback Aggregator        │
        │    (combines all analyses)    │
        └───────────────┬───────────────┘
                        │
        ┌───────────────▼───────────────┐
        │    Llama 3.3 70B Tutor       │
        │    (Groq API, FREE)          │
        └───────────────────────────────┘
```

## Component-by-Component Implementation

### 1. Speech Recognition
- **File:** `/src/lib/ai/groq.ts`
- **Model:** `whisper-large-v3` via Groq API
- **API Endpoint:** `/api/speech-to-text`
- **Cost:** FREE (Groq tier)
- **Performance:** 10-15% WER, 0.5-1.0s response time

```typescript
// Usage example
import { transcribeAudio } from '@/lib/ai/groq';

const transcript = await transcribeAudio(audioBlob);
console.log('Transcribed:', transcript);
```

### 2. Pronunciation Analysis
- **File:** `/src/lib/ai/pronunciation.ts`
- **Model:** `gigant/romanian-wav2vec2` via HuggingFace Inference
- **API Endpoint:** `/api/analyze-pronunciation`
- **Cost:** FREE (HF tier)
- **Performance:** 75-85% phoneme accuracy

```typescript
// Usage example
import { analyzePronunciation } from '@/lib/ai/pronunciation';

const result = await analyzePronunciation(audioData, expectedText);
console.log('Score:', result.pronunciationScore);
```

### 3. Grammar Correction
- **File:** `/src/lib/ai/grammar.ts` + `/src/lib/grammarChecker.ts`
- **Model:** Claude Haiku 4.5 (claude-haiku-4-5-20251001)
- **Hosting:** Anthropic API (https://api.anthropic.com)
- **Cost:** ~$0.001 per check (Haiku pricing: $0.80/1M input tokens, $4/1M output tokens)
- **Provider-agnostic:** Supports multiple providers (Claude, OpenAI stub)
- **Performance:** LLM-based grammar analysis with contextual understanding

```typescript
// Usage example
import { analyzeGrammar } from '@/lib/ai/grammar';

const result = await analyzeGrammar(userText);
console.log('Errors:', result.errors);
console.log('Corrected:', result.correctedText);

// Or use the provider-agnostic wrapper directly
import { checkGrammar } from '@/lib/grammarChecker';
const providerResult = await checkGrammar(userText);
```

### 4. SPAM-A: Semantic Similarity
- **File:** `/src/lib/ai/spamA.ts`
- **Model:** `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- **Cost:** FREE (HF tier)
- **Performance:** 80-85% accuracy, 0.2-0.4s response
- **Note:** Standalone `/api/spam-a` endpoint removed in Feb 7 cleanup; SPAM-A is called internally by the aggregator

```typescript
// Usage example
import { compareSemanticSimilarity } from '@/lib/ai/spamA';

const result = await compareSemanticSimilarity(userText, expectedText);
console.log('Similarity:', result.similarity);
```

### 5. SPAM-D: Intonation Mapper
- **File:** `/src/lib/ai/spamD.ts`
- **Model:** Rule-based lookup table (50-100 minimal pairs)
- **Hosting:** In-app logic
- **Cost:** FREE
- **Performance:** >90% accuracy on known pairs

```typescript
// Usage example
import { checkIntonationShift } from '@/lib/ai/spamD';

const warnings = await checkIntonationShift(transcript, stressPatterns);
console.log('Intonation warnings:', warnings);
```

### 6. Conductor (Orchestration)
- **File:** `/src/lib/ai/conductor.ts`
- **Type:** TypeScript orchestration logic
- **Function:** Routes requests based on input type and intent
- **Cost:** FREE

```typescript
// Usage example
import { AIConductor } from '@/lib/ai/conductor';

const result = await AIConductor.process("semantic_similarity", {
  userText: "user input",
  expectedText: "expected input"
});
```

### 7. Feedback Aggregator
- **File:** `/src/lib/ai/aggregator.ts`
- **API Endpoint:** `/api/aggregate-feedback`
- **Function:** Combines all component analyses into unified report
- **Cost:** FREE

```typescript
// Usage example
import { FeedbackAggregator } from '@/lib/ai/aggregator';

const report = await FeedbackAggregator.aggregateFeedback({
  inputType: "speech",
  grammarResult,
  pronunciationResult,
  semanticResult,
  intonationResult,
  userId,
  sessionId
});
```

### 8. SPAM-B: Relevance Scorer
- **File:** `/src/lib/ai/spamB.ts`
- **Model:** Reuses SPAM-A embeddings (sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2)
- **Hosting:** HuggingFace Inference API
- **Cost:** FREE
- **Performance:** Semantic embedding-based relevance detection, 0.2-0.4s response
- **Thresholds:** on_topic (≥0.45), partially_relevant (0.25-0.45), off_topic (<0.25)

```typescript
// Usage example
import { checkRelevance } from '@/lib/ai/spamB';

const result = await checkRelevance(userText, contentContext);
console.log('Relevance:', result.relevanceScore, result.category);
```

### 9. Llama 3.3 70B AI Tutor
- **File:** `/src/lib/ai/tutor.ts`
- **Model:** `llama-3.3-70b-versatile` via Groq API
- **Cost:** FREE (Groq tier)
- **Function:** Generates questions, grades responses, enables productive confusion
- **Features:** Accepts `fossilizationAlerts` param from Adaptation Engine, CEFR-level-appropriate prompts, bilingual for A1-A2

```typescript
// Usage example
import { generateTutorResponse } from '@/lib/ai/tutor';

const response = await generateTutorResponse(
  userResponse,
  context,
  errorPatterns,
  fossilizationAlerts  // from buildFossilizationAlerts()
);
```

### 10. Adaptation Engine
- **File:** `/src/lib/ai/adaptation.ts`
- **Type:** In-app logic (3-tier fossilization escalation)
- **Cost:** FREE
- **Function:** Detects fossilization, escalates interventions, adjusts content/workshop weights

```typescript
// Usage example
import { getAdaptationProfile, buildFossilizationAlerts } from '@/lib/ai/adaptation';

const profile = await getAdaptationProfile(userId);
const alerts = buildFossilizationAlerts(profile);
// Pass alerts to tutor or use profile.dynamicWeights for content selection
```

### 11. Workshop Challenge Generator
- **File:** `/src/lib/ai/workshop.ts`
- **Model:** `llama-3.3-70b-versatile` via Groq API
- **Cost:** FREE (Groq tier)
- **Function:** Generates grammar/vocab micro-challenges, evaluates responses
- **Features:** 7 challenge types, destabilization-tier support, bilingual for A1-A2

```typescript
// Usage example
import { generateWorkshopChallenge, evaluateWorkshopResponse } from '@/lib/ai/workshop';

const challenge = await generateWorkshopChallenge(feature, cefrLevel, destabilizationTier);
const evaluation = await evaluateWorkshopResponse(userAnswer, challenge);
```

## API Endpoints Reference

### Core Analysis Endpoints

| Endpoint | Method | Purpose | Components Used |
|----------|--------|---------|-----------------|
| `/api/speech-to-text` | POST | Transcribe audio to text | Speech Recognition |
| `/api/analyze-pronunciation` | POST | Analyze pronunciation quality | Pronunciation Analysis |
| `/api/aggregate-feedback` | POST | Combine all analyses | Aggregator (calls SPAM-A/B internally) |
| `/api/chaos-window/submit` | POST | Full chaos window analysis | All components + Tutor |
| `/api/chaos-window/initial-question` | POST | Generate initial tutor question | Tutor + Content Selection |
| `/api/workshop/challenge` | GET | Generate workshop challenge | Workshop Generator |
| `/api/workshop/evaluate` | POST | Grade workshop response | Workshop Evaluator |

### Request/Response Formats

#### Speech Analysis Request
```json
{
  "user_id": "uuid",
  "audio_data": "base64_encoded_audio",
  "expected_text": "Expected Romanian text",
  "context": {
    "difficulty_level": "B1",
    "session_id": "uuid"
  }
}
```

#### Full Analysis Response
```json
{
  "input_type": "speech",
  "transcript": "Transcribed text",
  "grammar": {
    "score": 85,
    "errors": [
      {
        "type": "grammar_correction",
        "learner_production": "merge",
        "correct_form": "merg",
        "confidence": 0.9
      }
    ]
  },
  "pronunciation": {
    "score": 78,
    "transcribedText": "merg la piață",
    "isAccurate": true
  },
  "semantic": {
    "similarity": 0.85,
    "semanticMatch": true
  },
  "intonation": {
    "warnings": []
  },
  "overall_score": 82,
  "tutor_feedback": {
    "feedback": {
      "overall": "Good attempt! Small grammar correction needed.",
      "encouragement": "You're getting closer to natural Romanian!"
    },
    "nextQuestion": "Acum încearcă: 'Eu merg la magazin.'",
    "isCorrect": false
  }
}
```

## Caching Strategies

### Implementation Details

All components implement caching with 30-minute TTL:

```typescript
// Example from pronunciation.ts
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const pronunciationCache = new Map<string, PronunciationCache>();

function setCache(key: string, result: PronunciationResult) {
  pronunciationCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    result
  });
}
```

### Cache Hit Rates Expected

- **Grammar (local):** 60-70% (common patterns)
- **Speech Recognition:** 40-50% (varies by audio)
- **Pronunciation:** 50-60% (similar audio patterns)
- **Semantic Similarity:** 70-80% (repeated comparisons)
- **Overall Target:** 40-50% average hit rate

## Error Handling Patterns

### Standard Error Response
```typescript
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### Graceful Degradation
All components return fallback responses when APIs fail:

```typescript
catch (error) {
  console.error("Component failed:", error);
  return {
    // Fallback response
    fallbackUsed: true,
    // Minimal functional data
  };
}
```

## Performance Metrics

### Response Times (Target)

| Input Type | Components Active | Target Time | Actual Time |
|------------|-------------------|-------------|-------------|
| Text | Grammar + SPAM-A | 0.5-0.8s | 0.6s |
| Speech | All 5 components | 1.0-1.5s | 1.2s |

### Accuracy Benchmarks

| Component | Metric | Target | Actual |
|-----------|--------|--------|--------|
| Speech Recognition | WER | <15% | 12% |
| Grammar | BLEU | >65 | 68.92 |
| Pronunciation | Phoneme Accuracy | >75% | 78% |
| Semantic | Similarity Accuracy | >80% | 83% |
| Intonation | Minimal Pair Detection | >90% | 92% |

## Cost Breakdown

### Monthly Costs (MVP Phase 1)

| Component | Platform | Cost/Month |
|-----------|----------|------------|
| Speech Recognition | Groq API | $0 |
| Pronunciation | HuggingFace | $0 |
| Grammar | Claude Haiku 4.5 (Anthropic API) | ~$2 (with caching) |
| Semantic (SPAM-A) | HuggingFace | $0 |
| Relevance (SPAM-B) | HuggingFace (reuses SPAM-A) | $0 |
| Intonation (SPAM-D) | Rule-based | $0 |
| Tutor | Groq API | $0 |
| Workshop | Groq API | $0 |
| Adaptation Engine | In-app logic | $0 |
| **Total** | | **$0-5** |

### Post-MVP Phase 3 (if needed)

| Component | Platform | Cost/Month |
|-----------|----------|------------|
| SPAM-C (Dialectal) | RunPod | $2-3 |
| **Total with SPAM-C** | | **$2-3** |

## Testing Procedures

### Unit Tests
```bash
# Run AI component tests
npm test src/lib/ai/__tests__/
```

### Integration Tests
```bash
# Test full pipeline
npm run test:integration
```

### Manual Testing Checklist

1. **Speech Path**
   - [ ] Record audio → transcription works
   - [ ] Pronunciation scoring accurate
   - [ ] Grammar errors detected
   - [ ] Semantic similarity calculated
   - [ ] Intonation warnings triggered

2. **Text Path**
   - [ ] Grammar correction works
   - [ ] Semantic similarity calculated
   - [ ] Tutor response generated

3. **Error Handling**
   - [ ] API failures return graceful fallbacks
   - [ ] Invalid input handled properly
   - [ ] Cache misses work correctly

## File Structure Map

```
src/lib/ai/
├── conductor.ts           # Main orchestration logic
├── aggregator.ts          # Feedback combination
├── formatter.ts           # Response formatting
├── groq.ts               # Speech recognition + Groq client
├── grammar.ts            # Grammar analysis (Claude Haiku 4.5)
├── pronunciation.ts      # Pronunciation analysis (HF Inference)
├── spamA.ts              # Semantic similarity (HF Inference)
├── spamB.ts              # Relevance scoring (reuses SPAM-A)
├── spamD.ts              # Intonation mapping (rule-based)
├── tutor.ts              # AI tutor responses (Groq)
├── adaptation.ts         # 3-tier fossilization engine
├── workshop.ts           # Challenge generation + evaluation (Groq)
└── __tests__/            # Test files
    ├── aggregator.test.ts
    ├── integration-test.js
    └── spamD.test.ts

src/app/api/
├── speech-to-text/
│   └── route.ts          # Speech recognition endpoint
├── analyze-pronunciation/
│   └── route.ts          # Pronunciation endpoint
├── aggregate-feedback/
│   └── route.ts          # Aggregator endpoint (calls SPAM-A/B internally)
├── chaos-window/
│   ├── initial-question/
│   │   └── route.ts      # Generate initial tutor question
│   └── submit/
│       └── route.ts      # Full analysis endpoint
└── workshop/
    ├── challenge/
    │   └── route.ts      # GET next challenge
    ├── evaluate/
    │   └── route.ts      # POST grade response
    └── skip/
        └── route.ts      # POST skip challenge
```

## Environment Variables Required

```bash
# Anthropic API (Grammar - Claude Haiku 4.5)
ANTHROPIC_API_KEY=sk-ant-...

# Groq API (Speech + Tutor + Workshop)
GROQ_API_KEY=your_groq_api_key

# HuggingFace (Pronunciation + Semantic)
HUGGINGFACE_API_KEY=your_hf_token

# Database (for storing results)
DATABASE_URL=postgresql://...
```

## Deployment Notes

### Vercel Deployment
- All API routes deploy as serverless functions
- Local inference (@xenova/transformers) runs in Edge Runtime
- Cold start times: 1-2s for first request

### Monitoring
- Log all API calls with timing
- Track cache hit rates
- Monitor error rates per component
- Alert on >5% error rate sustained for 10+ minutes

## Future Enhancements (Post-MVP)

### SPAM-C: Dialectal/Pragmatic
- **Purpose:** Regional variants + formality detection
- **Model:** Fine-tuned Romanian BERT (`dumitrescustefan/bert-base-romanian-cased-v1`)
- **Datasets:** `fmi-unibuc/RoAcReL` (1.9K rows), `codrut2/RoDia` (dialect corpus)
- **Implementation:** ~7 days
- **Cost:** $2-3/month (RunPod or HF Inference)
- **When:** When user base expands to multiple Romanian regions

### Performance Optimizations
- Implement Redis for distributed caching
- Add request batching for multiple analyses
- Implement streaming responses for real-time feedback

---

**Document Status:** Complete
**Next Review:** After SPAM-C implementation (when user base grows)
**Contact:** lmdrew96@gmail.com
