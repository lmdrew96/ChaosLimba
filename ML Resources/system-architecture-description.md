# ChaosLimbă Complete Ensemble Architecture: System Overview
**Document Version:** 3.0 - FULL ENSEMBLE
**Last Updated:** January 19, 2026
**Architecture Type:** 9-Component Ensemble with Dual-Path Routing (7 MVP + 2 Post-MVP)

## System Overview

The ChaosLimbă system is a sophisticated adaptive language learning platform that leverages a modular 9-component ensemble architecture to provide personalized Romanian language instruction. The system employs **dual-path processing** that conditionally activates components based on input type (speech vs. text), optimizing both performance and cost while maintaining comprehensive language skill assessment.

### Complete System Architecture (3 Phases)

**Total Components:** 9
- **Core Processing:** 3 (Speech Recognition, Pronunciation, Grammar)
- **SPAM Ensemble:** 4 (Semantic, Relevance, Dialectal/Pragmatic, Intonation)
- **Integration Layer:** 2 (Router, Aggregator)

### SPAM: The 4-Component Ensemble

**SPAM (Semantic/Pragmatic Analysis Module)** is a specialized ensemble for meaning, relevance, and appropriateness analysis:

| Component | Function | MVP Status | Launch Phase |
|-----------|----------|------------|--------------|
| **SPAM-A: Semantic Similarity** | Meaning match detection | ✅ MVP | Phase 1 (Days 1-13) |
| **SPAM-B: Relevance Scorer** | On-topic detection | 🟡 Post-MVP | Phase 2 (Days 14-16) |
| **SPAM-C: Dialectal/Pragmatic** | Regional variation + formality | 🟡 Post-MVP | Phase 3 (Days 17-23) |
| **SPAM-D: Intonation Mapper** | Stress-based meaning shifts | ✅ MVP | Phase 1 (Days 1-13) |

**Why 4 components instead of 1:**
- **Semantic similarity** ≠ **relevance** (can be semantically similar but off-topic)
- **Standard Romanian** ≠ **dialectal Romanian** (regional variations need specialized handling)
- **Text meaning** ≠ **intonation meaning** (stress patterns change meaning)
- Each requires different models/techniques

### Key Architectural Changes (v3.0)
- **Component Count**: Total of 9 components (7 MVP + 2 Post-MVP enhancements)
- **Input Routing**: Intelligent router conditionally activates components based on input type
- **SPAM Ensemble**: Full 4-component ensemble (A: Semantic, B: Relevance, C: Dialectal, D: Intonation)
- **Phased Rollout**: MVP launch with 50% SPAM coverage (A + D), expandable to 100% (A + B + C + D)
- **Cost Optimization**: MVP $10-18/month, Full Ensemble $12-21/month
- **Processing Speed**: Text inputs process 40-50% faster than speech inputs

## Core System Components

### 1. Input Layer & Intelligent Router

**Primary Input Sources:**
- **User Input**: Speech and text data from language learners
- **User Profile Database**: Historical data containing user weaknesses, learning patterns, and progress history

**Router Component (NEW):**
The router is a conditional logic system that detects input type and routes to the appropriate processing path:

- **Speech Input Path**: Activates all 5 ML models + rule-based intonation checker
  - Components: Speech Recognition → Grammar + Pronunciation (parallel) → SPAM-A Semantic → SPAM-D Intonation
  - Processing Time: 1.0-1.5 seconds
  - Cost per request: ~$0.003-0.005

- **Text Input Path**: Activates only 2 ML models (grammar + semantic)
  - Components: Grammar + SPAM-A Semantic (parallel only)
  - Processing Time: 0.5-0.8 seconds
  - Cost per request: ~$0.001-0.002
  - Pronunciation and intonation components are skipped

This dual-path approach enables the system to accept multimodal input while optimizing resource usage based on what analysis is actually possible and valuable for each input type.

### 2. The Grading & Harvesting Engine (Diagnostic Processing)

This ensemble diagnostic system employs 7 specialized components for comprehensive language analysis:

