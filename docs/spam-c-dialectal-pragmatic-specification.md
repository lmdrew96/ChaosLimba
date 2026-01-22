# SPAM-C: Dialectal/Pragmatic Analyzer Specification

**Component:** #6 - SPAM-C (Semantic/Pragmatic Analysis Module - Dialectal/Pragmatic)
**Type:** Fine-tuned ML model (requires training)
**Purpose:** Analyze regional Romanian variations and pragmatic appropriateness (formality)
**Status:** 🟡 Post-MVP Enhancement (Phase 3: Days 17-23)

---

## Overview

SPAM-C is a dual-function component that:

1. **Dialectal Analysis**: Recognizes regional Romanian variations (Moldova, Transylvania, Wallachia) and distinguishes them from errors
2. **Pragmatic Analysis**: Detects formality mismatches (informal language in formal contexts and vice versa)

### Why SPAM-C Matters

Romanian has significant regional variation, and learners need to know:
- When they're using a valid regional variant (not an error!)
- When their formality level doesn't match the context
- How to adapt language for different social situations

**Example Problem Without SPAM-C:**
- User (from Moldova) says "mămăligă" → System flags as error
- User says "Bună, ce faci?" in business email → System doesn't catch formality mismatch

**With SPAM-C:**
- "mămăligă" → Recognized as valid Moldovan variant
- "Bună, ce faci?" in formal context → Flagged as formality mismatch with severity rating

---

## Model Specification

### Base Model
- **Model**: `dumitrescustefan/bert-base-romanian-cased-v1`
- **HuggingFace**: https://huggingface.co/dumitrescustefan/bert-base-romanian-cased-v1
- **Type**: Romanian BERT (requires fine-tuning for dialectal + pragmatic tasks)
- **Hosting**: RunPod (~$2-3/month)
- **Monthly Cost**: $2-3

### Training Datasets

**For Dialectal Detection:**
- **`fmi-unibuc/RoAcReL`** (1.9K rows) - Romanian Archaisms Regionalisms Lexicon
- **`codrut2/RoDia`** - Romanian dialect corpus

**For Pragmatic/Formality:**
- Manual annotation of formality levels (formal/neutral/informal)
- Romanian conversation datasets with social context
- Business communication examples vs. casual conversation

### Training Strategy

**Two-Stage Fine-Tuning:**

1. **Stage 1: Dialectal Classification** (2-3 days)
   - Task: Multi-class classification (Standard, Moldova, Transylvania, Wallachia, Archaic)
   - Dataset: RoAcReL + RoDia
   - Output: Regional variant labels

2. **Stage 2: Pragmatic Formality** (2-3 days)
   - Task: Multi-class classification (Formal, Neutral, Informal)
   - Dataset: Manually annotated Romanian conversations
   - Output: Formality level + appropriateness score

---

## Component Architecture

### Input Schema

```typescript
interface SpamCInput {
  user_text: string;           // What the user said/wrote
  context: {
    formality_level?: 'formal' | 'neutral' | 'informal';  // Expected formality
    region?: 'standard' | 'Moldova' | 'Transylvania' | 'Wallachia';  // Expected dialect
    communication_type?: string;  // e.g., "business_email", "casual_chat", "academic_paper"
    social_relationship?: string; // e.g., "stranger", "colleague", "friend", "family"
  };
}
```

### Output Schema

```typescript
interface SpamCOutput {
  dialectal_analysis: {
    detected_region: string;     // Which dialect detected
    confidence: number;          // 0-1
    regional_variants: Array<{
      form: string;              // The dialectal word/phrase
      region: string;            // Where it's from
      standard_equivalent?: string;  // Standard Romanian version
      valid: boolean;            // Is this a recognized variant?
    }>;
    non_standard_forms: Array<{
      form: string;
      issue: string;             // What's wrong
    }>;
  };
  pragmatic_analysis: {
    formality_detected: 'formal' | 'neutral' | 'informal';
    formality_expected: 'formal' | 'neutral' | 'informal';
    formality_mismatch: boolean;
    severity: 'low' | 'medium' | 'high';  // How bad is the mismatch?
    issues: Array<{
      type: string;              // e.g., "greeting_formality", "verb_formality"
      detected: string;          // What they said
      expected: string;          // What they should say
      explanation: string;       // User-friendly explanation
    }>;
  };
  overall_appropriateness: number;  // 0-1, composite score
}
```

