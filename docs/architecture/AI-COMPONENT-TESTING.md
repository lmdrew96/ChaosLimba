# AI Component Testing & Verification

Quick guide for verifying all AI grading components are operational.

---

## Quick Verification (2 minutes)

Run the automated verification script:

```bash
npx tsx scripts/verify-all-components.ts
```

**Expected Output:** All components show ✅ PASS status

This tests:
- Speech Recognition (Groq Whisper)
- Pronunciation (Wav2Vec2)
- Grammar (Claude Haiku 4.5)
- SPAM-A (Semantic Similarity)
- SPAM-D (Intonation/Stress)
- Aggregator (Feedback Combination)
- Conductor (Orchestration)
- Groq API (LLM Backend)
- Tutor (AI Learning Guide)
- Cache Performance

---

## Health Check

> **Note:** The standalone `/api/health/ai-components` endpoint was removed in the Feb 7, 2026 dead code cleanup. Use the verification script below for component health checks.

---

## Troubleshooting

### SPAM-A Shows "degraded"

**Cause:** HuggingFace API is down or rate-limited.

**Impact:** Semantic similarity uses Levenshtein distance fallback (less accurate but functional).

**Fix:**
- Check HuggingFace status: https://status.huggingface.co/
- Verify `HUGGINGFACE_API_KEY` or `HUGGINGFACE_API_TOKEN` is set
- Wait for HF API to recover (retry logic handles this automatically)

---

### Grammar Component Slow (>3s)

**Cause:** Claude API latency or cold start.

**Expected Behavior:**
- First call: 1-3 seconds (API call)
- Cached calls: <50ms (cache hit)

**Check:** Run verification script twice - second run should be much faster.

---

### Pronunciation Component Timeout

**Cause:** Wav2Vec2 model cold start on HuggingFace Inference.

**Expected Behavior:**
- Cold start: 10-30 seconds (model loading)
- Warm: <3 seconds

**Note:** This is normal for serverless ML models. Cache helps after first call.

---

### Groq API Failing

**Cause:** Missing `GROQ_API_KEY` or API outage.

**Fix:**
- Verify `.env` has `GROQ_API_KEY=...`
- Check Groq status: https://console.groq.com/

**Impact:** Speech-to-text and Tutor features won't work.

---

## Environment Variables Required

```bash
# Required for Grammar
ANTHROPIC_API_KEY=sk-ant-...

# Required for Speech Recognition & Tutor
GROQ_API_KEY=gsk_...

# Required for Pronunciation & SPAM-A
HUGGINGFACE_API_KEY=hf_...
# OR
HUGGINGFACE_API_TOKEN=hf_...
```

---

## Cache Performance

Components use aggressive caching (30-min TTL):
- **Grammar:** Normalized text as key
- **SPAM-A:** Bidirectional text pair (sorted)
- **Pronunciation:** Audio data hash

**Expected Cache Speedup:** 10-100x faster

**Clear Cache (if needed):**
```typescript
import { clearSpamACache } from '@/lib/ai/spamA';
clearSpamACache(); // Clears SPAM-A cache
```

---

## Component-Specific Notes

### Grammar (Claude Haiku 4.5)
- Detects: verb conjugation, diacritics, articles, agreement
- Confidence scoring: 0.85-0.95 depending on error type
- Fallback: None (API must be available)

### SPAM-A (Semantic Similarity)
- Model: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- Fallback: Levenshtein distance (text similarity)
- Default threshold: 0.75 (75% match)

### SPAM-D (Intonation)
- Local lookup table (no API call)
- 10 Romanian stress minimal pairs
- Always fast (<10ms)
- No dependencies

### Pronunciation (Wav2Vec2)
- Model: `gigant/romanian-wav2vec2`
- Max audio size: 10MB
- Returns: transcription + pronunciation score
- Scoring: Levenshtein similarity vs expected text

### Aggregator
- Combines all component outputs
- Weighted scoring:
  - Text mode: Grammar 60%, Semantic 40%
  - Speech mode: Grammar 40%, Pronunciation 30%, Semantic 30%
- Extracts error patterns for Error Garden

---

## Running Unit Tests

```bash
# All tests
npm test

# Specific test suites
npm test -- aggregator.test
npm test -- spamD.test
```

**Coverage:**
- Aggregator: 47 tests
- SPAM-D: 37 tests

---

## Performance Benchmarks

**Target Latencies:**
- Grammar: <3s uncached, <50ms cached
- SPAM-A: <2s uncached, <50ms cached
- SPAM-D: <10ms (always local)
- Pronunciation: <3s warm, 10-30s cold start
- Aggregator: <50ms
- Conductor routing: <1ms overhead

**Check Performance:**
The verification script includes cache performance tests.

---

## When to Re-verify

Run verification after:
- Updating AI component code
- Changing API keys
- Deploying to production
- Suspecting component failures
- Adding new error types to grammar

---

## Quick Reference

| Component | API Key | Fallback | Cache TTL |
|-----------|---------|----------|-----------|
| Grammar | ANTHROPIC_API_KEY | None | 30 min |
| SPAM-A | HUGGINGFACE_API_KEY | Levenshtein | 30 min |
| SPAM-D | None (local) | N/A | N/A |
| Pronunciation | HUGGINGFACE_API_KEY | None | 30 min |
| Speech-to-Text | GROQ_API_KEY | None | N/A |
| Tutor | GROQ_API_KEY | Graceful message | N/A |

---

**Last Updated:** February 9, 2026
**Verification Script:** [verify-all-components.ts](../../scripts/verify-all-components.ts)
