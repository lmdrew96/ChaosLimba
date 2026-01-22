# ChaosLimbă Architecture Migration Guide: v1.0 → v2.0

**Migration Date:** January 19, 2026
**Architecture Change:** 4-Model System → 7-Component Ensemble with Dual-Path Routing
**Status:** Documentation Complete, Implementation In Progress

---

## Executive Summary

### What's Changing

**From (v1.0):**
- 4 models (Speech, Pronunciation, Grammar, Semantic)
- Single processing pipeline
- All models active for every input
- 100% of inputs processed the same way

**To (v2.0):**
- 7 components (5 ML models + 1 rule-based + 1 router)
- Dual-path processing (speech vs. text)
- Conditional component activation
- Speech path: 5 components active | Text path: 2 components active

### Why This Matters

1. **Cost Reduction**: $20-35/month → $10-18/month (40% savings)
2. **Performance**: Text inputs 40-50% faster
3. **Flexibility**: Can add text-only features without speech overhead
4. **Maintainability**: Modular components easier to debug and update
5. **Scalability**: Can optimize each path independently

### Impact on Development

- **Training Required**: 4 models → 1 model (grammar already done ✅)
- **New Code**: ~7 new files + updates to 3 existing files
- **Timeline**: ~13 days for complete implementation
- **Breaking Changes**: API response schema (adds `input_type` field)

---

## Architecture Comparison

### v1.0 Architecture (OLD)

```
User Input (any type)
    ↓
Speech Recognition (always)
    ↓
┌─────────────────────┬─────────────────────┬──────────────────┐
│ Pronunciation       │ Grammar             │ Semantic         │
│ (always)            │ (always)            │ (always)         │
└─────────────────────┴─────────────────────┴──────────────────┘
    ↓
Feedback Aggregator
    ↓
Output
```

**Problems:**
- Text inputs waste resources on pronunciation analysis
- Can't run pronunciation on text (but tries anyway)
- Fixed cost per request regardless of input type
- All-or-nothing approach

### v2.0 Architecture (NEW)

```
User Input
    ↓
Router (detects: speech or text?)
    ├─ SPEECH PATH ─────────────────────┐
    │   Speech Recognition               │
    │       ↓                            │
    │   ┌────────────┬─────────────┐    │
    │   │ Grammar    │ Pronunciation│    │
    │   └────────────┴─────────────┘    │
    │       ↓                            │
    │   SPAM-A Semantic                  │
    │       ↓                            │
    │   SPAM-D Intonation                │
    │       ↓                            │
    │   Feedback Aggregator (full)       │
    │                                    │
    └─ TEXT PATH ──────────────────────┐│
        ┌────────────┬─────────────┐   ││
        │ Grammar    │ SPAM-A      │   ││
        └────────────┴─────────────┘   ││
            ↓                          ││
        Feedback Aggregator (partial)  ││
            ↓                          ││
        Output ←───────────────────────┘│
```

**Benefits:**
- Text inputs skip unnecessary components
- Each path optimized for its input type
- Variable cost per request (cheaper for text)
- Modular and extensible

---

## Component-by-Component Changes

### NEW Components

#### Component 6: Router
**Status**: 🔧 Needs Implementation
**File**: `/lib/router.ts`
**Purpose**: Detect input type and route to appropriate path

**Key Functions**:
```typescript
export function routeInput(userInput: UserInput): Promise<GradingReport>
function detectInputType(userInput: UserInput): 'speech' | 'text'
async function processSpeechPath(audioInput: AudioInput): Promise<GradingReport>
async function processTextPath(textInput: TextInput): Promise<GradingReport>
```

**Implementation Priority**: HIGH (required for v2.0 to function)

#### Component 7: Feedback Aggregator
**Status**: 🔧 Needs Implementation
**File**: `/lib/feedback-aggregator.ts`
**Purpose**: Combine component outputs into unified report

**Key Functions**:
```typescript
export function aggregateFeedback(
  inputType: 'speech' | 'text',
  analyses: ComponentAnalyses
): UnifiedGradingReport

function calculateOverallScore(scores: Scores, inputType: 'speech' | 'text'): number
```