#### Component 1: Speech Recognition
- **Model**: `gigant/whisper-medium-romanian` (pre-trained)
- **Hosting**: Groq API (free tier)
- **Function**: Converts Romanian audio to text transcripts
- **Activation**: Speech path only
- **Performance**: 10-15% WER, 0.5-1.0 second response time

#### Component 2: Pronunciation Analysis
- **Model**: `gigant/romanian-wav2vec2` (pre-trained Wav2Vec2)
- **Hosting**: RunPod (~$2-3/month)
- **Function**: Phoneme recognition and stress pattern detection
- **Activation**: Speech path only
- **Performance**: 75-85% phoneme accuracy, 80-85% stress detection accuracy

#### Component 3: Grammar Correction
- **Model**: Fine-tuned `google/mt5-small`
- **Status**: ✅ COMPLETE (BLEU 68.92)
- **Hosting**: RunPod (~$3-5/month)
- **Function**: Grammatical error detection and correction
- **Activation**: Both speech and text paths
- **Performance**: BLEU 68.92, ~85-90% accuracy on common errors

#### Component 4: SPAM-A (Semantic Similarity Engine) - MVP ✅
- **Model**: `dumitrescustefan/bert-base-romanian-cased-v1` (base model, no fine-tuning)
- **Hosting**: HuggingFace Inference API (free tier)
- **Function**: Semantic similarity scoring via sentence embeddings
- **Activation**: Both speech and text paths
- **Performance**: 80-85% accuracy, 0.2-0.4 second response time
- **Example**: User says "Locuința este plăcută" when expected "Casa este frumoasă" → similarity_score = 0.85 (high match despite different words)

#### Component 5: SPAM-B (Relevance Scorer) - Post-MVP 🟡
- **Model**: `readerbench/ro-text-summarization` (pre-trained, no fine-tuning)
- **Hosting**: HuggingFace Inference API (free tier)
- **Function**: Determines if user's response is on-topic relative to content
- **Activation**: Both speech and text paths (when enabled)
- **Performance**: 85-90% accuracy, 0.3-0.5 second response time
- **Example**: Content about "Romanian cuisine" but user says "Îmi place fotbalul" → relevance_score = 0.15 (off-topic)
- **When to Add**: Post-MVP when users frequently go off-topic in Chaos Window

#### Component 6: SPAM-C (Dialectal/Pragmatic Analyzer) - Post-MVP 🟡
- **Model**: Fine-tuned Romanian BERT on dialectal datasets
- **Base Model**: `dumitrescustefan/bert-base-romanian-cased-v1`
- **Training Datasets**: `fmi-unibuc/RoAcReL` (1.9K rows), `codrut2/RoDia` (dialect corpus)
- **Hosting**: RunPod (~$2-3/month)
- **Function**: Analyzes regional variation and pragmatic appropriateness (formality)
- **Activation**: Both speech and text paths (when enabled)
- **Performance**: 80-85% dialectal detection, 75-80% pragmatic accuracy, 0.4-0.6 second response time
- **Example 1**: User says "mămăligă" (Moldovan variant) → detected_region = "Moldova", valid = true
- **Example 2**: User says "Bună, cum merge?" in formal business context → formality_mismatch = true, severity = "medium"
- **When to Add**: Post-MVP when user base expands to multiple regions or formality errors are common
- **Training Time**: 4-6 days (dataset prep + fine-tuning)

#### Component 7: SPAM-D (Intonation-Meaning Mapper) - MVP ✅
- **Model**: Rule-based lookup table (50-100 stress-based minimal pairs)
- **Hosting**: In-app logic (no external API)
- **Function**: Detects stress pattern changes that alter word meaning
- **Activation**: Speech path only
- **Performance**: <10ms response time, >90% accuracy on known pairs
- **Example**: "TOR-tu-ri" (cakes) vs "tor-TU-ri" (tortures)
- **Build Time**: 1-2 days (linguistic research + implementation)

