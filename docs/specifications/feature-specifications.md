# ChaosLimbă Feature Specifications

**Document Version:** 3.2 - February 2026 Audit
**Last Updated:** February 9, 2026
**Status:** MVP ~99.5% Complete - Approaching Beta

## Document Purpose
This document provides detailed specifications for each major feature and section of the ChaosLimbă platform, including their purpose, functionality, user interactions, and how they integrate with the broader system architecture.

**This version includes implementation status markers:**
- ✅ **IMPLEMENTED** - Feature is fully built and deployed
- 🔧 **PARTIALLY IMPLEMENTED** - Core functionality exists, advanced features pending
- 🟡 **NOT YET IMPLEMENTED** - Specification complete, awaiting development

---

## Implementation Status Summary

| Feature | Status | Completion | Notes |
|---------|--------|------------|-------|
| **Deep Fog Mode** | ✅ Implemented | 100% | CEFR filtering, fog depth, search/sort, stats, session summary |
| **Chaos Window** | ✅ Implemented | 100% | Chat UI, smart content selection, fossilization-aware tutor, content-aware practice audio, session timer |
| **Workshop** | ✅ Implemented | 100% | Non-linear flow, 7 challenge types, adaptation-tier-aware, challenge validation |
| **Mystery Shelf** | ✅ Implemented | 100% | AI exploration, TTS review, filters, search, sort, stats, delete, duplicate detection |
| **Error Garden** | ✅ Implemented | 100% | Pattern viz, fossilization tiers, trends, modality, L1 transfer, context-aware audio, grid/list views |
| **Adaptation Engine** | ✅ Implemented | 100% | 3-tier fossilization escalation, lazy measurement, dynamic weights, tier 3 exit logic |
| **Adaptive Tutoring System** | ✅ Implemented | 100% | AI tutor + adaptation engine + smart content selection + fossilization alerts |
| **Grading & Harvesting Engine** | ✅ Implemented | 100% | All 10 core components deployed and working |
| **Proficiency Tracker** | ✅ Implemented | 100% | Real data from history, trends, refresh, skill insights, enhanced chart |
| **Onboarding System** | ✅ Implemented | 100% | Complete proficiency assessment workflow |
| **Theme System** | ✅ Implemented | 100% | 8 color themes (Modern Glass, Forest Haven, Neon Nostalgia, Wild Runes, Bathhouse Glow, Vinyl Era, Neon Circuit, Soft Bloom) + light/dark modes |

---

