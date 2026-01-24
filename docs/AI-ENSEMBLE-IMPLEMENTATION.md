# AI Ensemble Implementation Guide
## Technical Reference for ChaosLimbă's 9-Component AI System

**Document Version:** 1.0  
**Last Updated:** January 24, 2026  
**Purpose:** Technical implementation reference for the AI grading ensemble

---

## Overview

ChaosLimbă employs a sophisticated 9-component AI ensemble that provides comprehensive language analysis for Romanian learners. The system uses intelligent dual-path routing to optimize performance and costs based on input type (speech vs. text).

### Architecture Principles

1. **Dual-Path Processing**: Separate optimized paths for speech and text inputs
2. **Intelligent Routing**: The Conductor orchestrates component activation based on input type and intent
3. **Cost Optimization**: Free tiers used where possible, aggressive caching implemented
4. **Graceful Degradation**: System continues to function even if individual components fail

---

## Component Architecture

### Core Processing Components (1-3)

#### 1. Speech Recognition
- **Model**: `gigant/whisper-medium-romanian`
- **Hosting**: Groq API (FREE tier)
- **Function**: Romanian audio → text transcription
- **Activation**: Speech path only
- **Implementation**: `/src/lib/ai/speech.ts`

```typescript
export async function transcribeAudio(audioData: Buffer): Promise<TranscriptionResult> {
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'audio/wav'
    },
    body: audioData
  });
  
  return response.json();
}
```

#### 2. Pronunciation Analysis
- **Model**: `gigant/romanian-wav2vec2`
- **Hosting**: RunPod Serverless ($2-3/mo)
- **Function**: Phoneme accuracy + stress pattern detection
- **Activation**: Speech path only
- **Implementation**: `/src/lib/ai/pronunciation.ts`

#### 3. Grammar Correction
- **Model**: Fine-tuned `google/mt5-small` (BLEU 68.92)
- **Hosting**: RunPod Serverless ($3-5/mo)
- **Function**: Error detection, correction suggestions, error type classification
- **Activation**: Both paths
- **Implementation**: `/src/lib/ai/grammar.ts`

### SPAM Ensemble (4-7)

#### 4. SPAM-A: Semantic Similarity
- **Model**: `dumitrescustefan/bert-base-romanian-cased-v1`
- **Hosting**: HuggingFace Inference API (FREE)
- **Function**: Sentence embedding similarity scoring
- **Activation**: Both paths
- **Implementation**: `/src/lib/ai/spamA.ts`

```typescript
export async function compareSemanticSimilarity(
  userText: string, 
  expectedText: string
): Promise<SpamAResult> {
  // Uses Romanian BERT embeddings to calculate semantic similarity
  // Returns similarity score 0.0-1.0
}
```

#### 5. SPAM-B: Relevance Scorer (Post-MVP)
- **Model**: `readerbench/ro-text-summarization`
- **Hosting**: HuggingFace Inference API (FREE)
- **Function**: Detects when user response is off-topic
- **Activation**: Both paths (if enabled)
- **Implementation**: `/src/lib/ai/spamB.ts` (future)

#### 6. SPAM-C: Dialectal/Pragmatic (Post-MVP)
- **Model**: Fine-tuned Romanian BERT
- **Hosting**: RunPod Serverless ($2-3/mo)
- **Function**: Regional variants + formality detection
- **Activation**: Both paths (if enabled)
- **Implementation**: `/src/lib/ai/spamC.ts` (future)

#### 7. SPAM-D: Intonation Mapper
- **Model**: Rule-based lookup table (50-100 minimal pairs)
- **Hosting**: In-app logic (FREE)
- **Function**: Detects stress-based meaning changes
- **Activation**: Speech path only
- **Implementation**: `/src/lib/ai/spamD.ts`

```typescript
export function checkIntonationShift(
  transcript: string, 
  stressPatterns: StressPattern[]
): IntonationResult {
  // Rule-based checking of minimal pairs
  // Example: "TORturi" (cakes) vs "torTUri" (tortures)
}
```