#### Component 8: Router - MVP ✅
- **Type**: Conditional logic system
- **Function**: Detects input type (speech/text) and routes to appropriate processing path
- **Performance**: <1ms routing decision, no additional latency

#### Component 9: Feedback Aggregator - MVP ✅
- **Type**: Integration logic system
- **Function**: Combines outputs from active components into unified grading report
- **Performance**: Handles conditional fields (pronunciation/intonation null for text input, SPAM-B/C null when not enabled)

**Processing Flow:**
1. Router detects input type and selects processing path
2. Speech path: Speech Recognition → parallel processing (Grammar + Pronunciation) → SPAM-A Semantic → SPAM-D Intonation
3. Text path: Parallel processing (Grammar + SPAM-A Semantic only)
4. Feedback Aggregator combines all active component outputs
5. System generates scoring metrics based on input type:
   - **Speech Input**: Grammar Score + Pronunciation Score + Semantic Score + Intonation Warnings
   - **Text Input**: Grammar Score + Semantic Score (pronunciation/intonation = null)

### 3. Feedback Aggregation & Pattern Analysis

**Feedback Aggregator (Component 7)**: The aggregator is now a formal component that combines individual scores from active diagnostic components into a unified grading report. It handles conditional fields based on input type:

**For Speech Input:**
```javascript
{
  "input_type": "speech",
  "grammar": { "score": 0.85, "errors": [...], "corrected_text": "..." },
  "pronunciation": { "phoneme_score": 0.78, "stress_accuracy": 0.82, ... },
  "semantic": { "similarity_score": 0.90, "interpretation": "high_match" },
  "intonation": { "warnings": [...], "has_meaning_shifts": true },
  "overall_score": 0.85
}
```

**For Text Input:**
```javascript
{
  "input_type": "text",
  "grammar": { "score": 0.85, "errors": [...], "corrected_text": "..." },
  "pronunciation": null,
  "semantic": { "similarity_score": 0.90, "interpretation": "high_match" },
  "intonation": null,
  "overall_score": 0.87
}
```

The overall score uses different weighting based on input type:
- **Speech**: Grammar (40%) + Pronunciation (30%) + Semantic (30%)
- **Text**: Grammar (60%) + Semantic (40%)

**Error Garden**: An analysis and pattern clustering system that:
- Processes unified grading reports from both input paths
- Tracks errors separately by input type (grammar_errors_from_speech vs grammar_errors_from_text)
- Identifies interlanguage patterns across modalities
- Clusters common error types
- Updates the User Profile Database with input-type-specific patterns
- Provides curated chaos insights to the knowledge base

### 4. Adaptive Tutoring System (Structured Application)

This system represents the "Structured Application" component, providing organized pedagogical responses based on diagnostic findings.

**Core Components:**
- **Adaptation Engine**: Rules-based logic system that processes user weaknesses and error clusters
- **Knowledge Base**: Contains Second Language Acquisition (SLA) frameworks and CEFR (Common European Framework of Reference for Languages) standards
- **Conversational Core**: DeepSeek-R1 reasoning engine for generating contextual responses

**Adaptation Process:**
1. User profile data feeds into the Adaptation Engine
2. Knowledge Base provides pedagogical scaffolding
3. Adaptation Engine generates dynamic prompts for the reasoning core
4. DeepSeek-R1 produces "Productive Confusion Responses" designed to challenge and engage learners
5. System delivers personalized tutoring output

### 5. Feedback Loops & System Integration

**Primary Feedback Loop:**
- Tutoring output drives user engagement
- User engagement generates new input data
- Creates continuous improvement cycle

**Secondary Knowledge Enhancement Loop:**
- Error Garden insights update the Knowledge Base
- Ensures system evolves with discovered learning patterns
- Maintains currency of pedagogical approaches

## Key System Characteristics

### Hybrid Ensemble Architecture Design
- **7-Component Ensemble**: 5 ML models + 1 rule-based system + 1 router for comprehensive analysis
- **Dual-Path Processing**: Intelligent routing optimizes resource usage based on input type
- **Conditional Component Activation**: Speech path activates 5 components, text path activates 2 components
- **Analysis Element**: Parallel diagnostic processing creates comprehensive, multi-dimensional error analysis
- **Instruction Element**: Rules-based tutoring system provides organized, pedagogically sound instruction

