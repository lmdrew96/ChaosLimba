# SPAM-B: Relevance Scorer Specification

**Component:** #5 - SPAM-B (Semantic/Pragmatic Analysis Module - Relevance)
**Type:** Pre-trained ML model (no fine-tuning required)
**Purpose:** Determine if user's response is on-topic relative to content context
**Status:** ✅ COMPLETE (Implemented January 27, 2026 — reuses SPAM-A embeddings instead of original summarization plan)

---

## Overview

SPAM-B is a relevance detection component that determines whether a user's response is on-topic relative to the learning content. Unlike SPAM-A (which checks if meaning matches expected meaning), SPAM-B checks if the user is talking about the right topic at all.

### Why SPAM-B is Separate from SPAM-A

| Scenario | SPAM-A (Semantic) | SPAM-B (Relevance) | What Happened |
|----------|-------------------|-------------------|---------------|
| User correctly discusses Romanian food | High similarity | High relevance | ✅ Perfect |
| User discusses Italian food instead | Low similarity | Medium relevance | Topic drift |
| User discusses sports during cooking lesson | Low similarity | Low relevance | Completely off-topic |
| User uses synonyms correctly | High similarity | High relevance | ✅ Perfect |

**Key Insight:** You can be semantically accurate but completely off-topic. SPAM-B catches this.

---

## Model Specification

### Pre-Trained Model
- **Model**: `readerbench/ro-text-summarization`
- **HuggingFace**: https://huggingface.co/readerbench/ro-text-summarization
- **Type**: Romanian text summarization model (pre-trained, no fine-tuning needed)
- **Hosting**: HuggingFace Inference API (free tier)
- **Monthly Cost**: $0

### How It Works

The model uses summarization to extract main topics:

1. **Extract content topics**: Summarize the learning content to identify main topics
2. **Extract user topics**: Summarize user response to identify what they're talking about
3. **Calculate topic overlap**: Measure how much the topics align
4. **Generate relevance score**: 0.0 (completely off-topic) to 1.0 (perfectly on-topic)

---

## Component Architecture

### Input Schema

```typescript
interface SpamBInput {
  user_text: string;           // What the user said/wrote
  content_context: {
    title?: string;             // Content title (e.g., "Rețete românești")
    main_topics: string[];      // Key topics (e.g., ["bucătărie", "mâncare", "rețete"])
    difficulty?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    full_content?: string;      // Full content text (for auto-topic extraction)
  };
}
```

### Output Schema

```typescript
interface SpamBOutput {
  relevance_score: number;      // 0-1, topic overlap measure
  interpretation: 'on_topic' | 'partially_relevant' | 'off_topic';
  topic_analysis: {
    content_topics: string[];   // Topics extracted from content
    user_topics: string[];      // Topics extracted from user response
    topic_overlap: number;      // 0-1, Jaccard similarity of topic sets
    suggested_redirect?: string; // Helpful message to get back on track
  };
}
```

---

## Implementation

### Python API Wrapper

```python
from transformers import pipeline
from typing import List, Dict
import re

class SpamBRelevanceScorer:
    def __init__(self):
        self.summarizer = pipeline(
            "summarization",
            model="readerbench/ro-text-summarization"
        )

    def extract_topics(self, text: str, max_topics: int = 5) -> List[str]:
        """Extract main topics from Romanian text via summarization."""

        # Summarize to extract key concepts
        summary = self.summarizer(
            text,
            max_length=50,
            min_length=10,
            do_sample=False
        )[0]['summary_text']

        # Extract nouns as topics (simplified - could use NER or POS tagging)
        # Remove stopwords and keep meaningful words
        words = summary.lower().split()
        topics = [w for w in words if len(w) > 3]  # Simple heuristic

        return topics[:max_topics]

    def calculate_topic_overlap(
        self,
        topics1: List[str],
        topics2: List[str]
    ) -> float:
        """Calculate Jaccard similarity between topic sets."""
        set1 = set(topics1)
        set2 = set(topics2)

        if not set1 or not set2:
            return 0.0

        intersection = set1.intersection(set2)
        union = set1.union(set2)

        return len(intersection) / len(union)

    def score_relevance(
        self,
        user_text: str,
        content_context: Dict
    ) -> Dict:
        """Score relevance of user response to content."""

        # Extract content topics
        if 'main_topics' in content_context:
            content_topics = content_context['main_topics']
        elif 'full_content' in content_context:
            content_topics = self.extract_topics(content_context['full_content'])
        else:
            raise ValueError("Need either main_topics or full_content")

        # Extract user topics
        user_topics = self.extract_topics(user_text, max_topics=3)

        # Calculate overlap
        topic_overlap = self.calculate_topic_overlap(content_topics, user_topics)

        # Interpret relevance score
        if topic_overlap > 0.7:
            interpretation = "on_topic"
            suggested_redirect = None
        elif topic_overlap > 0.3:
            interpretation = "partially_relevant"
            suggested_redirect = f"Try focusing more on: {', '.join(content_topics[:3])}"
        else:
            interpretation = "off_topic"
            suggested_redirect = f"Let's get back to discussing: {', '.join(content_topics[:3])}"

        return {
            "relevance_score": topic_overlap,
            "interpretation": interpretation,
            "topic_analysis": {
                "content_topics": content_topics,
                "user_topics": user_topics,
                "topic_overlap": topic_overlap,
                "suggested_redirect": suggested_redirect
            }
        }
```