---

## Implementation

### Training Pipeline

```python
from transformers import (
    BertForSequenceClassification,
    BertTokenizer,
    Trainer,
    TrainingArguments
)
from datasets import load_dataset
import torch

class SpamCTrainer:
    def __init__(self):
        self.tokenizer = BertTokenizer.from_pretrained(
            'dumitrescustefan/bert-base-romanian-cased-v1'
        )

    def prepare_dialectal_dataset(self):
        """Prepare RoAcReL + RoDia for dialectal classification."""

        # Load datasets
        roacrel = load_dataset('fmi-unibuc/RoAcReL')
        rodia = load_dataset('codrut2/RoDia')  # May need manual processing

        # Label mapping
        # 0: Standard, 1: Moldova, 2: Transylvania, 3: Wallachia, 4: Archaic
        label_map = {
            'standard': 0,
            'moldova': 1,
            'transylvania': 2,
            'wallachia': 3,
            'archaic': 4
        }

        # Process and tokenize
        # ... dataset processing logic
        return train_dataset, eval_dataset

    def train_dialectal_model(self):
        """Fine-tune BERT for dialectal classification."""

        train_dataset, eval_dataset = self.prepare_dialectal_dataset()

        model = BertForSequenceClassification.from_pretrained(
            'dumitrescustefan/bert-base-romanian-cased-v1',
            num_labels=5  # 5 regional categories
        )

        training_args = TrainingArguments(
            output_dir='./spam-c-dialectal',
            num_train_epochs=3,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=16,
            learning_rate=2e-5,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="accuracy"
        )

        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            compute_metrics=self.compute_accuracy
        )

        trainer.train()
        trainer.save_model('./spam-c-dialectal-final')

        return model

    def prepare_formality_dataset(self):
        """Prepare formality dataset (may require manual annotation)."""

        # Create formality dataset
        # Labels: 0: Formal, 1: Neutral, 2: Informal

        # Sources:
        # - Business emails (formal)
        # - News articles (neutral-formal)
        # - Social media posts (informal)
        # - Academic papers (formal)
        # - Casual conversations (informal)

        # ... dataset creation logic
        return train_dataset, eval_dataset

    def train_formality_model(self, dialectal_model_path='./spam-c-dialectal-final'):
        """Fine-tune dialectal model for formality classification."""

        train_dataset, eval_dataset = self.prepare_formality_dataset()

        # Start from dialectal model (transfer learning)
        model = BertForSequenceClassification.from_pretrained(
            dialectal_model_path,
            num_labels=3,  # 3 formality levels
            ignore_mismatched_sizes=True  # Reinitialize classification head
        )

        training_args = TrainingArguments(
            output_dir='./spam-c-formality',
            num_train_epochs=3,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=16,
            learning_rate=2e-5,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True
        )

        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            compute_metrics=self.compute_accuracy
        )

        trainer.train()
        trainer.save_model('./spam-c-formality-final')

        return model

    def compute_accuracy(self, eval_pred):
        predictions, labels = eval_pred
        predictions = predictions.argmax(-1)
        accuracy = (predictions == labels).mean()
        return {"accuracy": accuracy}
```

### Inference API