### Adaptive Learning Mechanisms
- **Dynamic Profiling**: User profiles continuously updated with new performance data and input-type-specific tracking
- **Pattern Recognition**: System identifies and clusters common interlanguage patterns across both input modalities
- **Personalized Responses**: Tutoring adapts to individual learner needs and weaknesses
- **Modality-Aware Analysis**: Separate tracking for speech vs text errors enables targeted feedback

### Multi-Model Integration & Cost Optimization
- **Pre-Trained Models**: 4 of 5 ML models use pre-trained weights (only grammar required fine-tuning)
- **Specialized AI Models**: Each language component uses optimized models:
  - Speech: gigant/whisper-medium-romanian (Groq)
  - Pronunciation: gigant/romanian-wav2vec2 (RunPod)
  - Grammar: Fine-tuned mt5-small (RunPod)
  - Semantic: dumitrescustefan/bert-base-romanian-cased-v1 (HF Inference)
- **Rule-Based Efficiency**: SPAM-D uses in-app lookup table for zero-cost intonation analysis
- **Central Reasoning**: DeepSeek-R1 provides unified conversational intelligence
- **Knowledge Synthesis**: Multiple data streams combine for comprehensive assessment
- **Monthly Hosting Costs**: $10-18/month (down from $20-35 in previous architecture)
- **Per-Request Costs**: $0.001-0.005 depending on input type

## Pedagogical Framework

The system integrates established language learning theories:
- **Second Language Acquisition (SLA) Principles**: Evidence-based language teaching methodologies
- **CEFR Standards**: European language proficiency framework for structured progression
- **Productive Confusion**: Intentional challenge design to promote deeper learning
- **Interlanguage Analysis**: Focus on systematic learner error patterns

## System Benefits

1. **Comprehensive Assessment**: Multi-modal evaluation across pronunciation, grammar, and semantics
2. **Personalized Learning**: Adaptive instruction based on individual error patterns
3. **Continuous Improvement**: System learns from user interactions to enhance tutoring quality
4. **Cultural Context**: Semantic analysis ensures appropriate cultural and pragmatic understanding
5. **Scalable Architecture**: Parallel processing enables efficient handling of multiple users

## Technical Implementation Notes

The architecture demonstrates sophisticated AI integration with:
- **Ensemble Design**: 7-component architecture with conditional activation
- **Dual-Path Routing**: Intelligent input type detection and component selection
- **Pre-Trained Models**: Minimal fine-tuning requirements (only 1 of 5 ML models)
- **Parallel Processing**: Concurrent execution for efficient multi-dimensional analysis
- **Rule-Based Systems**: In-app logic for pedagogical consistency and zero-cost operations
- **Machine Learning**: Pattern recognition and adaptation across input modalities
- **Real-Time Feedback Loops**: Continuous system improvement with input-type tracking

## Complete Component Summary Table

### MVP Components (Phase 1: Days 1-13)

| # | Component Name | Model/Technology | Training Status | Hosting | Monthly Cost | Active For |
|---|----------------|------------------|-----------------|---------|--------------|------------|
| 1 | **Speech Recognition** | gigant/whisper-medium-romanian | ✅ Pre-trained | Groq | $0 (free tier) | Speech only |
| 2 | **Pronunciation Analysis** | gigant/romanian-wav2vec2 | ✅ Pre-trained | RunPod | $2-3 | Speech only |
| 3 | **Grammar Correction** | Fine-tuned mt5-small | ✅ DONE (BLEU 68.92) | RunPod | $3-5 | Both |
| 4 | **SPAM-A: Semantic Similarity** | bert-base-romanian-cased-v1 | ✅ Pre-trained (base) | HF Inference | $0 (free tier) | Both |
| 7 | **SPAM-D: Intonation Mapper** | Rule-based lookup (50-100 pairs) | 🔧 Build (1-2 days) | In-app logic | $0 | Speech only |
| 8 | **Router** | Conditional logic | 🔧 Build (1 day) | In-app logic | $0 | Both |
| 9 | **Feedback Aggregator** | Integration logic | 🔧 Build (2-3 days) | In-app logic | $0 | Both |