**Implementation Priority**: HIGH (required for v2.0 to function)

### UPDATED Components

#### Component 1: Speech Recognition
**Change**: Add explicit activation condition
**File**: `/lib/components/speech.ts`
**Update**: Now only called by speech path

```typescript
// OLD: Called for all inputs
export async function speechRecognition(input: any) { ... }

// NEW: Only called for audio inputs
export async function speechRecognition(audioInput: AudioInput) {
  if (!audioInput.audioBlob && !audioInput.audioFile) {
    throw new Error('Speech recognition requires audio input');
  }
  // ... existing logic
}
```

#### Component 2: Pronunciation Analysis
**Change**: Add explicit activation condition
**File**: `/lib/components/pronunciation.ts`
**Update**: Now only called by speech path

#### Component 3: Grammar Correction
**Change**: None (already works for both)
**File**: `/lib/components/grammar.ts`
**Status**: ✅ No changes needed

#### Component 4: SPAM-A Semantic
**Change**: Rename from "Semantic" to "SPAM-A"
**File**: `/lib/components/semantic.ts` → `/lib/components/spam-a.ts`
**Update**: Clarify that this is specifically semantic similarity

#### Component 5: SPAM-D Intonation
**Status**: 🆕 NEW (did not exist in v1.0)
**File**: `/lib/spam-d-minimal-pairs.ts` + `/lib/components/spam-d.ts`
**Purpose**: Rule-based intonation meaning mapper

**Key Functions**:
```typescript
export function checkIntonationShift(
  transcript: string,
  stressPatterns: StressPattern[]
): IntonationWarnings
```

**Implementation Priority**: MEDIUM (required for MVP but can be stubbed initially)

---

## Database Schema Changes

### User Profile Updates

**ADD** to `user_profiles` table:

```sql
ALTER TABLE user_profiles
ADD COLUMN total_speech_inputs INTEGER DEFAULT 0,
ADD COLUMN total_text_inputs INTEGER DEFAULT 0,
ADD COLUMN grammar_errors_from_speech JSONB DEFAULT '{}',
ADD COLUMN grammar_errors_from_text JSONB DEFAULT '{}',
ADD COLUMN pronunciation_errors JSONB DEFAULT '{}',
ADD COLUMN avg_score_speech DECIMAL(3,2),
ADD COLUMN avg_score_text DECIMAL(3,2);
```

### New Table: Grading Reports

**CREATE** new table:

```sql
CREATE TABLE grading_reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(user_id),
  created_at TIMESTAMP DEFAULT NOW(),

  -- Input metadata
  input_type VARCHAR(10) CHECK (input_type IN ('speech', 'text')),
  content_id UUID,

  -- Scores (always present)
  grammar_score DECIMAL(3,2) NOT NULL,
  semantic_score DECIMAL(3,2) NOT NULL,

  -- Scores (only for speech)
  pronunciation_score DECIMAL(3,2),
  intonation_warnings INTEGER,

  -- Full report data
  report_data JSONB NOT NULL,

  -- Indexes
  CONSTRAINT check_speech_scores CHECK (
    (input_type = 'speech' AND pronunciation_score IS NOT NULL) OR
    (input_type = 'text' AND pronunciation_score IS NULL)
  )
);

CREATE INDEX idx_user_input_type ON grading_reports(user_id, input_type);
CREATE INDEX idx_created_at ON grading_reports(created_at);
```

**Migration Script**: `/migrations/002_add_v2_architecture.sql`

---

## API Changes

### POST /api/analyze

**Request Schema** (UPDATED):

```typescript
interface AnalyzeRequest {
  user_id: string;
  input_type: 'speech' | 'text';  // NEW: explicit input type
  content: {
    audio_blob?: string;  // For speech input
    text?: string;        // For text input
  };
  context: {
    content_id?: string;
    expected_response?: string;
    difficulty_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  };
}
```

**Response Schema** (UPDATED):

```typescript
interface GradingReport {
  report_id: string;
  input_type: 'speech' | 'text';  // NEW
  timestamp: string;

  // Always present
  grammar: GrammarAnalysis;
  semantic: SemanticAnalysis;

  // Conditionally present (null for text input)
  pronunciation: PronunciationAnalysis | null;  // NEW: nullable
  intonation: IntonationAnalysis | null;        // NEW: nullable

  overall_score: number;
  next_steps?: NextSteps;
}
```

