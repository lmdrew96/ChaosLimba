# SPAM-D Implementation Plan

Implement SPAM-D (Intonation-Meaning Mapper), a rule-based component that detects stress pattern shifts that change word meaning in Romanian. This component will identify when incorrect stress patterns change the meaning of Romanian words using a curated lookup table of minimal pairs.

## What I'll Build

- **TypeScript interfaces** for stress variants and minimal pairs
- **Lookup table** with 50-100 stress-based minimal pairs (starting with the 10 documented examples)
- **Core detection function** `checkIntonationShift()` that analyzes user speech patterns
- **Context helper** `determineExpectedStress()` for predicting appropriate stress
- **Integration** with existing AI pipeline through the router system
- **Unit tests** to validate accuracy and ensure no false positives

## Files I'll Create/Modify

- **New:** `/src/lib/ai/spamD.ts` - Core SPAM-D implementation with interfaces and functions
- **Modify:** `/src/lib/ai/router.ts` - Add SPAM-D to speech processing pipeline
- **New:** `/src/lib/ai/__tests__/spamD.test.ts` - Unit tests for SPAM-D functionality
- **New:** `/src/types/intonation.ts` - TypeScript type definitions for intonation warnings

## Implementation Details

### Phase 1: Core Data Structure
- Create TypeScript interfaces for `StressVariant`, `MinimalPair`, and `IntonationWarning`
- Implement the initial 10 documented minimal pairs from the specification
- Structure data for easy lookup and future expansion

### Phase 2: Detection Logic
- Implement `checkIntonationShift()` function that compares user stress patterns with expected patterns
- Create `determineExpectedStress()` helper (V1: most common pattern, V2: context analysis)
- Add severity-based warning generation (high/medium/low)

### Phase 3: Integration
- Add SPAM-D to the speech processing pipeline in router.ts
- Ensure proper error handling and fallback behavior
- Maintain compatibility with existing AI components

### Phase 4: Testing & Validation
- Unit tests for all 10 initial minimal pairs
- False positive testing with non-minimal pair words
- Performance validation (<10ms response time)

## Technical Specifications

- **Performance:** <10ms response time (in-app, no API calls)
- **Memory:** ~50-200KB for lookup table
- **Accuracy:** >90% on known pairs, 0% false positives on unknown words
- **Cost:** $0 (rule-based, no external dependencies)

## Key Features

1. **Zero Cost:** No API calls, runs entirely in-app
2. **Instant Response:** No network latency
3. **Deterministic:** Same input always produces same output
4. **Explainable:** Clear warnings showing meaning changes
5. **Expandable:** Easy to add new minimal pairs

## Example Usage

```typescript
// User says "tor-TU-ri" (tortures) when context suggests "TOR-tu-ri" (cakes)
const warnings = checkIntonationShift(
  "Vreau torturi de ciocolată",
  [{ word: "torturi", stress: "tor-TU-ri" }]
);
// Returns warning about meaning change from "cakes" to "tortures"
```

## Success Criteria

- ✅ Detects all 10 initial minimal pairs with >90% accuracy
- ✅ No false positives on regular Romanian words
- ✅ Integrates seamlessly with existing AI pipeline
- ✅ Provides clear, actionable feedback to users
- ✅ Performance under 10ms per analysis

This implementation will provide a solid foundation for detecting stress-based meaning changes in Romanian, with room for future expansion to 50-100 minimal pairs as planned in the specification.