**MVP Subtotal:** $5-8/month (models) + $5-10 (DeepSeek-R1) = **$10-18/month**

### Post-MVP Enhancement Components

| # | Component Name | Model/Technology | Training Status | Hosting | Monthly Cost | Active For | When to Add |
|---|----------------|------------------|-----------------|---------|--------------|------------|-------------|
| 5 | **SPAM-B: Relevance Scorer** | readerbench/ro-text-summarization | ✅ Pre-trained | HF Inference | $0 (free tier) | Both | Phase 2 (Days 14-16) |
| 6 | **SPAM-C: Dialectal/Pragmatic** | Fine-tuned Romanian BERT | 🔧 Train (4-6 days) | RunPod | $2-3 | Both | Phase 3 (Days 17-23) |

**Post-MVP Addition:** +$2-3/month

### Full System Totals

**Development Time:**
- MVP (Phase 1): 13 days
- SPAM-B Addition (Phase 2): +3 days
- SPAM-C Addition (Phase 3): +7 days
- **Total**: 23 days for complete ensemble

**Monthly Cost:**
- MVP: $10-18/month
- Full Ensemble: $12-21/month
- **Cost Increase for Full SPAM**: +$2-3/month

## Performance Metrics

### Response Time Targets

| Input Type | Active Components | Target Time | Expected Actual |
|------------|-------------------|-------------|-----------------|
| Text | 2 (Grammar + SPAM-A) | <1 second | 0.5-0.8 seconds |
| Speech | 5 (All components) | <2 seconds | 1.0-1.5 seconds |

### Model Performance Benchmarks

| Component | Metric | Target | Status |
|-----------|--------|--------|--------|
| Speech Recognition | WER | <15% | ✅ 10-15% expected |
| Pronunciation | Phoneme Accuracy | >75% | ✅ 75-85% expected |
| Grammar | BLEU Score | >65 | ✅ 68.92 achieved |
| Semantic (SPAM-A) | Similarity Accuracy | >80% | ✅ 80-85% expected |
| Intonation (SPAM-D) | Minimal Pair Detection | >90% | ✅ >90% on known pairs |

## Database Schema Updates

### User Profile Database (Updated for v2.0)

```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Existing fields
  weaknesses JSONB,
  learning_patterns JSONB,

  -- NEW: Input type tracking
  total_speech_inputs INTEGER DEFAULT 0,
  total_text_inputs INTEGER DEFAULT 0,

  -- NEW: Separate error tracking by input type
  grammar_errors_from_speech JSONB,  -- { "genitive_case": 8, ... }
  grammar_errors_from_text JSONB,     -- { "genitive_case": 15, ... }
  pronunciation_errors JSONB,         -- { "vowel_a": 23, ... } (speech only)

  -- Composite scores by input type
  avg_score_speech DECIMAL(3,2),
  avg_score_text DECIMAL(3,2)
);
```

### Grading Reports Table (New for v2.0)

```sql
CREATE TABLE grading_reports (
  report_id UUID PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(user_id),
  created_at TIMESTAMP DEFAULT NOW(),

  -- Input metadata
  input_type VARCHAR(10) CHECK (input_type IN ('speech', 'text')),
  content_id UUID,  -- Reference to content being practiced

  -- Scores (always present)
  grammar_score DECIMAL(3,2),
  semantic_score DECIMAL(3,2),

  -- Scores (only for speech)
  pronunciation_score DECIMAL(3,2) NULL,
  intonation_warnings INTEGER NULL,

  -- Full report data
  report_data JSONB,

  -- Indexes
  INDEX idx_user_input_type (user_id, input_type),
  INDEX idx_created_at (created_at)
);
```

## Phased Development Timeline