**Breaking Change**: Clients must handle `pronunciation` and `intonation` being `null` for text inputs.

**Migration Strategy for Frontend**:
```typescript
// OLD CODE (v1.0)
const pronunciationScore = response.pronunciation.phoneme_score;

// NEW CODE (v2.0)
const pronunciationScore = response.pronunciation?.phoneme_score ?? null;

// Or with type guard
if (response.input_type === 'speech' && response.pronunciation) {
  const pronunciationScore = response.pronunciation.phoneme_score;
}
```

---

## File Structure Changes

### New Files to Create

```
/lib/
  ├── router.ts                         # NEW: Input routing logic
  ├── feedback-aggregator.ts            # NEW: Score aggregation
  ├── spam-d-minimal-pairs.ts           # NEW: Minimal pairs data
  └── components/
      ├── spam-a.ts                     # RENAMED: semantic.ts → spam-a.ts
      └── spam-d.ts                     # NEW: Intonation checker

/migrations/
  └── 002_add_v2_architecture.sql       # NEW: DB schema updates

/tests/
  ├── router.test.ts                    # NEW: Router tests
  ├── feedback-aggregator.test.ts       # NEW: Aggregator tests
  └── spam-d.test.ts                    # NEW: Intonation tests
```

### Files to Update

```
/lib/components/
  ├── speech.ts          # Add input validation
  ├── pronunciation.ts   # Add input validation
  └── grammar.ts         # No changes needed ✅

/api/routes/
  └── analyze.ts         # Update to use router

/lib/
  ├── error-garden.ts    # Add input_type tracking
  └── user-profile.ts    # Handle new fields

/components/ui/
  └── FeedbackDisplay.tsx # Handle conditional fields
```

---

## Implementation Phases

### Phase 1: Text Path (Days 1-4) ✅ PRIORITY

**Goal**: Get text input working end-to-end

**Tasks**:
1. ✅ Create router with text branch only
2. ✅ Deploy SPAM-A to HuggingFace Inference
3. ✅ Create feedback aggregator (text-only version)
4. ✅ Update API endpoint to use router
5. ✅ Test text input path end-to-end

**Deliverable**: Users can type Romanian and get grammar + semantic feedback

**Testing Checklist**:
- [ ] Router correctly detects text input
- [ ] Grammar analysis works on text
- [ ] SPAM-A semantic similarity works
- [ ] Aggregator returns correct schema for text input
- [ ] API returns `input_type: 'text'` and `pronunciation: null`

### Phase 2: Speech Path (Days 5-10)

**Goal**: Get speech input working with full pipeline

**Tasks**:
1. Deploy Whisper to Groq (Component 1)
2. Deploy Wav2Vec2 to RunPod (Component 2)
3. Build SPAM-D minimal pairs (Component 5)
   - Days 5-6: Research 50-100 minimal pairs
   - Day 7: Implement logic
   - Day 8: Test and validate
4. Extend router to handle speech branch
5. Extend aggregator to handle speech data
6. Test speech input path end-to-end

**Deliverable**: Users can speak Romanian and get full 5-component grading

**Testing Checklist**:
- [ ] Router correctly detects speech input
- [ ] Speech recognition transcribes audio
- [ ] Grammar + pronunciation run in parallel
- [ ] SPAM-A semantic similarity works
- [ ] SPAM-D flags known minimal pairs
- [ ] Aggregator returns full schema for speech input
- [ ] API returns all 5 analysis results

### Phase 3: Integration (Days 11-13)

**Goal**: Polish and production-readiness

**Tasks**:
1. Update Error Garden with input_type tracking
2. Update user profile database with new fields
3. Frontend updates to handle conditional fields
4. End-to-end testing (both paths)
5. Performance optimization
6. Bug fixes and polish
7. Documentation updates

**Deliverable**: Full MVP ready for beta testing

