# Romanian NLP Datasets & Models - Categorized by Machine Learning Applications

**Last Updated:** January 19, 2026
**Architecture Version:** 2.0 (7-Component Ensemble)

---

## ChaosLimbă Architecture v2.0 Models (Currently Used)

### Speech Recognition
- **[gigant/whisper-medium-romanian](https://huggingface.co/gigant/whisper-medium-romanian)** - Pre-trained Whisper model for Romanian ASR
  - Used in: Component 1 (Speech Recognition)
  - Hosting: Groq API (free tier)
  - Performance: 10-15% WER expected

### Pronunciation Analysis
- **[gigant/romanian-wav2vec2](https://huggingface.co/gigant/romanian-wav2vec2)** - Pre-trained Wav2Vec2 for Romanian phoneme recognition
  - Used in: Component 2 (Pronunciation Analysis)
  - Hosting: RunPod (~$2-3/month)
  - Performance: 75-85% phoneme accuracy

### Grammar Correction
- **[google/mt5-small](https://huggingface.co/google/mt5-small)** - Fine-tuned for Romanian grammar correction
  - Used in: Component 3 (Grammar Correction)
  - Status: ✅ TRAINED (BLEU 68.92)
  - Hosting: RunPod (~$3-5/month)
  - Training Datasets:
    - `upb-nlp/gec-ro-texts` (2.1M rows)
    - `upb-nlp/gec_ro_cna` (5K rows)
    - `upb-nlp/gec_ro_comments`

### Semantic Similarity
- **[dumitrescustefan/bert-base-romanian-cased-v1](https://huggingface.co/dumitrescustefan/bert-base-romanian-cased-v1)** - Base Romanian BERT for semantic similarity
  - Used in: Component 4 (SPAM-A Semantic Similarity)
  - Status: ✅ Pre-trained (no fine-tuning required)
  - Hosting: HuggingFace Inference API (free tier)
  - Performance: 80-85% accuracy expected

---

## Text Generation & Language Modeling
- [upb-nlp/gec-ro-texts](https://huggingface.co/datasets/upb-nlp/gec-ro-texts) - Large-scale grammatical error correction dataset (2.1M rows)
- [upb-nlp/gec_ro_cna](https://huggingface.co/datasets/upb-nlp/gec_ro_cna) - Grammatical error correction for CNA texts (5K rows)
- [upb-nlp/gec_ro_comments](https://huggingface.co/datasets/upb-nlp/gec_ro_comments) - Grammatical error correction for comments
- [readerbench/ro-text-summarization](https://huggingface.co/datasets/readerbench/ro-text-summarization) - Romanian text summarization dataset (72K rows)

## Linguistic Analysis & Syntax
- [dumitrescustefan/RoWordNet](https://github.com/dumitrescustefan/RoWordNet) - Romanian WordNet with semantic relations
- [UniversalDependencies/UD_Romanian-RRT](https://github.com/UniversalDependencies/UD_Romanian-RRT) - Universal Dependencies treebank for Romanian
- [paul-nechifor/romanian-sentences-with-diacritics](https://huggingface.co/datasets/paul-nechifor/romanian-sentences-with-diacritics) - Sentences with proper diacritics
- [universityofbucharest/moroco](https://huggingface.co/datasets/universityofbucharest/moroco) - Morphologically rich Romanian corpus
- [adrianastan/rolex](https://github.com/adrianastan/rolex) - Romanian lexical resources

## Translation & Cross-lingual Tasks
- [fmi-unibuc/RoRuDi](https://huggingface.co/datasets/fmi-unibuc/RoRuDi) - Romanian Rules for Dialects (translation-focused)
- [community-datasets/tapaco](https://huggingface.co/datasets/community-datasets/tapaco) - Translation paraphrase corpus

## Sentiment & Emotion Analysis
- [Alegzandra/KES-2023 SART](https://github.com/Alegzandra/KES-2023/tree/main/datasets/SART) - Sentiment analysis dataset
- [Alegzandra/RED-Romanian-Emotion-Datasets](https://github.com/Alegzandra/RED-Romanian-Emotion-Datasets) - Romanian emotion detection datasets
- [andra-pumnea/hate-speech-ro](https://github.com/andra-pumnea/hate-speech-ro) - Hate speech detection dataset

## Dialectal & Regional Language Analysis
- [relate.racai.ro/uspdatro](https://relate.racai.ro/index.php?path=repository/resource&resource=uspdatro) - USP dialectal atlas
- [codrut2/RoDia](https://github.com/codrut2/RoDia/tree/master) - Romanian dialect corpus
- [datacollective/CMJ8U3PR700O1NXXBX35TIWRN](https://datacollective.mozillafoundation.org/datasets/cmj8u3pr700o1nxxbx35tiwrn) - Dialectal variations
- [fmi-unibuc/RoAcReL](https://huggingface.co/datasets/fmi-unibuc/RoAcReL) - Romanian Archaisms Regionalisms Lexicon (1.9K rows)

## Speech & Audio Processing
- [espnet/yodas2](https://huggingface.co/datasets/espnet/yodas2) - Automatic speech recognition dataset
- [qmeeus/vp-er-10l](https://huggingface.co/datasets/qmeeus/vp-er-10l) - Voice processing dataset
- [phonemetransformers/IPA-CHILDES](https://huggingface.co/datasets/phonemetransformers/IPA-CHILDES) - Phonological analysis dataset

## Code & Technical Language Processing
- [sanda-avram/ROST-source-code](https://github.com/sanda-avram/ROST-source-code) - Romanian source code dataset

## Nonstandard & Historical Language
- [DianaHoefels/CoRoSeOf](https://github.com/DianaHoefels/CoRoSeOf) - Code-switching and nonstandard language
- [UniversalDependencies/UD_Romanian-Nonstandard](https://github.com/UniversalDependencies/UD_Romanian-Nonstandard) - Nonstandard Romanian treebank

## Reasoning & Procedural Understanding
- [dragosnicolae555/RoITD](https://huggingface.co/datasets/dragosnicolae555/RoITD) - Romanian Instructional Text Dataset
- [BlackKakapo/recipes-ro](https://huggingface.co/datasets/BlackKakapo/recipes-ro) - Romanian recipes dataset (881 rows)
- [faur-ai/fulg](https://huggingface.co/datasets/faur-ai/fulg) - Romanian procedural text dataset

## Dependency Parsing & Syntactic Structure
- [lindat.mff.cuni.cz/369137ef-0a2e-4bc9-926c-6f991f79f390](https://lindat.mff.cuni.cz/repository/items/369137ef-0a2e-4bc9-926c-6f991f79f390) - Additional dependency parsing resources