### Phase 1: MVP Launch (Days 1-13) - Core SPAM (A + D)

**Goal:** Text + Speech paths with 50% SPAM coverage

**Text Path (Days 1-4)**
- Day 1: Build router (text branch only)
- Day 2: Deploy SPAM-A (HF Inference setup)
- Day 3: Build feedback aggregator (text-only version)
- Day 4: Integration testing, bug fixes

**Speech Path (Days 5-10)**
- Day 5: Deploy Whisper on Groq, test transcription
- Day 6: Deploy Wav2Vec2 on RunPod, test pronunciation
- Day 7-8: Build SPAM-D intonation mapper (research + implement 50-100 minimal pairs)
- Day 9: Extend router to handle speech branch
- Day 10: Extend aggregator to handle speech data

**Integration (Days 11-13)**
- Day 11: Error Garden updates (input_type tracking)
- Day 12: End-to-end testing (speech + text paths)
- Day 13: Bug fixes, polish, documentation updates

**Deliverable:** Working MVP with grammar + pronunciation + semantic similarity + intonation warnings
**SPAM Coverage:** 50% (2 of 4 components: A + D)
**Monthly Cost:** $10-18

---

### Phase 2: Relevance Addition (Days 14-16) - Add SPAM-B

**Goal:** Add on-topic detection (75% SPAM coverage)

**Tasks:**
- Day 14: Deploy SPAM-B (readerbench/ro-text-summarization to HF Inference)
- Day 15: Update Aggregator to handle relevance scores, add SPAM router logic
- Day 16: Update Error Garden to track off-topic patterns, integration testing

**Deliverable:** System can detect when users go off-topic
**SPAM Coverage:** 75% (3 of 4 components: A + B + D)
**Monthly Cost:** Still $10-18 (SPAM-B is free tier)

**When to Add:**
- Beta testing shows users frequently drift off-topic
- Chaos Window needs better conversation control
- User feedback requests "stay on track" features

---

### Phase 3: Dialectal/Pragmatic Addition (Days 17-23) - Add SPAM-C

**Goal:** Add regional variation + formality analysis (100% SPAM coverage)

**Tasks:**
- Day 17-18: Dataset preparation (clean RoAcReL + RoDia, create formality annotations)
- Day 19-21: Fine-tune Romanian BERT on dialectal datasets (3 days GPU training)
- Day 22: Deploy SPAM-C to RunPod, update Aggregator
- Day 23: Update Error Garden to differentiate dialectal variation from errors, integration testing

**Deliverable:** Full SPAM ensemble with regional variation support
**SPAM Coverage:** 100% (All 4 components: A + B + C + D)
**Monthly Cost:** $12-21 (adds $2-3 for SPAM-C hosting)

**When to Add:**
- User base expands to multiple Romanian regions (Moldova, Transylvania, diaspora)
- Formality errors are common in Error Garden
- Advanced learners request dialectal knowledge

---

### Complete Timeline Summary

**MVP (Phase 1):** 13 days → 50% SPAM, $10-18/month
**+ SPAM-B (Phase 2):** +3 days → 75% SPAM, $10-18/month
**+ SPAM-C (Phase 3):** +7 days → 100% SPAM, $12-21/month

**Total Development Time:** 23 days for full ensemble
**Modular Benefit:** Can launch MVP and add components as user needs dictate

## Model URLs & Resources

- **gigant/whisper-medium-romanian**: https://huggingface.co/gigant/whisper-medium-romanian
- **gigant/romanian-wav2vec2**: https://huggingface.co/gigant/romanian-wav2vec2
- **dumitrescustefan/bert-base-romanian-cased-v1**: https://huggingface.co/dumitrescustefan/bert-base-romanian-cased-v1
- **google/mt5-small**: https://huggingface.co/google/mt5-small

This system represents a cutting-edge approach to adaptive language learning, combining the power of an ensemble architecture with dual-path routing optimization, sound pedagogical principles, and cost-effective pre-trained models to create an effective, personalized learning experience for Romanian language students.
