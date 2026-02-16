> **ARCHIVED** — These recommendations were for the original self-hosted model training approach. The current v4.0 architecture uses Groq (Whisper), HuggingFace Inference (wav2vec2, MiniLM), and Claude Haiku 4.5 instead of fine-tuned models. Kept for reference only.

# Grading Panel Dataset Recommendations

## Overview
Based on the ChaosLingua grading panel architecture and the available Romanian NLP datasets, here are targeted recommendations for training each specialized "panelist" model.

---

## 🎙️ Speech Recognition Model (Panelist 1)
**Function**: Convert speech to text transcript for Romanian language input

### Primary Datasets:
- **[espnet/yodas2](https://huggingface.co/datasets/espnet/yodas2)** - Automatic Speech Recognition dataset
  - *Why*: Direct ASR training data for Romanian speech patterns
- **[qmeeus/vp-er-10l](https://huggingface.co/datasets/qmeeus/vp-er-10l)** - Voice processing dataset  
  - *Why*: Additional audio processing features and voice characteristics

### Secondary Datasets:
- **[phonemetransformers/IPA-CHILDES](https://huggingface.co/datasets/phonemetransformers/IPA-CHILDES)** - Phonological analysis
  - *Why*: Helps with phoneme-level recognition accuracy

### Training Strategy:
1. Fine-tune Whisper base model on yodas2 dataset
2. Use vp-er-10l for audio feature extraction
3. Incorporate IPA-CHILDES for phoneme-level accuracy improvements

---

## 🔊 Pronunciation Model (Panelist 2) 
**Function**: Analyze phonological accuracy and provide pronunciation feedback

### Primary Datasets:
- **[phonemetransformers/IPA-CHILDES](https://huggingface.co/datasets/phonemetransformers/IPA-CHILDES)** - Phonological analysis dataset
  - *Why*: Contains IPA transcriptions and phoneme-level data
- **[espnet/yodas2](https://huggingface.co/datasets/espnet/yodas2)** - ASR dataset with audio features
  - *Why*: Provides audio-phoneme alignment data

### Secondary Datasets:
- **[qmeeus/vp-er-10l](https://huggingface.co/datasets/qmeeus/vp-er-10l)** - Voice processing
  - *Why*: Additional acoustic features for pronunciation analysis

### Training Strategy:
1. Build custom acoustic analyzer using IPA-CHILDES phoneme mappings
2. Train on yodas2 audio-transcript pairs for pronunciation patterns
3. Use vp-er-10l for voice characteristic analysis

---

## ✏️ Grammar Correction Model (Panelist 3)
**Function**: Identify grammatical errors and provide corrected text

### Primary Datasets:
- **[upb-nlp/gec-ro-texts](https://huggingface.co/datasets/upb-nlp/gec-ro-texts)** - Large-scale GEC dataset (2.1M rows)
  - *Why*: Massive grammatical error correction training data
- **[upb-nlp/gec_ro_cna](https://huggingface.co/datasets/upb-nlp/gec_ro_cna)** - CNA text GEC (5K rows)
  - *Why*: Specialized domain error correction
- **[upb-nlp/gec_ro_comments](https://huggingface.co/datasets/upb-nlp/gec_ro_comments)** - Comment-style GEC
  - *Why*: Conversational error patterns

### Secondary Datasets:
- **[universityofbucharest/moroco](https://huggingface.co/datasets/universityofbucharest/moroco)** - Morphologically rich corpus
  - *Why*: Understanding Romanian morphology for better corrections
- **[paul-nechifor/romanian-sentences-with-diacritics](https://huggingface.co/datasets/paul-nechifor/romanian-sentences-with-diacritics)** - Proper diacritics
  - *Why*: Diacritic correction as part of grammar fixing

### Training Strategy:
1. Fine-tune T5/BART on gec-ro-texts for general error correction
2. Specialize with gec_ro_cna and gec_ro_comments for domain-specific patterns
3. Use moroco for morphological understanding and diacritics dataset for orthographic accuracy

---

## 🧠 Semantic Analysis Model (Panelist 4)
**Function**: Analyze meaning, context, and dialectal variations

### Primary Datasets:
- **[dumitrescustefan/RoWordNet](https://github.com/dumitrescustefan/RoWordNet)** - Romanian WordNet
  - *Why*: Semantic relations and word sense disambiguation
- **[UniversalDependencies/UD_Romanian-RRT](https://github.com/UniversalDependencies/UD_Romanian-RRT)** - Dependency treebank
  - *Why*: Syntactic structure for semantic understanding

### Secondary Datasets:
- **[fmi-unibuc/RoAcReL](https://huggingface.co/datasets/fmi-unibuc/RoAcReL)** - Regionalisms and archaisms (1.9K rows)
  - *Why*: Dialectal variation analysis
- **[codrut2/RoDia](https://github.com/codrut2/RoDia/tree/master)** - Romanian dialect corpus
  - *Why*: Regional dialect patterns
- **[readerbench/ro-text-summarization](https://huggingface.co/datasets/readerbench/ro-text-summarization)** - Text summarization (72K rows)
  - *Why*: Semantic understanding and main idea extraction

### Training Strategy:
1. Pre-train Romanian BERT on RoWordNet for semantic relations
2. Fine-tune with UD_Romanian-RRT for syntactic-semantic connections
3. Incorporate dialectal datasets for regional variation understanding
4. Use summarization dataset for semantic coherence analysis

---

## 🔄 Cross-Panelist Integration Datasets

### For Feedback Aggregator Training:
- **[dragosnicolae555/RoITD](https://huggingface.co/datasets/dragosnicolae555/RoITD)** - Instructional text dataset
  - *Why*: Understanding how to provide clear, instructional feedback
- **[BlackKakapo/recipes-ro](https://huggingface.co/datasets/BlackKakapo/recipes-ro)** - Recipe dataset (881 rows)
  - *Why*: Sequential step-by-step explanation patterns

### For User Profile Progress Tracking:
- **[Alegzandra/RED-Romanian-Emotion-Datasets](https://github.com/Alegzandra/RED-Romanian-Emotion-Datasets)** - Emotion detection
  - *Why*: Understanding user frustration/engagement levels
- **[andra-pumnea/hate-speech-ro](https://github.com/andra-pumnea/hate-speech-ro)** - Inappropriate content detection
  - *Why*: Content moderation for user inputs

---

## 📊 Implementation Priority

### Phase 1 (Core Functionality):
1. **Grammar Correction Model** - Most critical for ChaosLingua's error harvesting philosophy
2. **Speech Recognition Model** - Essential for voice input processing
3. **Semantic Analysis Model** - Needed for meaningful feedback

### Phase 2 (Enhanced Features):
4. **Pronunciation Model** - Advanced speaking practice features
5. **Feedback Aggregator** - Unified report generation
6. **User Profile Integration** - Personalized learning tracking

---

## 🎯 Dataset Quality Notes

### High-Quality, Large-Scale:
- `upb-nlp/gec-ro-texts` (2.1M rows) - Excellent for grammar correction
- `readerbench/ro-text-summarization` (72K rows) - Good semantic understanding data

### Specialized, Domain-Specific:
- `fmi-unibuc/RoAcReL` (1.9K rows) - Unique dialectal content
- `BlackKakapo/recipes-ro` (881 rows) - Procedural language patterns

### Foundation Resources:
- `dumitrescustefan/RoWordNet` - Essential semantic knowledge base
- `UniversalDependencies/UD_Romanian-RRT` - Core syntactic structure

---

## 🔬 Training Recommendations

### Model Architecture Suggestions:
- **Speech Recognition**: Fine-tuned Whisper-large-v2 on Romanian ASR data
- **Grammar Correction**: T5-base or BART-large with Romanian adaptation
- **Semantic Analysis**: Romanian BERT (bert-base-multilingual-cased further fine-tuned)
- **Pronunciation**: Custom CNN+RNN architecture for phoneme analysis

### Data Augmentation Strategies:
- Use translation datasets to create synthetic error patterns
- Apply text augmentation techniques for robustness
- Cross-dataset training for generalization

### Evaluation Metrics:
- **Speech**: WER (Word Error Rate), CER (Character Error Rate)
- **Grammar**: GEC evaluation metrics (GLEU, ERRANT)
- **Semantic**: Semantic similarity scores, dialect detection accuracy
- **Pronunciation**: Phoneme error rate, stress pattern accuracy