```python
from transformers import pipeline
from typing import Dict, List

class SpamCAnalyzer:
    def __init__(
        self,
        dialectal_model_path='./spam-c-dialectal-final',
        formality_model_path='./spam-c-formality-final'
    ):
        self.dialectal_classifier = pipeline(
            "text-classification",
            model=dialectal_model_path
        )
        self.formality_classifier = pipeline(
            "text-classification",
            model=formality_model_path
        )

        # Regional variant lexicon (from RoAcReL)
        self.regional_lexicon = self.load_regional_lexicon()

    def load_regional_lexicon(self) -> Dict:
        """Load known regional variants from RoAcReL."""
        # ... load lexicon
        return {
            'mămăligă': {
                'region': 'Moldova',
                'standard': 'mămăligă',  # Actually is standard too
                'valid': True
            },
            # ... more variants
        }

    def analyze_dialectal(self, text: str) -> Dict:
        """Analyze dialectal features."""

        # Classify region
        prediction = self.dialectal_classifier(text)[0]
        region_labels = ['standard', 'Moldova', 'Transylvania', 'Wallachia', 'archaic']
        detected_region = region_labels[int(prediction['label'].split('_')[1])]
        confidence = prediction['score']

        # Find regional variants in text
        words = text.lower().split()
        regional_variants = []
        for word in words:
            if word in self.regional_lexicon:
                variant_info = self.regional_lexicon[word]
                regional_variants.append({
                    'form': word,
                    'region': variant_info['region'],
                    'standard_equivalent': variant_info.get('standard'),
                    'valid': variant_info['valid']
                })

        return {
            'detected_region': detected_region,
            'confidence': confidence,
            'regional_variants': regional_variants,
            'non_standard_forms': []  # Would need NER/POS analysis
        }

    def analyze_pragmatic(
        self,
        text: str,
        expected_formality: str
    ) -> Dict:
        """Analyze pragmatic formality."""

        # Classify formality
        prediction = self.formality_classifier(text)[0]
        formality_labels = ['formal', 'neutral', 'informal']
        detected_formality = formality_labels[int(prediction['label'].split('_')[1])]

        # Check for mismatch
        formality_mismatch = (detected_formality != expected_formality)

        # Analyze specific issues
        issues = []
        if formality_mismatch:
            issues = self.find_formality_issues(text, detected_formality, expected_formality)

        # Severity
        if not formality_mismatch:
            severity = 'low'
        elif (expected_formality == 'formal' and detected_formality == 'informal'):
            severity = 'high'  # Very inappropriate
        else:
            severity = 'medium'

        return {
            'formality_detected': detected_formality,
            'formality_expected': expected_formality,
            'formality_mismatch': formality_mismatch,
            'severity': severity,
            'issues': issues
        }

    def find_formality_issues(
        self,
        text: str,
        detected: str,
        expected: str
    ) -> List[Dict]:
        """Find specific formality issues in text."""

        issues = []

        # Check greeting
        if text.lower().startswith('bună'):
            if expected == 'formal':
                issues.append({
                    'type': 'greeting_formality',
                    'detected': 'Bună',
                    'expected': 'Bună ziua' if 'ziua' not in text.lower() else 'Bună',
                    'explanation': 'Use "Bună ziua" for formal greetings'
                })

        # Check pronouns (tu vs. dumneavoastră)
        if ' tu ' in text.lower() or text.lower().startswith('tu '):
            if expected == 'formal':
                issues.append({
                    'type': 'pronoun_formality',
                    'detected': 'tu',
                    'expected': 'dumneavoastră',
                    'explanation': 'Use "dumneavoastră" for formal second-person'
                })

        # More rules...

        return issues

    def analyze(
        self,
        user_text: str,
        context: Dict
    ) -> Dict:
        """Complete SPAM-C analysis."""

        dialectal = self.analyze_dialectal(user_text)

        pragmatic = None
        if 'formality_level' in context:
            pragmatic = self.analyze_pragmatic(
                user_text,
                context['formality_level']
            )

        # Calculate overall appropriateness
        appropriateness = 1.0
        if pragmatic and pragmatic['formality_mismatch']:
            if pragmatic['severity'] == 'high':
                appropriateness -= 0.5
            elif pragmatic['severity'] == 'medium':
                appropriateness -= 0.3
            else:
                appropriateness -= 0.1

        return {
            'dialectal_analysis': dialectal,
            'pragmatic_analysis': pragmatic or {},
            'overall_appropriateness': max(0.0, appropriateness)
        }
```

---

## Integration with ChaosLimbă System

### API Endpoint

```typescript
// File: /lib/components/spam-c.ts

export async function spamCDialectalPragmatic(
  userText: string,
  context: SpamCContext
): Promise<SpamCOutput> {
  const response = await fetch(process.env.SPAM_C_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_text: userText,
      context: context
    })
  });

  return await response.json();
}
```