### Usage Example

```python
scorer = SpamBRelevanceScorer()

# Scenario 1: On-topic response
result = scorer.score_relevance(
    user_text="Îmi place sarmale și mămăligă. Sunt mâncăruri tradiționale.",
    content_context={
        "title": "Bucătărie românească",
        "main_topics": ["bucătărie", "mâncare", "rețete", "tradițional"]
    }
)
print(result)
# {
#   "relevance_score": 0.85,
#   "interpretation": "on_topic",
#   "topic_analysis": {
#     "content_topics": ["bucătărie", "mâncare", "rețete", "tradițional"],
#     "user_topics": ["sarmale", "mămăligă", "mâncăruri", "tradiționale"],
#     "topic_overlap": 0.85,
#     "suggested_redirect": None
#   }
# }

# Scenario 2: Off-topic response
result = scorer.score_relevance(
    user_text="Îmi place fotbalul. Echipa mea favorită este Steaua.",
    content_context={
        "title": "Bucătărie românească",
        "main_topics": ["bucătărie", "mâncare", "rețete", "tradițional"]
    }
)
print(result)
# {
#   "relevance_score": 0.15,
#   "interpretation": "off_topic",
#   "topic_analysis": {
#     "content_topics": ["bucătărie", "mâncare", "rețete", "tradițional"],
#     "user_topics": ["fotbal", "echipă", "Steaua"],
#     "topic_overlap": 0.0,
#     "suggested_redirect": "Let's get back to discussing: bucătărie, mâncare, rețete"
#   }
# }
```

---

## Integration with ChaosLimbă System

### API Endpoint

**Add to existing:** `POST /api/analyze`

The aggregator will call SPAM-B when enabled:

```typescript
// File: /lib/components/spam-b.ts

export async function spamBRelevance(
  userText: string,
  contentContext: ContentContext
): Promise<SpamBOutput> {
  const response = await fetch(process.env.SPAM_B_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_text: userText,
      content_context: contentContext
    })
  });

  return await response.json();
}
```

### Aggregator Updates

```typescript
// File: /lib/feedback-aggregator.ts

interface AggregatorConfig {
  enableSpamB: boolean;  // NEW: Feature flag for SPAM-B
  enableSpamC: boolean;  // Future: Feature flag for SPAM-C
}

export async function aggregateFeedback(
  inputType: 'speech' | 'text',
  analyses: ComponentAnalyses,
  config: AggregatorConfig = { enableSpamB: false, enableSpamC: false }
): Promise<UnifiedGradingReport> {

  // ... existing logic for grammar, pronunciation, SPAM-A, SPAM-D

  // NEW: Add SPAM-B relevance if enabled
  let relevance = null;
  if (config.enableSpamB && analyses.content_context) {
    relevance = await spamBRelevance(
      analyses.userText,
      analyses.content_context
    );
  }

  return {
    input_type: inputType,
    grammar: analyses.grammar,
    pronunciation: analyses.pronunciation,
    semantic_pragmatic: {
      similarity: analyses.spamA,      // SPAM-A
      relevance: relevance,            // SPAM-B (NEW)
      dialectal_pragmatic: null,       // SPAM-C (future)
      intonation: analyses.spamD       // SPAM-D
    },
    overall_score: calculateOverallScore(...)
  };
}
```

---

## Performance Metrics

### Expected Performance
- **Response Time**: 0.3-0.5 seconds
- **Accuracy**: 85-90% on topic detection
- **False Positive Rate**: <10% (incorrectly flagging on-topic as off-topic)
- **False Negative Rate**: <15% (missing off-topic responses)

### Limitations
- Works best with B1-C2 content (struggles with A1-A2 simple sentences)
- May have difficulty with highly abstract or metaphorical language
- Requires meaningful content context (at least 2-3 main topics)

---

## Testing Strategy

### Unit Tests