**Testing Checklist**:
- [ ] Both paths work reliably
- [ ] Database correctly tracks input types
- [ ] Error Garden clusters errors by modality
- [ ] Frontend gracefully handles null fields
- [ ] Performance meets targets (<1s text, <2s speech)
- [ ] All documentation updated

---

## Testing Strategy

### Unit Tests

**Router Tests** (`/tests/router.test.ts`):
```typescript
describe('Router', () => {
  test('detects speech input from audioBlob', () => {
    const input = { audioBlob: '...' };
    expect(detectInputType(input)).toBe('speech');
  });

  test('detects text input from textContent', () => {
    const input = { textContent: 'Bună ziua' };
    expect(detectInputType(input)).toBe('text');
  });

  test('throws error for ambiguous input', () => {
    const input = {};
    expect(() => detectInputType(input)).toThrow();
  });
});
```

**Feedback Aggregator Tests** (`/tests/feedback-aggregator.test.ts`):
```typescript
describe('Feedback Aggregator', () => {
  test('returns full report for speech input', () => {
    const result = aggregateFeedback('speech', mockSpeechAnalyses);
    expect(result.pronunciation).not.toBeNull();
    expect(result.intonation).not.toBeNull();
  });

  test('returns partial report for text input', () => {
    const result = aggregateFeedback('text', mockTextAnalyses);
    expect(result.pronunciation).toBeNull();
    expect(result.intonation).toBeNull();
  });

  test('calculates correct overall score for speech', () => {
    const result = aggregateFeedback('speech', {
      grammar: { score: 0.8 },
      pronunciation: { phoneme_score: 0.7 },
      semantic: { similarity_score: 0.9 }
    });
    // 0.8*0.4 + 0.7*0.3 + 0.9*0.3 = 0.80
    expect(result.overall_score).toBeCloseTo(0.80, 2);
  });
});
```

### Integration Tests

**Speech Path Integration**:
```typescript
describe('Speech Path Integration', () => {
  test('processes speech through full pipeline', async () => {
    const result = await routeInput({
      type: 'speech',
      audioBlob: testAudioFile
    });

    expect(result.input_type).toBe('speech');
    expect(result.grammar).toBeDefined();
    expect(result.pronunciation).toBeDefined();
    expect(result.semantic).toBeDefined();
    expect(result.intonation).toBeDefined();
  });
});
```

**Text Path Integration**:
```typescript
describe('Text Path Integration', () => {
  test('processes text through simplified pipeline', async () => {
    const result = await routeInput({
      type: 'text',
      textContent: 'Bună ziua, mă numesc Nae'
    });

    expect(result.input_type).toBe('text');
    expect(result.grammar).toBeDefined();
    expect(result.semantic).toBeDefined();
    expect(result.pronunciation).toBeNull();
    expect(result.intonation).toBeNull();
  });
});
```

---

## Rollback Plan

If v2.0 implementation encounters critical issues:

### Option 1: Feature Flag (Recommended)

Add environment variable to toggle between architectures:
```bash
ARCHITECTURE_VERSION=v2.0  # or v1.0
```

Keep v1.0 code in place and route based on flag:
```typescript
if (process.env.ARCHITECTURE_VERSION === 'v2.0') {
  return routeInput(input);  // New architecture
} else {
  return processAllComponents(input);  // Old architecture
}
```

### Option 2: Git Revert

If complete rollback needed:
```bash
git revert <migration-commit-hash>
git push origin main
```

### Option 3: Gradual Rollout

Deploy v2.0 for percentage of users:
```typescript
const useV2 = userId.hashCode() % 100 < ROLLOUT_PERCENTAGE;
```

---

## Environment Variables

### New Required Variables

```bash
# Groq API (for Whisper - Component 1)
GROQ_API_KEY=your_groq_api_key

# RunPod Endpoints
RUNPOD_GRAMMAR_ENDPOINT=https://...      # Existing
RUNPOD_PRONUNCIATION_ENDPOINT=https://...  # NEW for Component 2

# HuggingFace Inference
HF_API_TOKEN=your_hf_token  # Optional, for Component 4
```

### Deployment Checklist

- [ ] Sign up for Groq API key
- [ ] Deploy Wav2Vec2 model to RunPod
- [ ] Update environment variables in production
- [ ] Test API keys in staging environment
- [ ] Monitor rate limits and quotas