### Aggregator Updates

```typescript
// File: /lib/feedback-aggregator.ts

export async function aggregateFeedback(
  inputType: 'speech' | 'text',
  analyses: ComponentAnalyses,
  config: AggregatorConfig
): Promise<UnifiedGradingReport> {

  // ... existing SPAM-A and SPAM-B logic

  // NEW: Add SPAM-C dialectal/pragmatic if enabled
  let dialectalPragmatic = null;
  if (config.enableSpamC && analyses.context) {
    dialectalPragmatic = await spamCDialectalPragmatic(
      analyses.userText,
      analyses.context
    );
  }

  return {
    input_type: inputType,
    grammar: analyses.grammar,
    pronunciation: analyses.pronunciation,
    semantic_pragmatic: {
      similarity: analyses.spamA,           // SPAM-A
      relevance: analyses.spamB,            // SPAM-B
      dialectal_pragmatic: dialectalPragmatic,  // SPAM-C (NEW)
      intonation: analyses.spamD            // SPAM-D
    },
    overall_score: calculateOverallScore(...)
  };
}
```

---

## Performance Metrics

### Expected Performance
- **Dialectal Detection Accuracy**: 80-85%
- **Formality Classification Accuracy**: 75-80%
- **Response Time**: 0.4-0.6 seconds
- **False Positive Rate** (flagging valid regional variants as errors): <5%

### Training Metrics
- **Dialectal Model**: Expected 80%+ accuracy after 3 epochs
- **Formality Model**: Expected 75%+ accuracy after 3 epochs
- **Training Time**: 2-3 days GPU time (total for both models)

---

## Testing Strategy

### Unit Tests

```typescript
describe('SPAM-C: Dialectal Analyzer', () => {
  test('recognizes Moldovan variant mămăligă', async () => {
    const result = await spamCDialectalPragmatic(
      'Vreau mâncare de mămăligă',
      { region: 'standard' }
    );
    expect(result.dialectal_analysis.regional_variants).toContainEqual(
      expect.objectContaining({
        form: 'mămăligă',
        region: 'Moldova',
        valid: true
      })
    );
  });

  test('flags informal greeting in formal context', async () => {
    const result = await spamCDialectalPragmatic(
      'Bună, cum merge?',
      { formality_level: 'formal' }
    );
    expect(result.pragmatic_analysis.formality_mismatch).toBe(true);
    expect(result.pragmatic_analysis.severity).toBe('high');
    expect(result.pragmatic_analysis.issues.length).toBeGreaterThan(0);
  });

  test('accepts appropriate formality', async () => {
    const result = await spamCDialectalPragmatic(
      'Bună ziua, cum vă pot ajuta?',
      { formality_level: 'formal' }
    );
    expect(result.pragmatic_analysis.formality_mismatch).toBe(false);
    expect(result.overall_appropriateness).toBeGreaterThan(0.8);
  });
});
```

---

## When to Add SPAM-C (Decision Criteria)

### Add SPAM-C When:

1. **Multi-Regional User Base**
   - Users from Moldova, Transylvania, and Romania proper
   - Diaspora learners with exposure to different dialects
   - Need to distinguish regional variation from errors

2. **Formality Errors Are Common**
   - Error Garden shows frequent tu/dumneavoastră confusion
   - Business Romanian learners need formality guidance
   - Advanced learners preparing for professional contexts

3. **Resource Availability**
   - Have budget for +$2-3/month hosting
   - Have 4-6 days for dataset preparation and training
   - Have GPU access for training

### Don't Add SPAM-C If:

1. **User Base Is Homogeneous**
   - All users learning standard Romanian
   - No regional variation needs

2. **Formality Not a Priority**
   - Beginners (A1-A2) not yet ready for formality distinctions
   - Casual/conversational focus only

3. **Resource Constraints**
   - Limited development time
   - Cannot afford additional hosting costs

---

## Build Checklist (Phase 3: Days 17-23)