```typescript
describe('SPAM-B: Relevance Scorer', () => {
  test('detects on-topic response about Romanian food', async () => {
    const result = await spamBRelevance(
      'Îmi place sarmale și mămăligă',
      { main_topics: ['bucătărie', 'mâncare', 'rețete'] }
    );
    expect(result.relevance_score).toBeGreaterThan(0.7);
    expect(result.interpretation).toBe('on_topic');
  });

  test('detects off-topic response about sports', async () => {
    const result = await spamBRelevance(
      'Îmi place fotbalul',
      { main_topics: ['bucătărie', 'mâncare', 'rețete'] }
    );
    expect(result.relevance_score).toBeLessThan(0.3);
    expect(result.interpretation).toBe('off_topic');
  });

  test('detects partially relevant response', async () => {
    const result = await spamBRelevance(
      'Îmi place să mănânc când mă uit la fotbal',
      { main_topics: ['bucătărie', 'mâncare', 'rețete'] }
    );
    expect(result.relevance_score).toBeGreaterThan(0.3);
    expect(result.relevance_score).toBeLessThan(0.7);
    expect(result.interpretation).toBe('partially_relevant');
  });

  test('provides helpful redirect for off-topic', async () => {
    const result = await spamBRelevance(
      'Îmi place muzica rock',
      { main_topics: ['bucătărie', 'mâncare', 'rețete'] }
    );
    expect(result.topic_analysis.suggested_redirect).toContain('bucătărie');
  });
});
```

---

## When to Add SPAM-B (Decision Criteria)

### Add SPAM-B When:

1. **Beta Testing Shows Off-Topic Drift**
   - Users frequently go off-topic during Chaos Window exercises
   - More than 20% of responses are topic-unrelated

2. **User Feedback Requests It**
   - Users ask for "stay on track" features
   - Teachers report difficulty keeping students focused

3. **Content Type Demands It**
   - Open-ended conversation exercises (Chaos Window)
   - Thematic vocabulary practice
   - Story-based learning modules

### Don't Add SPAM-B If:

1. **Exercises Are Highly Structured**
   - Fill-in-the-blank exercises
   - Multiple choice questions
   - Grammar drills with expected answers

2. **Topic Drift Isn't an Issue**
   - Error Garden shows <10% off-topic patterns
   - Users naturally stay on track

3. **Resource Constraints**
   - Need to minimize response time
   - HF Inference API rate limits are being hit

---

## Error Garden Integration

### New Error Pattern Type

```typescript
interface OffTopicPattern {
  user_id: string;
  content_id: string;
  content_topic: string;
  user_topic: string;
  relevance_score: number;
  frequency: number;  // How often this user goes off-topic
  timestamp: Date;
}
```

### Pattern Analysis

```typescript
function analyzeOffTopicPatterns(userId: string): OffTopicInsights {
  const patterns = getOffTopicPatterns(userId);

  return {
    off_topic_frequency: patterns.length,
    common_distractions: extractCommonTopics(patterns.map(p => p.user_topic)),
    avg_relevance_score: calculateAverage(patterns.map(p => p.relevance_score)),
    recommendation: generateRecommendation(patterns)
  };
}
```

---

## UI Integration

### Feedback Display

When SPAM-B detects off-topic response:

```tsx
{relevance && relevance.interpretation === 'off_topic' && (
  <Alert variant="warning">
    <AlertTitle>Off-Topic Response</AlertTitle>
    <AlertDescription>
      Your response seems to be about <strong>{relevance.topic_analysis.user_topics.join(', ')}</strong>,
      but we're discussing <strong>{relevance.topic_analysis.content_topics.join(', ')}</strong>.
      {relevance.topic_analysis.suggested_redirect && (
        <p className="mt-2">{relevance.topic_analysis.suggested_redirect}</p>
      )}
    </AlertDescription>
  </Alert>
)}
```

---

## Build Checklist (Phase 2: Days 14-16)

### Day 14: Model Deployment
- [ ] Set up HuggingFace Inference API endpoint for readerbench/ro-text-summarization
- [ ] Test summarization on sample Romanian texts
- [ ] Implement topic extraction logic
- [ ] Test topic overlap calculation
- [ ] Deploy Python API wrapper

### Day 15: Integration
- [ ] Add `enableSpamB` feature flag to Aggregator
- [ ] Update Aggregator to call SPAM-B when enabled
- [ ] Update API response schema to include relevance field
- [ ] Add SPAM-B component wrapper in `/lib/components/spam-b.ts`

### Day 16: Testing & Polish
- [ ] Write unit tests for SPAM-B
- [ ] Integration testing with Aggregator
- [ ] Update Error Garden to track off-topic patterns
- [ ] Add UI components for relevance feedback
- [ ] Documentation updates

---

## Success Criteria

- [ ] Relevance detection accuracy >85%
- [ ] Off-topic false positive rate <10%
- [ ] Response time <0.5 seconds
- [ ] Successfully integrated with Aggregator
- [ ] Error Garden tracking off-topic patterns
- [ ] UI displays relevant feedback to users

---

**Implementation Note**: SPAM-B was implemented on Jan 27, 2026 using a smarter approach than this original spec — it reuses SPAM-A's sentence embeddings (paraphrase-multilingual-MiniLM-L12-v2) instead of the readerbench/ro-text-summarization model. See `src/lib/ai/spamB.ts` and `docs/archive/SPAM-B-VERIFICATION.md` for actual implementation details. The standalone `/api/spam-b` endpoint was later removed in the Feb 7 cleanup; SPAM-B is now called internally by the aggregator.