## Table of Contents
1. [Deep Fog Mode](#deep-fog-mode) ✅
2. [Chaos Window](#chaos-window) ✅
3. [Workshop](#workshop) ✅
4. [Mystery Shelf](#mystery-shelf) ✅
5. [Error Garden](#error-garden) ✅
6. [Adaptation Engine](#adaptation-engine) ✅
7. [Adaptive Tutoring System](#adaptive-tutoring-system) ✅
8. [Grading & Harvesting Engine](#grading--harvesting-engine) ✅
9. [Proficiency Tracker](#proficiency-tracker) ✅

---

## Deep Fog Mode ✅ IMPLEMENTED

**Implementation Status:** 100% Complete
**Deployed:** January 28, 2026
**Route:** `/deep-fog`

### Purpose
Deep Fog Mode is a **passive immersion experience** that intentionally exposes learners to content **above their current proficiency level** to promote cognitive disequilibrium and contextual awareness through productive confusion.

### Implementation Status

✅ **Implemented:**
- Content browser with type filters (all/text/audio)
- Content player for audio and text content (ContentPlayer component)
- Content modal for immersive reading/listening
- Word/timestamp capture to Mystery Shelf
- CEFR level display and CEFR filtering per content item
- Fog depth levels for progressive immersion
- Search and sort functionality
- Session summary with stats
- Shuffle/random content selection
- Session tracking

### Core Concept
Unlike traditional language learning that presents content at or slightly above the learner's level, Deep Fog Mode deliberately introduces content 1-3 levels above the user's proficiency. The goal is not immediate comprehension, but rather:
- Building tolerance for ambiguity
- Developing contextual inference skills
- Exposing learners to advanced vocabulary and structures in authentic contexts
- Creating "sticky" memories through cognitive struggle

### Key Features

#### Content Selection
- **Level Targeting**: Content is automatically selected to be 1-3 CEFR levels above the learner's current proficiency
  - A1 learner → B1/B2 content
  - B1 learner → C1/C2 content
- **Content Types**:
  - Advanced articles from Romanian news sources
  - Literary excerpts from Romanian authors
  - Academic texts
  - Professional discourse (business, technical, scientific)
  - Cultural commentary and opinion pieces
- **Authenticity**: All content is authentic (created for native speakers), never pedagogically simplified

#### Unknown Collection System
- **Visual Highlighting**: Unknown words and phrases are visually distinct but non-intrusive
- **Click-to-Collect**: Learners can click any word/phrase to add it to their Mystery Shelf
- **Contextual Preservation**: When collecting an unknown, the surrounding sentence/context is preserved
- **No Immediate Definitions**: Definitions are not provided during Deep Fog - learners must tolerate uncertainty
- **Batch Collection**: Learners can highlight and collect multiple items in a single session

#### User Interface Elements
- **Level Indicator**: Clear display showing user's current level vs. content level
- **Progress Tracking**: Visual indicator of how much content has been consumed
- **Mystery Shelf Quick Stats**: Running count of items collected, explored, and pending
- **Navigation**: Easy access to load new content or return to previous pieces

### Integration with Other Systems

#### Mystery Shelf Connection
- All collected unknowns automatically populate the Mystery Shelf
- Timestamps preserve when items were encountered in Deep Fog
- Context sentences are stored for later reference

#### Proficiency Tracker Integration
- Deep Fog engagement is tracked (time spent, content consumed)
- No negative impact on proficiency scores (errors are expected and welcomed)
- Progress metric: tolerance for ambiguity increases with Deep Fog usage

#### Adaptation Engine
- System learns which content types engage individual learners
- Recommends Deep Fog sessions when learners show signs of fossilization in their current level
- Balances Deep Fog exposure with at-level content based on learner stress indicators

### Pedagogical Rationale
Based on **Interlanguage Theory** and **Chaos/Complexity Theory**:
- Exposure to above-level input creates cognitive disruption that prevents premature fossilization
- Learners develop meta-cognitive awareness of what they don't know
- Contextual exposure to advanced structures primes the brain for later explicit learning
- Removes performance pressure - learners can't "fail" at Deep Fog

### User Experience Flow
1. Learner selects Deep Fog Mode
2. System presents above-level content with visual highlighting of potentially unknown items
3. Learner reads/listens at their own pace, with no comprehension checks or requirements
4. Learner clicks unknown items to collect them to Mystery Shelf
5. Session ends when learner chooses, with option to continue with same or new content
6. Summary shows items collected and provides link to Mystery Shelf

### Success Metrics
- Number of Deep Fog sessions completed per week
- Items collected per session
- Time spent in Deep Fog mode
- Subsequent Mystery Shelf exploration rate
- Tolerance for ambiguity (measured through user surveys and behavior tracking)

---

## Chaos Window ✅ IMPLEMENTED

**Implementation Status:** 100% Complete
**Deployed:** January 27, 2026 (Chat UI: January 31, 2026)
**Route:** `/chaos-window`

### Purpose
Chaos Window is an **active, randomized learning experience** that combines at-level or slightly-above-level content with **real-time AI tutor interaction** to create targeted productive confusion and force usage of weak linguistic structures.

### Implementation Status

✅ **Fully Implemented:**
- Smart content selection (fossilization-aware weighted random)
- Chat-based UI with conversation history
- Real-time AI tutor interaction (Llama 3.3 70B via Groq)
- Fossilization alerts passed to tutor for targeted questioning
- Text and speech input support
- Pronunciation practice integration
- Session tracking and completion
- Session summary with performance metrics
- AI-generated questions based on content + error patterns
- User response submission (text/audio)
- Vocabulary help system (removed timer for better UX)
- Multi-modal content support (video/audio/text)
- Error Garden integration (errors auto-logged from tutor feedback)
- Follow-up question chains targeting weak structures

🟡 **Post-MVP:**
- Full session analytics dashboard
- Advanced ZPD-based difficulty adjustment

### Core Concept
Unlike Deep Fog's passive immersion, Chaos Window is intensely interactive and strategically chaotic. The system:
- Randomly selects content from a curated pool
- Uses Error Garden data to generate questions that force learners to use their weakest structures
- Creates time pressure to encourage automaticity
- Adapts in real-time based on learner responses

### Key Features

#### Randomized Content Delivery
- **Content Pool**: Pre-curated collection of videos, podcasts, articles, and interactive media
- **Random Selection**: Algorithm randomly selects from content appropriate for learner's level
- **Modality Variety**: Sessions include mix of audio, video, text, and multimodal content
- **Level Calibration**: Content is at learner's level (60-70% comprehension expected) or slightly above (+0.5 levels max)
- **Content Types**:
  - 1-3 minute podcast clips
  - Short video segments with cultural content
  - News article excerpts
  - Social media threads
  - Dialogue transcripts

#### Timed Session Structure
- **Default Timer**: 5-10 minute sessions (user can configure)
- **Countdown Display**: Prominent timer creates productive time pressure
- **Session Goals**: Complete 2-3 content pieces per session with AI interaction
- **Pause/Resume**: Learners can pause but are encouraged to complete sessions
- **Session Summary**: Performance feedback at session end

#### AI Tutor Integration
- **Real-Time Interaction**: AI (powered by Llama 3.3 70B (Groq)) responds immediately to learner input
- **Error Garden Informed**: AI knows learner's weak structures and targets them
- **Productive Confusion Questions**: AI asks questions specifically designed to force usage of avoided structures
- **Scaffolding**: AI provides hints and prompts but doesn't give direct answers
- **Follow-Up Chains**: AI generates 2-4 follow-up questions per content piece

#### AI Tutor Question Types
1. **Comprehension Checks**: "Ce a spus personajul despre...?"
2. **Structure Forcing**: "Folosește dativul să-mi explici..." (forces dative case usage)
3. **Opinion/Elaboration**: "De ce crezi că..." (encourages extended output)
4. **Comparison**: "Compară X cu Y..." (forces complex sentence structures)
5. **Hypotheticals**: "Dacă ar fi..." (forces conditional/subjunctive)

### Integration with Other Systems

#### Error Garden Connection
- AI tutor receives real-time feed of learner's error patterns
- Questions are dynamically generated to target top 3-5 error clusters
- Learner responses are sent to Grading Panel for analysis
- New errors are immediately added to Error Garden

#### Grading & Harvesting Engine
- All learner output (spoken or written) is processed by parallel diagnostic suite
- Grammar, pronunciation, and semantic scores are generated
- Feedback is provided after session (not real-time to maintain flow)

#### Proficiency Tracker
- Chaos Window performance contributes to proficiency calculations
- Target: 60-80% accuracy (Zone of Proximal Development)
- System adjusts content difficulty if accuracy falls outside ZPD

#### Mystery Shelf
- Unknowns encountered in Chaos Window can be collected
- Less emphasis on collection than Deep Fog (focus is on production, not input)

### Pedagogical Rationale
Based on **Output Hypothesis** and **Cognitive Disequilibrium**:
- Production forces syntactic (not just semantic) processing
- Real-time AI interaction simulates conversation pressure
- Randomization prevents predictability and encourages adaptability
- Time pressure builds automaticity and fluency
- Targeted questioning disrupts fossilized patterns

### User Experience Flow
1. Learner initiates Chaos Window session
2. Timer starts, first content piece is presented
3. Learner consumes content (watches/listens/reads)
4. AI asks targeted question based on content and Error Garden data
5. Learner responds (speaking or writing)
6. AI provides follow-up or moves to next content piece
7. Session continues until timer expires or learner ends
8. Summary shows performance, errors detected, and recommendations

### Success Metrics
- Sessions completed per week
- Accuracy within ZPD (60-80%)
- Reduction in error frequency for targeted structures
- Response fluency (words per minute for spoken, time to first word)
- Learner engagement (session completion rate)

### Key Differences from Deep Fog

| Aspect | Deep Fog | Chaos Window |
|--------|----------|--------------|
| **Content Level** | Well above learner level | At or slightly above level |
| **Interaction** | Passive (reading/listening only) | Active (production required) |
| **AI Involvement** | None | Real-time tutor |
| **Time Pressure** | None | Timed sessions |
| **Primary Goal** | Exposure & tolerance for ambiguity | Production & structure practice |
| **Error Expectation** | High (expected, welcomed) | Moderate (ZPD = 60-80% accuracy) |
| **Unknown Collection** | Primary activity | Secondary activity |

---

## Workshop ✅ IMPLEMENTED

**Implementation Status:** 100% Complete
**Deployed:** February 3, 2026
**Route:** `/workshop`

### Purpose
Workshop is a **grammar and vocabulary micro-challenge system** that provides targeted practice through short, focused exercises. It integrates with the Adaptation Engine to deliver challenges specifically targeting the learner's weakest structures, including fossilization-aware destabilization challenges.

### Implementation Status

✅ **Implemented:**
- 4 grammar challenge types: transform, complete, fix, rewrite
- 3 vocab challenge types: use_it, which_one, spot_the_trap
- Non-linear challenge flow with type history tracking
- Surprise intervals for cognitive variety
- Multiple choice UI support
- Timer modes (5 min, 10 min, freeplay)
- Destabilization-tier-aware challenge generation
- Bilingual prompts for A1-A2 beginners
- Feature progress tracking within sessions
- Prefetching for smooth UX
- Error logging to Error Garden
- Feature targeting via Adaptation Engine weights

🟡 **Not Yet Implemented:**
- Session history / past challenge review
- Workshop-specific analytics dashboard
- Spaced repetition scheduling for reviewed features

### Core Concept
Workshop complements Chaos Window's conversational practice with structured, bite-sized grammar and vocabulary exercises. While Chaos Window provides open-ended production practice, Workshop delivers focused drills targeting specific linguistic structures identified by the Adaptation Engine.

### Key Features

#### Challenge Types

**Grammar Challenges:**
1. **Transform**: Change a sentence's structure (e.g., active → passive, present → past)
2. **Complete**: Fill in missing grammatical elements
3. **Fix**: Identify and correct errors in a sentence
4. **Rewrite**: Express the same meaning using a different structure

**Vocabulary Challenges:**
1. **Use It**: Use a given word correctly in a sentence
2. **Which One**: Choose the correct word from options
3. **Spot the Trap**: Identify the incorrect usage among options

#### Adaptation Engine Integration
- Workshop receives `destabilizationTier` from feature targeting
- Tier 2+: Forces production/correction challenge types (transform, fix)
- Tier 3: Adds cognitive disequilibrium prompts to challenge instructions
- Feature selection weighted by: noticing gap (40%), error reinforcement (15-40%), fossilization drill (0-35%), random (20%)

#### Non-Linear Flow
- Challenge types rotate based on history (prevents consecutive repeats)
- Surprise intervals inject unexpected challenge types
- Session length configurable via timer modes
- Progress tracked per grammatical feature within session

### Integration with Other Systems

#### Adaptation Engine
- Receives feature targeting weights based on error patterns
- Destabilization tiers escalate challenge difficulty and cognitive load
- Records interventions for outcome measurement

#### Error Garden
- All incorrect responses logged as errors with category metadata
- Intentionally wrong answers always recorded (no false positives filtering)
- Error deduplication prevents duplicate logging within sessions

#### Proficiency Tracker
- Workshop performance contributes to proficiency calculations
- Feature mastery tracked via `userFeatureExposure` table

### Pedagogical Rationale
Based on **Output Hypothesis** and **Focus on Form**:
- Targeted production forces syntactic processing of specific structures
- Multiple challenge types engage different cognitive processes
- Destabilization at higher tiers creates productive confusion for fossilized patterns
- Bilingual support scaffolds beginners without reducing cognitive challenge

---

## Mystery Shelf ✅ IMPLEMENTED

**Implementation Status:** 100% Complete
**Deployed:** January 28, 2026
**Route:** `/mystery-shelf`

### Implementation Status

✅ **Implemented:**
- Unknown word/phrase collection system (manual + Deep Fog capture)
- Storage and retrieval with full CRUD
- AI-powered deep exploration via `/api/ai/analyze-mystery-item` (definition, examples, grammar, pronunciation)
- MysteryExploreCard component for rich exploration view
- Quick review dialog with TTS pronunciation (ElevenLabs)
- Filter system (all/new/explored), search, sort
- Stats display (total, new, explored counts)
- Duplicate detection and deletion
- Context preservation from original encounter
- Practice generation via `/api/mystery-shelf/practice`

🟡 **Post-MVP:**
- Spaced repetition scheduling
- Mastery tracking progression
- Batch operations (explore multiple items)
- Export functionality

### Purpose
Mystery Shelf is a **learner-controlled repository** for unknown words, phrases, and structures collected during Deep Fog Mode and other learning activities. It provides both **quick review** and **deep exploration** options, empowering learners to choose their engagement level.

### Core Concept
The Mystery Shelf operationalizes the idea that learners should have agency over what they learn and when. Unlike traditional flashcard systems that force spaced repetition, Mystery Shelf:
- Allows learners to collect items without immediate pressure to study them
- Provides two engagement modes (quick vs. deep) to match learner motivation
- Preserves context from original encounter
- Feeds into Error Garden for long-term retention tracking

### Key Features

#### Item Collection & Organization
- **Automatic Population**: Items collected in Deep Fog automatically appear
- **Manual Addition**: Learners can manually add items encountered anywhere
- **Contextual Preservation**: Each item stores:
  - The unknown word/phrase
  - The full sentence where it was encountered
  - The source (article title, podcast name, etc.)
  - Timestamp of collection
  - Exploration status (new, explored, mastered)
- **Filtering & Sorting**:
  - Filter by status (new, explored, all)
  - Sort by date collected, alphabetically, or by frequency of appearance
  - Search functionality

#### Quick Review Mode
- **One-Click Definition**: Simple tap/click reveals definition and translation
- **Minimal Friction**: Designed for rapid scanning of multiple items
- **Audio Pronunciation**: Native speaker audio for each word
- **Mark as Reviewed**: Items can be marked as "quickly reviewed" for tracking
- **Swipe Actions**: Mobile-optimized gestures for quick actions

**Quick Review Display:**
```
îndoielnic
(adj.) doubtful, questionable, uncertain
[Speaker icon] Listen to pronunciation
Context: "Este îndoielnic că va reuși"
```

#### Deep Exploration Mode
When learners choose to deeply explore an item, they receive comprehensive information:

**1. Definition Section**
- Detailed Romanian definition (in Romanian, for advanced learners)
- English translation
- Part of speech and grammatical category
- Formality level (formal, neutral, colloquial)
- Connotations and nuance

**2. Usage Examples**
- 5-7 authentic example sentences
- Examples span different contexts (formal, casual, written, spoken)
- Examples sourced from real Romanian media when possible
- Learner's original context sentence highlighted

**3. Grammar Notes**
- All grammatical forms (for adjectives: m/f/sg/pl; for verbs: conjugation table)
- Case usage (for nouns)
- Verb aspect information (perfective/imperfective)
- Collocations (common word pairings)

**4. Cultural/Pragmatic Notes** (when relevant)
- Usage restrictions (e.g., "Used primarily in written Romanian")
- Register appropriateness
- Regional variations
- Cultural associations

**5. Related Words**
- Synonyms with nuance distinctions
- Antonyms
- Word family (related derivations)

**6. Practice Prompt**
- AI-generated prompt encouraging learner to use the word
- Text input for learner response
- Option to submit for AI grading

**7. Multimedia** (when available)
- Image associations
- Video clips showing word in use
- Audio examples from podcasts/media

#### Engagement Tracking
- **Status Indicators**: Visual badges show new/explored/mastered status
- **Progress Stats**: Dashboard showing:
  - Total items collected
  - Items explored this week
  - Most frequently appearing items
  - Longest unexplored items (collection date)
- **Exploration History**: Timestamp of when items were deeply explored

### Integration with Other Systems

#### Error Garden Connection
- Items from Mystery Shelf that appear in learner errors are flagged
- Frequency of error for Mystery Shelf items is tracked
- Spaced repetition algorithm suggests review of items not used correctly in production
- Items mastered in Error Garden are marked as "mastered" in Mystery Shelf

#### Chaos Window Integration
- Mystery Shelf items can be deliberately injected into Chaos Window sessions
- AI tutor asks questions requiring use of Mystery Shelf vocabulary
- Learners can "practice" specific Mystery Shelf items by requesting targeted Chaos Window sessions

#### Adaptive Tutoring System
- System recommends which Mystery Shelf items to explore based on:
  - Error Garden data (prioritize items being used incorrectly)
  - Proficiency gaps (items in learner's ZPD)
  - Recency of collection (older items suggested for review)
- Sends notifications: "You have 5 unexplored items from this week"

#### Deep Fog Feedback Loop
- Mystery Shelf analytics inform Deep Fog content selection
- System prioritizes content containing learner's Mystery Shelf items for reinforcement
- Heat map shows which types of content generate most Mystery Shelf collections

### Pedagogical Rationale
Based on **Exploratory Agency** and **Interlanguage Theory**:
- Learner autonomy increases motivation and retention
- Choice between quick and deep exploration respects individual learning preferences
- Context preservation supports meaningful learning over rote memorization
- Connection to Error Garden ensures items are practiced in production, not just recognized

### User Experience Flow

**Quick Review Flow:**
1. Learner opens Mystery Shelf
2. Filters to "New" items
3. Scrolls through list, clicking items to see quick definition
4. Marks items as reviewed or skips
5. Exits when satisfied

**Deep Exploration Flow:**
1. Learner opens Mystery Shelf
2. Selects item of interest
3. Reviews comprehensive information sections
4. Completes practice prompt (optional)
5. Marks item as explored
6. Item moves to "explored" status, feeds into Error Garden for future practice

### Success Metrics
- Collection rate (items per week)
- Exploration rate (% of collected items deeply explored)
- Time to exploration (days between collection and deep exploration)
- Practice prompt completion rate
- Mastery rate (items correctly used in subsequent Chaos Window/production tasks)
- Retention rate (items correctly used 1 week, 1 month after exploration)

### Design Considerations

#### Avoid Overwhelming Learners
- Default view shows max 10 items at a time
- "New" badge only appears for items collected in last 7 days
- Gentle notifications, never pushy

#### Respect Learner Agency
- No forced review or spaced repetition
- Learners can delete items without penalty
- Exploration is encouraged but optional

#### Gamification (Optional)
- Streak tracking for daily Mystery Shelf engagement
- Badges for exploration milestones (10, 50, 100 items explored)
- "Mastery" celebrations when items appear correctly in production

---

## Error Garden ✅ IMPLEMENTED

**Implementation Status:** 100% Complete
**Deployed:** January 23, 2026 (Adaptation Engine: February 2, 2026)
**Route:** `/error-garden`

### Implementation Status

✅ **Implemented:**
- Automatic error collection from all production tasks (Chaos Window, Workshop, content)
- Error categorization (grammar, pronunciation, vocabulary, word order)
- Modality tracking (text vs speech)
- Full pattern visualization dashboard with grid/list view modes
- Error frequency tracking with sort options (frequency/risk/count)
- Trend charts (5-week sparkline per pattern)
- Pattern modal with examples, interlanguage rule, transfer source, intervention suggestions
- Fossilization detection (3-tier system via Adaptation Engine)
- Tier filtering (all / tier 1+ / tier 2+)
- Automated intervention protocols (nudge/push/destabilize)
- Intervention outcome measurement (lazy assessment 3+ days post-intervention)
- Trending analysis with direction indicators (improving/stable/worsening)
- Error deduplication within sessions
- Error clustering using frequency-based grouping + adaptation tiers
- L1 transfer analysis
- Context-aware audio playback

🟡 **Post-MVP:**
- ML-based error clustering (using frequency + adaptation tiers instead — may not be needed)
- Population-level pattern insights

### Purpose
The Error Garden is an **interlanguage analysis engine** that systematically collects, clusters, and curates learner errors to transform mistakes into a personalized curriculum. It is the data backbone that powers ChaosLimbă's adaptive capabilities.

### Core Concept
Traditional language learning treats errors as failures to be corrected and forgotten. ChaosLimbă's Error Garden treats errors as:
- **Valuable data points** revealing the learner's current interlanguage system
- **Patterns** that indicate systematic gaps rather than random mistakes
- **Curriculum seeds** that determine what the learner needs next

The Error Garden doesn't just store errors—it analyzes them, clusters them, and feeds them back into the system to drive personalized learning pathways.

### Key Features

#### Error Collection
- **Automatic Harvesting**: All learner production (speaking, writing) is processed by the Grading & Harvesting Engine
- **Multi-Dimensional Coding**: Each error is tagged with:
  - Error type (phonological, morphological, syntactic, lexical, pragmatic)
  - Specific structure involved (e.g., "genitive case," "subjunctive mood")
  - Context of error (speaking vs. writing, timed vs. untimed, Chaos Window vs. standalone)
  - Confidence score from AI grading system
  - L1 transfer likelihood (is this likely caused by English interference?)
- **Manual Flagging**: Learners can flag areas they feel uncertain about, even if no explicit error occurred

#### Error Clustering & Pattern Recognition
- **Machine Learning Clustering**: Errors are grouped into clusters based on similarity
- **Pattern Identification**: System identifies:
  - **Systematic errors**: Same mistake repeated across contexts (e.g., always using accusative instead of dative)
  - **Context-dependent errors**: Mistakes that occur in specific situations (e.g., genitive correct in writing, wrong in speaking)
  - **Fossilization risks**: Errors appearing in 70%+ of production opportunities
  - **Emerging competence**: Areas where errors are decreasing
- **Error Frequency Tracking**: Monitors how often each pattern appears over time

#### Error Categories

**1. Phonological Errors**
- Mispronunciation of specific phonemes (î/â, ă)
- Stress pattern errors
- Intonation issues
- Connected speech problems

**2. Morphological Errors**
- Case errors (nominative, accusative, genitive, dative, vocative)
- Verb conjugation mistakes
- Adjective agreement errors (gender, number, case)
- Article misuse

**3. Syntactic Errors**
- Word order violations
- Missing or incorrect subordination
- Clause structure errors
- Relative clause problems

**4. Lexical Errors**
- Wrong word choice
- Collocation errors ("make a photo" instead of "take a photo")
- Register mismatches (using colloquial in formal context)
- False friends from English

**5. Pragmatic/Cultural Errors**
- Inappropriate formality level (tu vs. dumneavoastră)
- Missing cultural context
- Discourse marker misuse
- Politeness violations

#### Fossilization Detection
- **Threshold**: Errors appearing in ≥70% of production opportunities across 10+ instances
- **Alert System**: Flags fossilization risks to Adaptation Engine
- **Intervention Protocol**: Triggers intensive remediation:
  1. Targeted input (Deep Fog content rich in correct usage)
  2. Constrained output (exercises forcing correct structure)
  3. Chaos injection (Chaos Window questions requiring the structure)
  4. Monitoring (track accuracy improvement)

### Visual Representation (User-Facing)

#### Dashboard View
- **Error Pattern Cards**: Visual cards for each major error cluster
  - Pattern name (e.g., "Genitive Case")
  - Category badge (Grammar/Phonology/etc.)
  - Frequency bar (0-100%)
  - Trend arrow (improving ↗ / stable → / worsening ↘)
  - Last occurrence timestamp
- **Fossilization Warnings**: Red-flagged patterns requiring attention
- **Progress Celebrations**: Green-flagged patterns showing improvement

#### Error Timeline
- Chronological view of errors over time
- Heat map showing high-error periods vs. improvement periods
- Correlation with learning activities (Did Chaos Window session reduce errors?)

### Integration with Other Systems

#### Grading & Harvesting Engine
- Receives all error data from diagnostic suite
- Stores errors in database with full metadata
- Clustering happens post-collection through ML algorithms

#### Adaptive Tutoring System
- **Primary Data Source**: Error Garden data drives all Adaptation Engine decisions
- **Content Sequencing**: System assigns content targeting top error clusters
- **Question Generation**: AI tutor receives error data to generate productive confusion questions
- **Progress Monitoring**: Accuracy thresholds (60-80% ZPD) are tracked per structure

#### Chaos Window
- AI tutor questions are tailored to force usage of error-prone structures
- Example: If Error Garden shows dative case errors, AI asks "Cui îi dai cartea?"

#### Mystery Shelf
- Items from Mystery Shelf that appear in errors are cross-referenced
- Learners see "You've collected this word but used it incorrectly in 3 recent outputs"

#### Proficiency Tracker
- Error Garden data contributes to overall proficiency calculations
- Reduction in error frequency = proficiency increase
- Fossilization risks can temporarily lower proficiency scores to encourage remediation

### Pedagogical Rationale
Based on **Interlanguage Theory** and **Error Harvesting**:
- Errors reveal the systematic rules of the learner's current interlanguage system
- Pattern clustering identifies what learners actually need vs. what a textbook says they need
- Fossilization detection prevents premature plateaus
- Spaced exposure to correct forms (through targeted content) promotes restructuring

### User Experience Flow

**Learner-Facing:**
1. Learner completes production task (Chaos Window, standalone speaking/writing)
2. System processes and grades output
3. Errors are automatically added to Error Garden
4. Learner sees updated Error Garden dashboard showing:
   - New errors detected
   - Progress on targeted error patterns
   - Recommendations for next steps
5. Learner can explore specific error patterns to see examples and explanations

**System-Facing (Automatic):**
1. Grading Panel sends error data to Error Garden
2. ML clustering algorithm updates error pattern groups
3. Fossilization detection runs after every 10th production sample
4. Adaptation Engine queries Error Garden for decision-making
5. Content recommendations are updated based on error clusters

### Success Metrics
- Error pattern identification accuracy (validated against human raters)
- Fossilization detection rate
- Time to remediation (days between fossilization detection and accuracy improvement)
- Learner awareness (% of learners who can name their top 3 error patterns)
- Reduction in error frequency over time

### Privacy & Transparency
- **Learner Access**: Full transparency—learners can view all errors stored
- **Data Ownership**: Learners can export or delete their Error Garden data
- **Anonymized Aggregation**: Population-level error patterns inform curriculum design but are fully anonymized

---

## Adaptation Engine ✅ IMPLEMENTED

**Implementation Status:** 100% Complete
**Deployed:** February 2, 2026
**File:** `src/lib/ai/adaptation.ts`

### Purpose
The Adaptation Engine is the **core decision-making system** that detects fossilization patterns, escalates interventions through 3 tiers, and dynamically adjusts content/workshop selection weights to target a learner's weakest structures.

### Implementation Status

✅ **Implemented:**
- 3-tier fossilization escalation system
- Dynamic content selection weight adjustment
- Dynamic workshop feature targeting weights
- Intervention recording (`adaptation_interventions` table)
- Lazy outcome measurement (3+ days post-intervention)
- Trending analysis (current week vs 2 weeks prior)
- `buildFossilizationAlerts()` for tutor prompt injection
- Integration with Chaos Window, Workshop, and smart content selection

### 3-Tier Escalation

| Tier | Name | Trigger | Response |
|------|------|---------|----------|
| 1 | Nudge | 40-69% error frequency | Increase targeting weight for the feature |
| 2 | Push | ≥70% frequency + 2 interventions with no improvement | Force production/correction challenge types in Workshop |
| 3 | Destabilize | ≥70% frequency + 4 interventions with no improvement | Add cognitive disequilibrium prompts to challenges + tutor |

### Dynamic Weight Adjustment

The Adaptation Engine adjusts the weighted random selection for both content and workshop challenges:

**Default weights (no fossilization):**
- Unseen features: 40%
- Weak features: 20%
- Random: 20%
- (Fossilizing: 0%)

**Tier 2+ weights:**
- Unseen features: 30%
- Weak features: 15%
- Fossilizing: 35%
- Random: 20%

### Outcome Measurement

The engine uses "lazy measurement" — rather than measuring immediately after an intervention:
1. Records when a feature was targeted (`adaptation_interventions` table)
2. Waits 3+ days before assessing outcome
3. Compares error frequency before vs. after intervention
4. If no improvement after 2 interventions → escalate to Tier 2
5. If no improvement after 4 interventions → escalate to Tier 3

### Integration Points
- **Chaos Window**: `buildFossilizationAlerts()` injects tier-specific prompts into tutor system prompt
- **Workshop**: `getWorkshopFeatureTarget()` returns `destabilizationTier` to challenge generator
- **Content Selection**: `getSmartContentForUser()` uses dynamic weights from adaptation profile
- **Error Garden**: Sources all error frequency data for tier calculations

### Pedagogical Rationale
Based on **Interlanguage Theory** and **Chaos/Complexity Theory**:
- Fossilization is the #1 enemy of language development at intermediate+ levels
- Escalating interventions prevent the system from giving up on difficult patterns
- Cognitive disequilibrium (Tier 3) forces restructuring of fossilized interlanguage rules
- Lazy measurement respects the non-linear nature of language acquisition (improvement isn't instant)

---

## Adaptive Tutoring System ✅ IMPLEMENTED

**Implementation Status:** 100% Complete
**Deployed:** January 2026 (Adaptation Engine: February 2, 2026)

### Implementation Status

✅ **Implemented:**
- **Conversational Core** - Llama 3.3 70B via Groq (FREE)
  - Real-time dialogue generation with chat UI
  - Context-aware responses
  - Fossilization-alert-aware question generation
  - Multi-turn conversation support
  - CEFR-level-appropriate prompts (bilingual for A1-A2)
- **Conductor/Router** - Orchestrates component routing
- **Smart Content Selection** - Fossilization-aware weighted random
  - Dynamic weights from adaptation profile
  - 40-50% unseen, 15-40% weak, 0-35% fossilizing, 20% random
- **3-Tier Adaptation Engine** (`src/lib/ai/adaptation.ts`)
  - Tier 1 (nudge): 40-69% error frequency
  - Tier 2 (push): ≥70% + 2 failed interventions
  - Tier 3 (destabilize): ≥70% + 4 failed interventions
  - Lazy intervention outcome measurement (3+ days post-intervention)
  - Trending analysis (current week vs 2 weeks prior)
- **Workshop Feature Targeting** - Tier-aware challenge selection
- **Fossilization intervention triggers** - Automatic via adaptation tiers
- **Onboarding tutor interaction** - Introduction to AI tutor

🟡 **Post-MVP:**
- Knowledge Base integration (SLA frameworks, CEFR standards as structured data)
- Advanced ZPD maintenance and modality balancing
- Pedagogical scaffolding adjustments
- Advanced content sequencing beyond weighted random

### Purpose
The Adaptive Tutoring System is the **"brain" of ChaosLimbă**, combining rule-based logic, AI-powered conversation, and pedagogical frameworks to provide personalized, dynamic instruction that evolves with each learner.

### Core Concept
Unlike static curricula that present the same content to all learners, the Adaptive Tutoring System uses real-time data from the Error Garden, Proficiency Tracker, and learner behavior to:
- Sequence content based on individual needs
- Generate productive confusion responses
- Maintain learners within their Zone of Proximal Development
- Inject targeted chaos to prevent fossilization

### System Architecture

The Adaptive Tutoring System consists of three interconnected components:

#### 1. Adaptation Engine (Rule-Based Logic)
The Adaptation Engine is the decision-making core that processes learner data and determines next steps.

**Input Sources:**
- Error Garden (top error clusters, fossilization risks)
- Proficiency Tracker (current level, accuracy trends)
- Learner activity history (time spent in each mode, completion rates)
- User preferences (content types, session length)

**Decision Logic:**
```
IF Error_Garden.genitive_errors > 70% AND attempts > 10
THEN status = "fossilization_risk"
THEN adaptation_protocol = "intensive_remediation"

IF proficiency_level = B1 AND error_frequency IN [60%, 80%]
THEN status = "optimal_ZPD"
THEN continue_current_difficulty

IF proficiency_level = B1 AND error_frequency < 60%
THEN status = "below_ZPD"
THEN increase_difficulty

IF proficiency_level = B1 AND error_frequency > 80%
THEN status = "above_ZPD"
THEN decrease_difficulty OR increase_scaffolding
```

**Output Actions:**
- Content assignment (which podcast, article, video to present)
- Difficulty adjustment (shift content level up or down)
- Mode recommendations ("Try Deep Fog session to expose yourself to advanced structures")
- Chaos injection triggers (initiate productive confusion protocol)

#### 2. Knowledge Base (Pedagogical Framework)
The Knowledge Base contains the "wisdom" that guides the system's decisions.

**Contents:**
- **SLA Frameworks**: Evidence-based language teaching methodologies
  - Input Hypothesis (Krashen)
  - Output Hypothesis (Swain)
  - Interlanguage Theory (Selinker)
  - Chaos/Complexity Theory (Larsen-Freeman)
  - Zone of Proximal Development (Vygotsky)
- **CEFR Standards**: Detailed descriptors for A1-C2 levels across all skills
- **Romanian Grammar Rules**: Complete reference for Romanian morphosyntax
- **Pedagogical Scaffolding Techniques**: Strategies for supporting learners within ZPD
- **Cultural/Pragmatic Norms**: Romanian sociolinguistic conventions
- **Error Remediation Protocols**: Research-backed methods for addressing specific error types

**Knowledge Base Updates:**
- Curated by linguists and SLA researchers
- Updated quarterly with latest research findings
- Population-level Error Garden insights feed back to improve remediation protocols

#### 3. Conversational Core (Llama 3.3 70B via Groq)
The Conversational Core is the AI-powered component that generates dynamic, context-aware responses and questions.

**Capabilities:**
- **Real-Time Dialogue Generation**: Creates natural, coherent conversations
- **Productive Confusion Responses**: Generates questions that force learners to use weak structures
- **Socratic Questioning**: Guides learners to self-discovery rather than direct instruction
- **Context Maintenance**: Remembers conversation history for coherent multi-turn exchanges
- **Error-Informed Prompting**: Receives Error Garden data to target weaknesses

**Example Interaction:**
```
Error Garden Data: Learner avoids subjunctive mood (0% usage in last 20 outputs)
Adaptation Engine: Trigger chaos injection for subjunctive
Conversational Core Prompt: "Generate a question about Romanian history that requires
subjunctive mood in the response. Reference the user's interest in historical counterfactuals."

Llama 3.3 70B (Groq) Output: "Cum crezi că ar fi fost istoria României dacă Mihai Viteazul ar fi
reușit să unifice cele trei țări în mod permanent? Să presupunem că..."

(How do you think Romanian history would have been if Michael the Brave had succeeded
in permanently unifying the three countries? Let's suppose that...)

Learner forced to use: conditional ("ar fi fost") + subjunctive ("să presupunem")
```

### Key Features

#### Dynamic Content Sequencing
- **Personalized Pathways**: No two learners follow the same content sequence
- **Adaptive Ordering**: Content order changes based on Error Garden patterns
  - High genitive errors → More genitive-rich content
  - Fossilized pronunciation → Minimal pair exercises + shadowing tasks
- **Difficulty Calibration**: Content difficulty adjusted to maintain 60-80% accuracy
- **Modality Balancing**: Shifts input/output balance based on proficiency stage
  - A1-A2: 70% input, 30% output
  - B1-B2: 50% input, 50% output
  - C1+: 30% input, 70% output

#### Chaos Injection Protocol
When Error Garden detects fossilization or avoidance of a structure, the system initiates "Chaos Injection":

**Phase 1: Targeted Input**
- Assign Deep Fog content rich in correct usage of fossilized structure
- Example: If dative case is fossilized, assign podcast about gift-giving (frequent dative contexts)

**Phase 2: Constrained Output**
- Create exercises forcing usage of target structure
- Example: "Describe three people you would give gifts to and why" (forces dative pronouns)

**Phase 3: Chaos Window Bombardment**
- AI tutor asks 3-5 questions in rapid succession requiring the structure
- No escape—learner must use the structure to continue

**Phase 4: Monitoring**
- Track accuracy over next 10 production samples
- If accuracy > 80%, structure is "de-fossilized"
- If accuracy remains low, return to Phase 1 with different content

#### Zone of Proximal Development Maintenance
- **Continuous Monitoring**: Every production task is assessed for accuracy
- **Target Range**: 60-80% accuracy
  - Below 60%: Content too hard, increase scaffolding or lower difficulty
  - Above 80%: Content too easy, increase difficulty or complexity
- **Dynamic Adjustment**: Difficulty adjusted after every 3-5 production samples
- **Scaffolding Gradients**: System can add or remove support without changing content level
  - Add scaffolding: Provide sentence starters, key vocabulary, or grammar hints
  - Remove scaffolding: Require spontaneous production without supports

### Integration with Other Systems

#### Error Garden
- **Primary Data Source**: All Adaptation Engine decisions are informed by Error Garden
- **Real-Time Updates**: Error Garden feeds new patterns to Adaptation Engine within seconds
- **Feedback Loop**: Adaptation Engine tracks whether assigned content reduces errors

#### Chaos Window
- **AI Tutor Orchestration**: Adaptation Engine generates prompts for Conversational Core
- **Question Sequencing**: Determines which questions to ask based on Error Garden + ZPD status
- **Content Selection**: Chooses which podcast/video to present in Chaos Window

#### Deep Fog Mode
- **Content Recommendation**: Suggests Deep Fog content based on learner gaps
- **Timing**: Recommends Deep Fog when learner shows fossilization signs

#### Mystery Shelf
- **Vocabulary Integration**: Ensures Mystery Shelf items appear in subsequent content
- **Practice Prompts**: Generates practice exercises using Mystery Shelf vocabulary

#### Proficiency Tracker
- **Proficiency Advancement**: Determines when learner is ready to move to next level
- **Regression Detection**: Identifies proficiency drops and adjusts content

### Pedagogical Rationale
Based on **Adaptive, Not Prescriptive** philosophy:
- One-size-fits-all curricula are inefficient and demotivating
- Learners progress at different rates in different skill areas
- Real-time adaptation prevents both boredom (too easy) and frustration (too hard)
- AI can provide personalization at scale that human tutors cannot

### User Experience Flow

**From Learner Perspective:**
1. Learner completes a Chaos Window session
2. System grades output and updates Error Garden
3. Adaptation Engine analyzes data and decides next step
4. Learner sees recommendation: "Based on your recent sessions, try this podcast about Romanian holidays"
5. Learner engages with recommended content
6. Cycle continues

**Behind the Scenes:**
1. Grading Panel sends error data to Error Garden
2. Error Garden clusters errors and flags patterns
3. Adaptation Engine queries Error Garden: "What are top 3 error clusters?"
4. Adaptation Engine queries Knowledge Base: "What content types address genitive case errors?"
5. Adaptation Engine queries Content Database: "Find B1-level podcast with high genitive frequency"
6. Adaptation Engine assigns content to learner
7. Conversational Core receives prompt: "Generate follow-up questions forcing genitive usage"
8. AI asks questions during/after content
9. Cycle repeats

### Success Metrics
- Learner retention (% still active after 1 month, 3 months, 6 months)
- Time to proficiency advancement (weeks/months per CEFR level)
- Error reduction rate (% decrease in top error clusters per month)
- ZPD maintenance (% of sessions within 60-80% accuracy range)
- Learner satisfaction (self-reported engagement and motivation)

---

## Grading & Harvesting Engine ✅ IMPLEMENTED

**Implementation Status:** 100% Complete (All 10 core components deployed and operational)
**Deployed:** January 24-27, 2026

### Implementation Status

✅ **Fully Implemented:**
- **Speech Recognition** - Whisper large-v3 via Groq API (FREE)
- **Pronunciation Analysis** - Wav2Vec2 via HuggingFace Inference (FREE)
- **Grammar Analysis** - Claude Haiku 4.5 for contextual grammar checking
- **SPAM-A: Semantic Similarity** - Sentence embeddings via HuggingFace (FREE)
- **SPAM-B: Relevance Scoring** - On-topic detection (FREE)
- **SPAM-D: Intonation Analysis** - Rule-based minimal pairs system
- **Dual-path routing** - Intelligent component activation based on input type
- **Feedback Aggregator** - Unified grading reports
- **Error transmission to Error Garden** - Real-time error logging
- **Multi-dimensional scoring** - Grammar, pronunciation, semantic, relevance scores

🔧 **Architectural Changes:**
- Switched from fine-tuned mt5-small to LLM-based grammar (better contextual understanding)
- SPAM-B reuses SPAM-A embeddings (smart optimization)
- All components now on FREE APIs (major cost savings)

🟡 **Not Yet Implemented:**
- SPAM-C: Dialectal/Pragmatic analysis (post-MVP)
- Fine-tuned pronunciation scoring models
- Advanced acoustic analysis features

### Purpose
The Grading & Harvesting Engine is a **parallel diagnostic processing system** that analyzes all learner production (speaking and writing) across multiple linguistic dimensions simultaneously. It serves as the "eyes and ears" of ChaosLimbă, feeding critical error data into the Error Garden.

### Core Concept
Traditional language learning systems assess one skill at a time (e.g., a grammar quiz, a pronunciation test). ChaosLimbă's Grading & Harvesting Engine performs **simultaneous multi-dimensional analysis**:
- Speech recognition transcribes spoken output
- Pronunciation analyzer evaluates phonological accuracy
- Grammar analyzer identifies morphosyntactic errors
- Semantic analyzer checks meaning and cultural appropriateness

All of this happens in **real-time** (or near-real-time), providing comprehensive feedback without interrupting the learning flow.

### System Architecture

#### Parallel Processing Components

**1. Speech Recognition (Fine-Tuned Whisper)**
- **Input**: Audio recordings of learner speech
- **Process**: Automatic speech recognition (ASR) generates text transcript
- **Output**:
  - Romanian text transcript
  - Confidence scores for each word
  - Audio feature vectors (for pronunciation analysis)
- **Fine-Tuning**: Model is fine-tuned on Romanian learner speech data to improve accuracy for non-native accents
- **Handles**: Various audio qualities, background noise, overlapping speech

**2. Pronunciation Analysis (Acoustic Analyzer)**
- **Input**: Audio features from Whisper + reference native speaker audio
- **Process**: Acoustic analysis comparing learner pronunciation to native speaker models
- **Analysis Dimensions**:
  - Phoneme accuracy (correct production of î, â, ă, consonant clusters)
  - Stress patterns (word-level and sentence-level stress)
  - Intonation contours (rising/falling intonation for questions, statements)
  - Speech rate and rhythm
  - Connected speech features (liaisons, reductions)
- **Output**:
  - Phonological accuracy score (0-100)
  - Specific phoneme errors flagged
  - Prosody score

**3. Grammar Analysis (Fine-Tuned T5/BART)**
- **Input**: Text transcript from Whisper OR written learner input
- **Process**: Grammatical error detection using transformer-based NLP models
- **Analysis Dimensions**:
  - Morphological errors (case, gender, number agreement)
  - Syntactic errors (word order, clause structure, missing elements)
  - Verb conjugation and tense usage
  - Article and pronoun usage
- **Output**:
  - Grammatical accuracy score (0-100)
  - Specific errors identified with error type labels
  - Suggested corrections (not always shown to learner)

**4. Semantic/Pragmatic Analysis (Romanian BERT)**
- **Input**: Text transcript or written input + context (what content they're responding to)
- **Process**: Contextual understanding using Romanian language model
- **Analysis Dimensions**:
  - Meaning accuracy (did learner express intended meaning?)
  - Lexical appropriateness (word choice fits context?)
  - Register matching (formality level appropriate?)
  - Cultural pragmatics (socially appropriate? follows Romanian norms?)
  - Coherence and cohesion (ideas connect logically?)
- **Output**:
  - Semantic/cultural appropriateness score (0-100)
  - Pragmatic errors flagged (e.g., "Used 'tu' in formal context")
  - Coherence rating

#### Feedback Aggregator
- **Function**: Combines scores from all components into unified grading report
- **Weighting**: Different components weighted based on task type
  - Speaking task: Pronunciation 30%, Grammar 30%, Semantics 40%
  - Writing task: Grammar 50%, Semantics 50%
- **Holistic Score**: Overall score (0-100) combining all dimensions
- **Detailed Breakdown**: Individual scores + specific errors

### Data Flow

```
Learner Produces Output (Speech or Writing)
        ↓
Parallel Processing (Simultaneous)
        ├→ Whisper (Speech Recognition) → Transcript + Audio Features
        ├→ Acoustic Analyzer (Pronunciation) → Phonological Score + Errors
        ├→ T5/BART (Grammar) → Grammatical Score + Errors
        └→ Romanian BERT (Semantics) → Semantic Score + Errors
        ↓
Feedback Aggregator
        ↓
Unified Grading Report (Scores + Errors)
        ↓
Error Garden (Stores Errors for Pattern Analysis)
        ↓
Learner Receives Feedback (After session or task completion)
```

### Error Harvesting Process

#### Collection
- **Every Production Task**: All spoken and written output is graded
- **Context Preservation**: Errors are stored with full context (task type, content, timing)
- **Metadata Tagging**: Each error receives multiple tags:
  - Error type (phonological, morphological, syntactic, lexical, pragmatic)
  - Specific structure (e.g., "dative case," "imperfect tense")
  - L1 transfer likelihood
  - Task context (speaking vs. writing, timed vs. untimed)

#### Transmission to Error Garden
- **Real-Time**: Errors sent to Error Garden immediately after grading
- **Batch Updates**: Error Garden clusters updated after every 5-10 new errors
- **Pattern Recognition Trigger**: ML clustering runs when sufficient new data accumulated

### Integration with Other Systems

#### Error Garden
- **Primary Recipient**: All error data flows into Error Garden
- **Continuous Feed**: Real-time error transmission enables dynamic adaptation

#### Adaptive Tutoring System
- **Proficiency Calculation**: Grading scores contribute to overall proficiency level
- **ZPD Monitoring**: Accuracy percentages determine if learner is in ZPD (60-80%)

#### Chaos Window
- **Real-Time Grading**: All Chaos Window responses are graded immediately
- **Feedback Delay**: Feedback shown after session to avoid interrupting flow

### Pedagogical Rationale
Based on **Holistic Feedback** and **Error Harvesting**:
- Multi-dimensional analysis provides complete picture of learner competence
- Pronunciation, grammar, and meaning are interdependent—must be assessed together
- Comprehensive error data enables precise remediation
- Automated grading allows for frequent low-stakes practice without teacher bottleneck

### User Experience Flow

**During Task:**
1. Learner speaks or writes in response to prompt
2. System processes output (happens in background, typically 2-5 seconds)
3. No immediate feedback during Chaos Window to maintain flow

**After Task:**
1. Learner sees unified grading report:
   - Overall score (e.g., 72/100)
   - Breakdown by dimension (Pronunciation: 78, Grammar: 65, Semantics: 82)
   - Specific errors highlighted in their response
   - Suggested areas to practice
2. Errors automatically added to Error Garden
3. Learner can choose to view detailed feedback or continue

### Success Metrics
- Grading accuracy (agreement with human raters: target >85%)
- Processing speed (time from submission to grading: target <5 seconds)
- Error detection precision (correctly identified errors / total flagged: target >90%)
- Error detection recall (correctly identified errors / total actual errors: target >80%)
- Learner trust in grading (self-reported: target >75% trust system grades)

### Technical Challenges & Solutions

**Challenge**: Real-time processing at scale
**Solution**: Cloud-based parallel processing, model optimization for speed

**Challenge**: Handling learner speech with heavy L1 accents
**Solution**: Fine-tuning Whisper on Romanian learner corpus

**Challenge**: Distinguishing errors from creative language use
**Solution**: Semantic analyzer checks meaning—if meaning is clear, "error" may be acceptable variation

**Challenge**: Providing actionable feedback without overwhelming learners
**Solution**: Feedback Aggregator prioritizes top 3 errors, hides minor issues

---

## Proficiency Tracker ✅ IMPLEMENTED

**Implementation Status:** 100% Complete
**Deployed:** January 25, 2026
**Route:** `/proficiency-tracker`

### Implementation Status

✅ **Implemented:**
- Overall proficiency scoring (1-10 scale mapping to A1-C2)
- Skill-specific tracking (listening, reading, speaking, writing)
- Proficiency history tracking over time with real data from session history
- Enhanced timeline chart visualization
- Skill progress bars with detailed breakdowns and skill insights
- Proficiency calculation based on grading scores
- Initial proficiency assessment during onboarding
- Dashboard integration with current proficiency display
- Refresh capability for real-time data updates
- Trend analysis

🟡 **Post-MVP:**
- Advanced proficiency prediction algorithms
- Weekly summary notifications
- Correlation with external CEFR test validation

### Purpose
The Proficiency Tracker is a **continuous assessment system** that monitors learner progress across the CEFR levels (A1-C2) and individual skill areas, providing real-time proficiency estimates that drive adaptive content delivery.

### Core Concept
Unlike traditional language exams that provide a single proficiency snapshot, the Proficiency Tracker:
- Continuously updates proficiency estimates based on every production task
- Tracks proficiency separately for listening, reading, speaking, and writing
- Uses both accuracy data (from Grading Engine) and behavioral data (time spent, completion rates)
- Provides granular proficiency within each CEFR level (e.g., "B1.3" on a 1-10 scale where B1 = 4-5)

### Proficiency Calculation

#### Input Data Sources
1. **Grading Engine Scores**: Accuracy on production tasks
2. **Error Garden Data**: Error frequency and patterns
3. **Comprehension Checks**: Performance on listening/reading comprehension questions
4. **Behavioral Metrics**: Time to complete tasks, session frequency, content difficulty engaged with
5. **Self-Assessment**: Optional learner self-ratings

#### Calculation Algorithm

**Overall Proficiency (1-10 Scale)**
```
1-2  = A1 (Beginner)
3-4  = A2 (Elementary)
5-6  = B1 (Intermediate)
7-8  = B2 (Upper Intermediate)
9-10 = C1-C2 (Advanced/Proficient)
```

**Weighted Components:**
- Production accuracy (speaking + writing): 40%
- Comprehension accuracy (listening + reading): 30%
- Error Garden patterns (reduction in errors over time): 20%
- Behavioral engagement (consistency, challenge-seeking): 10%

**Skill-Specific Proficiency:**
Each of the four skills (listening, reading, speaking, writing) is tracked separately with the same 1-10 scale.

**Example Profile:**
```
Overall Proficiency: 5.2 (B1)
  - Listening: 6.1 (B1+)
  - Reading: 5.8 (B1)
  - Speaking: 4.7 (A2+)
  - Writing: 4.5 (A2+)
```

#### Proficiency Advancement Criteria
To advance from one level to the next, learner must demonstrate:
- **Accuracy**: 80%+ accuracy on level-appropriate tasks across 15+ production samples
- **Consistency**: Sustained performance over 2+ weeks
- **Range**: Proficiency demonstrated across multiple content types and contexts
- **Error Reduction**: Top 3 error clusters for current level reduced to <30% frequency

### Visual Representation (User-Facing)

#### Dashboard Display
- **Overall Level Badge**: Large visual badge (e.g., "B1 - Intermediate")
- **Skill Breakdown**: Four progress bars showing individual skill levels
- **Progress Over Time**: Line graph showing proficiency trajectory over weeks/months
- **Next Milestone**: "You're 73% of the way to B2!"
- **Recent Achievements**: "You've improved speaking proficiency by 0.3 points this week!"

#### Proficiency Insights
- **Strengths**: "Your listening comprehension is ahead of other skills—great work!"
- **Areas to Focus**: "Writing is lagging. Try more Chaos Window sessions with written responses."
- **Predicted Timeline**: "At your current pace, you'll reach B2 in approximately 8 weeks."

### Integration with Other Systems

#### Adaptive Tutoring System
- **Content Difficulty**: Proficiency level determines which content is at-level, below-level, or above-level
- **Mode Recommendations**: System suggests Deep Fog when proficiency is plateauing
- **Skill Balancing**: If writing lags behind other skills, system assigns more writing tasks

#### Error Garden
- **Proficiency Impact**: High error frequency lowers proficiency score
- **Fossilization Penalty**: Fossilized errors temporarily reduce proficiency to motivate remediation

#### Chaos Window
- **Difficulty Calibration**: Content difficulty adjusted to maintain learner in ZPD based on proficiency
- **ZPD Targeting**: System aims for 60-80% accuracy, which corresponds to ZPD for learner's proficiency level

### Pedagogical Rationale
Based on **CEFR Standards** and **Continuous Assessment**:
- Proficiency is not static—it fluctuates based on context, topic, and task type
- Continuous assessment provides more accurate proficiency estimate than single test
- Skill-specific tracking honors the fact that learners develop unevenly across skills
- Transparent proficiency tracking motivates learners by showing tangible progress

### User Experience Flow

**Onboarding:**
1. New learner completes diagnostic assessment (speaking, writing, listening, reading tasks)
2. System generates initial proficiency estimate
3. Learner sees starting proficiency dashboard

**Ongoing:**
1. After each production task, proficiency is recalculated
2. Learner sees updated proficiency on dashboard (updates are subtle, not intrusive)
3. Milestone achievements trigger celebrations ("You've reached B1 in speaking!")

**Weekly Summary:**
- Learner receives weekly email/notification with proficiency progress
- Shows proficiency change over the week
- Highlights which activities contributed most to progress

### Success Metrics
- Proficiency estimate accuracy (correlation with external CEFR tests: target >0.85)
- Learner awareness (% of learners who can accurately describe their proficiency)
- Motivation impact (do proficiency updates correlate with increased engagement?)
- Prediction accuracy (how accurately does system predict time to next level?)

---

## Additional Features (Brief Overview)

### Playlist Roulette
- **Purpose**: Curated content playlists with randomized playback
- **Function**: Learners can create or subscribe to thematic playlists (e.g., "Romanian Cooking Shows," "Political Debates"), system randomizes playback order
- **Integration**: Works within Chaos Window for structured randomness

### Audio Processor
- **Purpose**: Pronunciation feedback system
- **Function**: Analyzes learner speech for pronunciation accuracy, provides visual feedback (waveform comparisons, phoneme highlighting)
- **Integration**: Part of Grading & Harvesting Engine, feeds into Error Garden

### Proficiency-Scaled Content (1-10 System)
- **Purpose**: Ensures all content is tagged with difficulty level
- **Function**: Content database includes metadata for difficulty (1-10 scale aligned with A1-C2)
- **Integration**: Adaptation Engine uses difficulty tags to select appropriate content

---

## System Integration Overview

```
[Learner Interaction]
        ↓
[Grading & Harvesting Engine]
        ↓
[Error Garden] ←→ [Proficiency Tracker]
        ↓
[Adaptive Tutoring System]
   ├→ Adaptation Engine (Rules)
   ├→ Knowledge Base (Pedagogy)
   └→ Conversational Core (AI)
        ↓
[Content Delivery]
   ├→ Deep Fog Mode
   ├→ Chaos Window
   ├→ Workshop
   └→ Mystery Shelf
        ↓
[Learner Interaction] (Cycle Continues)
```

---

## Conclusion

This document provides detailed specifications for each major component of ChaosLimbă. Each feature is designed to operationalize the core philosophy of **Structured Chaos**: embracing productive confusion, harvesting errors, respecting learner agency, and adapting dynamically to individual needs.

**Next Steps:**
1. Content curation at scale (50+ hours target — currently 15.8 hours / 1080 items)
2. Beta testing with pilot learners
3. Iteration based on real-world usage data

---

**Document Metadata**
- Version: 3.2 - February 2026 Audit
- Last Updated: February 9, 2026
- Author: ChaosLimbă Development Team
- Status: Living Document (will be updated as features evolve)

---

## Summary: MVP Status

🎉 **MVP ~99.5% Complete - Ready for Beta**

**Key Achievements:**
- ✅ All 11 core features implemented at 100% (including Workshop + Adaptation Engine)
- ✅ Complete AI ensemble (10 components) deployed on FREE APIs
- ✅ 3-tier fossilization Adaptation Engine with lazy measurement + tier 3 exit logic
- ✅ Workshop with 7 challenge types, destabilization-tier awareness, challenge validation
- ✅ Smart content selection with dynamic fossilization weights
- ✅ Chat-based Chaos Window with fossilization-aware tutor + session summary
- ✅ $0-5/month hosting cost (72-100% under budget!)
- ✅ Onboarding system complete
- ✅ Multi-modal content support (audio, text) — 1080 items, 15.8 hours
- ✅ Error tracking with fossilization detection, intervention protocols, L1 transfer, context-aware audio
- ✅ Proficiency tracking with real data, trends, skill insights, enhanced chart
- ✅ Mystery Shelf with AI exploration, TTS review, search/sort/filter, stats, duplicate detection
- ✅ Deep Fog with CEFR filtering, fog depth, search/sort, session summary
- ✅ 8 color themes with light/dark modes (16 variants)
- ✅ 40 production API routes, 16 pages, 15 DB tables

**Focus Areas for Next Phase:**
1. Content curation at scale (50+ hours) — biggest remaining lift (currently 15.8hrs)
2. Beta testing with pilot learners
3. SPAM-C dialectal/pragmatic analysis (when user base grows)