### Days 17-18: Dataset Preparation
- [ ] Download and clean RoAcReL dataset
- [ ] Download and process RoDia corpus
- [ ] Create regional variant lexicon
- [ ] Manually annotate formality examples (aim for 1000+ examples)
- [ ] Split datasets into train/validation/test sets

### Days 19-21: Model Training
- [ ] Train dialectal classification model (Stage 1)
- [ ] Evaluate dialectal model accuracy
- [ ] Train formality classification model (Stage 2)
- [ ] Evaluate formality model accuracy
- [ ] Optimize hyperparameters if needed

### Day 22: Deployment
- [ ] Deploy SPAM-C models to RunPod
- [ ] Create API endpoint wrapper
- [ ] Test inference speed and accuracy
- [ ] Add `enableSpamC` feature flag to Aggregator

### Day 23: Integration & Testing
- [ ] Integration testing with full system
- [ ] Update Error Garden to differentiate dialectal variants from errors
- [ ] Add UI components for dialectal/pragmatic feedback
- [ ] End-to-end testing
- [ ] Documentation updates

---

## Error Garden Integration

### Differentiate Dialectal Variants from Errors

```typescript
function classifyLanguageIssue(
  grammarError: GrammarError,
  spamCResult: SpamCOutput
): 'error' | 'dialectal_variant' | 'formality_issue' {

  // Check if this is a recognized regional variant
  const isRegionalVariant = spamCResult.dialectal_analysis.regional_variants.some(
    v => v.form === grammarError.word && v.valid
  );

  if (isRegionalVariant) {
    return 'dialectal_variant';  // Not an error!
  }

  // Check if this is a formality issue
  const isFormalityIssue = spamCResult.pragmatic_analysis.issues?.some(
    i => i.detected === grammarError.word
  );

  if (isFormalityIssue) {
    return 'formality_issue';
  }

  return 'error';  // Actual grammar error
}
```

---

## UI Integration

### Dialectal Feedback Display

```tsx
{dialectalPragmatic?.dialectal_analysis.regional_variants.length > 0 && (
  <Alert variant="info">
    <AlertTitle>Regional Variant Detected</AlertTitle>
    <AlertDescription>
      You used <strong>{dialectalPragmatic.dialectal_analysis.regional_variants[0].form}</strong>,
      which is a valid {dialectalPragmatic.dialectal_analysis.regional_variants[0].region} variant.
      {dialectalPragmatic.dialectal_analysis.regional_variants[0].standard_equivalent && (
        <p>In standard Romanian: <strong>
          {dialectalPragmatic.dialectal_analysis.regional_variants[0].standard_equivalent}
        </strong></p>
      )}
    </AlertDescription>
  </Alert>
)}
```

### Formality Feedback Display

```tsx
{dialectalPragmatic?.pragmatic_analysis.formality_mismatch && (
  <Alert variant={dialectalPragmatic.pragmatic_analysis.severity === 'high' ? 'destructive' : 'warning'}>
    <AlertTitle>Formality Mismatch</AlertTitle>
    <AlertDescription>
      Your response is <strong>{dialectalPragmatic.pragmatic_analysis.formality_detected}</strong>,
      but this context requires <strong>{dialectalPragmatic.pragmatic_analysis.formality_expected}</strong> language.
      <ul className="mt-2 list-disc pl-5">
        {dialectalPragmatic.pragmatic_analysis.issues.map((issue, i) => (
          <li key={i}>
            {issue.explanation}: Use "<strong>{issue.expected}</strong>" instead of "{issue.detected}"
          </li>
        ))}
      </ul>
    </AlertDescription>
  </Alert>
)}
```

---

## Success Criteria

- [ ] Dialectal detection accuracy >80%
- [ ] Formality classification accuracy >75%
- [ ] Regional variants correctly identified as valid (not flagged as errors)
- [ ] Formality mismatches detected with appropriate severity
- [ ] Response time <0.6 seconds
- [ ] Successfully integrated with Aggregator
- [ ] Error Garden differentiates dialectal variants from errors
- [ ] UI provides clear, helpful feedback

---

**Next Steps**: Begin Phase 3 implementation after MVP + SPAM-B launch and user feedback indicates need for dialectal/pragmatic analysis.
