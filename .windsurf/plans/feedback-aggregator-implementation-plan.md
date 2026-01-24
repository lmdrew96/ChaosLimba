# Feedback Aggregator Implementation Plan

The Feedback Aggregator is Component 9 of ChaosLimbă's 9-component AI ensemble, responsible for combining outputs from all active diagnostic components into unified grading reports with adaptive scoring based on input type.

## What I'll Build

- **Core Feedback Aggregator module** (`/src/lib/ai/aggregator.ts`) that processes component outputs and generates unified reports
- **Type definitions** for aggregated feedback reports supporting both speech and text input paths  
- **Weighted scoring system** that adapts based on input type (speech vs text)
- **Error Garden integration** to feed aggregated error data into the pattern clustering system
- **Comprehensive test suite** covering all input types and edge cases

## Key Features

### Dual-Path Support
- **Speech Path**: Combines grammar + pronunciation + semantic + intonation analyses
- **Text Path**: Combines grammar + semantic analyses (pronunciation/intonation = null)

### Adaptive Weighting System
- **Speech Input**: Grammar (40%) + Pronunciation (30%) + Semantic (30%)
- **Text Input**: Grammar (60%) + Semantic (40%)

### Unified Report Structure
```typescript
interface AggregatedReport {
  inputType: 'speech' | 'text';
  overallScore: number;
  grammar: GrammarResult;
  pronunciation?: PronunciationResult;  // Speech only
  semantic: SpamAResult;
  intonation?: { warnings: IntonationWarning[] };  // Speech only
  errorPatterns: ExtractedErrorPattern[];  // For Error Garden
  processingTime: number;
  componentResults: ComponentStatus;  // Which components were active
}
```

### Error Garden Integration
- Extracts and standardizes error patterns from all components
- Formats data for ML clustering pipeline
- Tracks input-type-specific errors (speech vs text)

## Implementation Steps

1. **Create core aggregator module** with input type detection and component orchestration
2. **Implement weighted scoring algorithms** for both speech and text paths
3. **Build error pattern extraction** for Error Garden integration
4. **Add comprehensive error handling** and fallback mechanisms
5. **Create test suite** covering all scenarios and edge cases
6. **Update router** to include aggregator intent
7. **Integration testing** with existing AI components

## Files to Create/Modify

- **NEW**: `/src/lib/ai/aggregator.ts` - Main aggregator implementation
- **NEW**: `/src/lib/ai/__tests__/aggregator.test.ts` - Test suite
- **MODIFY**: `/src/lib/ai/router.ts` - Add aggregator intent
- **NEW**: `/src/types/aggregator.ts` - Type definitions

## Technical Requirements

- **TypeScript strict mode** with full type safety
- **Error handling** with graceful degradation for missing components
- **Performance monitoring** with processing time tracking
- **Caching** for repeated analyses (optional optimization)
- **Logging** for debugging and cost tracking

## Success Criteria

- ✅ Handles both speech and text input paths correctly
- ✅ Generates accurate weighted scores based on input type
- ✅ Extracts error patterns in Error Garden-compatible format
- ✅ Gracefully handles missing/failed component analyses
- ✅ Maintains <50ms processing overhead
- ✅ Passes comprehensive test suite including edge cases

This implementation will complete the MVP AI ensemble by providing the crucial integration layer that makes all 7 components work together as a unified diagnostic system.