### Integration Layer (8-9)

#### 8. Conductor
- **Type**: Intelligent orchestration logic
- **Hosting**: In-app (Next.js API route)
- **Function**: Orchestrates component activation based on input type and intent
- **Implementation**: `/src/lib/ai/conductor.ts`

```typescript
export class AIConductor {
  static async process(intent: AIIntent, payload: AIPayload): Promise<any> {
    switch (intent) {
      case "semantic_similarity":
        return this.handleSemanticSimilarity(payload);
      case "pronunciation_analysis":
        return this.handlePronunciationAnalysis(payload);
      // ... other cases
    }
  }
}
```

#### 9. Feedback Aggregator
- **Type**: Integration logic
- **Hosting**: In-app (Next.js API route)
- **Function**: Combines all analyses into unified report
- **Implementation**: `/src/lib/ai/aggregator.ts`

```typescript
export class FeedbackAggregator {
  static async aggregateFeedback(input: AggregatorInput): Promise<AggregatedReport> {
    // Weighted scoring based on input type
    // Speech: grammar(30%) + pronunciation(25%) + semantic(25%) + intonation(20%)
    // Text: grammar(50%) + semantic(50%)
  }
}
```

### Conversational AI (10)

#### 10. DeepSeek R1
- **Model**: DeepSeek R1 (open-source reasoning model)
- **Hosting**: RunPod Serverless ($5-10/mo)
- **Function**: Formats feedback in approachable, encouraging manner
- **Implementation**: `/src/lib/ai/tutor.ts`

---

## Dual-Path Processing Flow

### Speech Input Path (1.0-1.5 seconds)

```
Audio Input
    ↓
[1] Speech Recognition (Groq) → Transcript
    ↓
[2] Grammar + [3] Pronunciation (parallel, RunPod)
    ↓
[4] SPAM-A Semantic (HuggingFace FREE)
    ↓
[7] SPAM-D Intonation (rule-based)
    ↓
[9] Feedback Aggregator
    ↓
[10] DeepSeek R1 (RunPod)
    ↓
Formatted Response
```

### Text Input Path (0.5-0.8 seconds)

```
Text Input
    ↓
[2] Grammar + [4] SPAM-A Semantic (parallel)
    ↓
[9] Feedback Aggregator
    ↓
[10] DeepSeek R1 (RunPod)
    ↓
Formatted Response
```

---

## Implementation Patterns

### 1. Caching Strategy

All AI responses are cached to reduce costs and improve latency:

```typescript
// Cache key pattern
const cacheKey = `${modelType}:${JSON.stringify(input)}`;

// Check cache first
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Cache result for 24 hours
await redis.setex(cacheKey, 86400, JSON.stringify(result));
```

### 2. Error Handling

Each component implements graceful degradation:

```typescript
try {
  const result = await callAIComponent(input);
  return result;
} catch (error) {
  console.error(`${componentName} failed:`, error);
  return fallbackResult; // Continue with partial analysis
}
```

### 3. Parallel Processing

Components that can run in parallel are executed concurrently:

```typescript
const [grammarResult, semanticResult] = await Promise.all([
  analyzeGrammar(text),
  compareSemanticSimilarity(text, expectedText)
]);
```

---

## API Integration

### Main Analysis Endpoint

```typescript
// /app/api/analyze/route.ts
export async function POST(request: Request) {
  const { inputType, content, context } = await request.json();
  
  // Route through Conductor
  const result = await AIConductor.process('feedback_aggregation', {
    inputType,
    grammarResult: await analyzeGrammar(content.text),
    semanticResult: await compareSemanticSimilarity(content.text, context.expected),
    // ... other components based on inputType
  });
  
  return Response.json(result);
}
```

### Component Health Checks

```typescript
// /app/api/health/ai/route.ts
export async function GET() {
  const health = await Promise.allSettled([
    pingGroqAPI(),
    pingRunPodEndpoints(),
    pingHuggingFaceAPI()
  ]);
  
  return Response.json({ status: 'healthy', components: health });
}
```