---

## Performance Monitoring

### Metrics to Track

**Response Times**:
- `api.analyze.speech.duration` (target: <1.5s)
- `api.analyze.text.duration` (target: <0.8s)
- `router.detection.duration` (target: <1ms)

**Component Times**:
- `speech_recognition.duration`
- `pronunciation.duration`
- `grammar.duration`
- `spam_a.duration`
- `spam_d.duration`

**Costs**:
- `api.analyze.speech.cost` (target: <$0.005)
- `api.analyze.text.cost` (target: <$0.002)
- `monthly_hosting.total` (target: <$18)

**Accuracy**:
- `speech_recognition.wer` (target: <15%)
- `pronunciation.phoneme_accuracy` (target: >75%)
- `grammar.bleu_score` (target: >65)
- `spam_d.false_positive_rate` (target: <5%)

### Alerts to Configure

- Response time > 3 seconds (95th percentile)
- Monthly hosting costs > $20
- Error rate > 5% for any component
- Speech recognition WER > 20%

---

## Success Criteria

### MVP Launch Requirements

**Functional**:
- ✅ Router correctly detects input types
- ✅ Both paths return valid responses
- ✅ Database correctly tracks input types
- ✅ API schema matches documentation

**Performance**:
- ✅ Text path <1 second response time
- ✅ Speech path <2 second response time
- ✅ SPAM-D <10ms response time

**Cost**:
- ✅ Monthly hosting <$20
- ✅ Per-request cost <$0.01

**Quality**:
- ✅ Speech WER <15%
- ✅ Grammar BLEU >65 (already 68.92 ✅)
- ✅ SPAM-D >90% accuracy on known pairs

---

## Documentation Updates Required

### Files to Update

- [x] `/ML Resources/system-architecture-description.md` - ✅ COMPLETE
- [x] `/chaoslimba/README.md` - ✅ COMPLETE
- [x] `/ML Resources/spam-d-minimal-pairs-specification.md` - ✅ COMPLETE
- [ ] `/ML Resources/datasets/datasets-list.md` - Add new models
- [ ] `/Guiding Documentation/feature-specifications.md` - Update Grading Engine section
- [ ] `/API-Documentation.md` (create new) - Document v2.0 endpoints
- [ ] `/CHANGELOG.md` (create new) - Document all changes

### New Documentation to Create

- [ ] Component specification docs (one per component)
- [ ] Router implementation guide
- [ ] SPAM-D minimal pairs research methodology
- [ ] Migration testing guide
- [ ] Frontend integration guide for conditional fields

---

## Common Issues & Solutions

### Issue: Router Not Detecting Input Type

**Symptoms**: Router throws "Cannot determine input type"

**Solutions**:
- Check that input has either `audioBlob` or `textContent` field
- Verify field names match expected schema
- Check for null/undefined values

### Issue: Pronunciation Analysis Called on Text Input

**Symptoms**: Error "Cannot analyze pronunciation without audio"

**Solutions**:
- Verify router is correctly routing to text path
- Check that pronunciation component has input validation
- Ensure aggregator handles null pronunciation gracefully

### Issue: SPAM-D Not Flagging Known Minimal Pairs

**Symptoms**: No intonation warnings for words like "torturi"

**Solutions**:
- Verify stress pattern format matches lookup table
- Check word spelling/normalization
- Validate stress patterns are being extracted from pronunciation component

### Issue: Database Constraint Violation

**Symptoms**: "pronunciation_score cannot be null for speech input"

**Solutions**:
- Verify all speech path components completed successfully
- Check aggregator is setting pronunciation fields
- Ensure database migration ran correctly

---

## Contact & Support

For questions during migration:
- **Architecture Questions**: See `/ML Resources/system-architecture-description.md`
- **Component Questions**: See component-specific docs
- **Bug Reports**: Create GitHub issue with `[v2.0-migration]` tag
- **Email**: lmdrew96@gmail.com

---

**Migration Status**: 📝 Documentation Complete | 🔧 Implementation In Progress
**Next Steps**: Begin Phase 1 implementation (Text Path)