---

## Cost Optimization

### Current Monthly Costs (MVP Phase 1)

| Component | Hosting | Cost/Month |
|-----------|---------|------------|
| Speech Recognition | Groq API | **$0** |
| Grammar | RunPod | $3-5 |
| Pronunciation | RunPod | $2-3 |
| SPAM-A | HuggingFace | **$0** |
| SPAM-D | In-app | **$0** |
| Conductor | In-app | **$0** |
| Aggregator | In-app | **$0** |
| DeepSeek R1 | RunPod | $0-2 |
| **Total** | | **$0-5** |

### Optimization Strategies

1. **Aggressive Caching**: 40%+ hit rate target
2. **Batch Processing**: Multiple items in single API calls
3. **Free Tier Priority**: Groq, HF Inference before RunPod
4. **Usage Monitoring**: Track costs weekly

---

## Testing Strategy

### Unit Tests

```typescript
// /src/lib/ai/__tests__/grammar.test.ts
describe('Grammar Analysis', () => {
  test('detects genitive case error', async () => {
    const result = await analyzeGrammar('Dau cartea de prietenul meu');
    expect(result.errors).toContainEqual({
      type: 'genitive_case',
      correction: 'Dau cartea prietenului meu'
    });
  });
});
```

### Integration Tests

```typescript
// /src/lib/ai/__tests__/ensemble.test.ts
describe('AI Ensemble', () => {
  test('speech input path works end-to-end', async () => {
    const result = await analyzeInput({
      inputType: 'speech',
      content: { audio: mockAudioBuffer },
      context: { expected: 'Eu merg la piață' }
    });
    
    expect(result).toHaveProperty('grammar');
    expect(result).toHaveProperty('pronunciation');
    expect(result).toHaveProperty('semantic');
    expect(result).toHaveProperty('intonation');
  });
});
```

---

## Monitoring & Observability

### Metrics to Track

1. **Response Times**: Per-component and overall latency
2. **Error Rates**: Component failure rates
3. **Cache Hit Rates**: Effectiveness of caching strategy
4. **Cost Tracking**: Monthly usage by component
5. **Accuracy Metrics**: Ongoing validation of model outputs

### Logging Pattern

```typescript
console.log(`[AI:${componentName}] Processing started`, {
  inputType,
  inputLength: input.length,
  timestamp: new Date().toISOString()
});

console.log(`[AI:${componentName}] Processing completed`, {
  duration: Date.now() - startTime,
  cacheHit: cached,
  cost: estimatedCost
});
```

---

## Future Enhancements

### Phase 2: SPAM-B Addition
- On-topic detection for Chaos Window
- Implementation timeline: +3 days
- Cost impact: $0 (uses free HuggingFace tier)

### Phase 3: SPAM-C Addition
- Regional variants + formality detection
- Implementation timeline: +7 days
- Cost impact: +$2-3/month

### Performance Optimizations
- Model quantization for faster inference
- Edge caching for frequently used responses
- Streaming responses for real-time feedback

---

## Troubleshooting

### Common Issues

1. **High Latency**: Check cache hit rates, consider model size reduction
2. **Cost Overruns**: Review usage patterns, implement stricter caching
3. **Accuracy Issues**: Validate model outputs, consider fine-tuning
4. **Component Failures**: Implement circuit breakers, fallback strategies

### Debug Commands

```bash
# Test individual components
npm run test:grammar
npm run test:speech
npm run test:ensemble

# Check API health
curl http://localhost:3000/api/health/ai

# Monitor costs
npm run monitor:costs
```

---

## Conclusion

The ChaosLimbă AI ensemble represents a sophisticated approach to language learning technology, balancing comprehensive analysis with cost efficiency. The modular architecture allows for phased implementation and continuous improvement while maintaining the pedagogical principles that make ChaosLimbă unique.

For implementation questions or issues, refer to the development guides or contact the lead developer.
