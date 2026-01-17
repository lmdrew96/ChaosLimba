# ChaosLimbă Development Roadmap
**From Ideation to Production CALL Platform**

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Phase 1: Ideation & Foundation](#phase-1-ideation--foundation)
3. [Phase 2: MVP Development](#phase-2-mvp-development)
4. [Phase 3: Production Platform](#phase-3-production-platform)
5. [Phase 4: Scale & Monetization](#phase-4-scale--monetization)
6. [Technical Architecture Evolution](#technical-architecture-evolution)
7. [Risk Mitigation & Contingencies](#risk-mitigation--contingencies)

---

## Project Overview

### Vision
An AI-powered Romanian language learning platform that uses **Structured Chaos** to create optimal learning conditions through productive confusion, error harvesting, and adaptive tutoring.

### Timeline
- **Ideation & Planning**: January 2025
- **MVP Development**: January - August 2025
- **MVP Launch**: Fall 2025 (personal use + Linguistics capstone)
- **Production Platform**: 2026-2027
- **Potential Monetization**: 2027+

### Success Metrics
- **MVP**: 10 hours curated content, 4 core features, functional grading pipeline
- **Production**: 100+ hours content, full AI tutoring, 50+ active users
- **Scale**: 1,000+ users, B2+ proficiency outcomes, sustainable revenue

---

## Phase 1: Ideation & Foundation
**Timeline**: January 2025  
**Status**: ✅ COMPLETE

### 1.1 Problem Definition

**The Gap in Romanian CALL**:
- Duolingo/Babbel: Gamified but not linguistically principled
- Traditional courses: Rigid, prescriptive curricula
- No Romanian-specific tools leveraging modern AI
- Existing platforms fear productive confusion (treat errors as failures)

**User Need (Personal)**:
- Self-teaching Romanian for 4 years
- ~80% reading comprehension, but output fossilization
- Need tool to force output, harvest errors, break plateaus
- Want interlanguage-aware system that adapts to weaknesses

### 1.2 Pedagogical Foundation

**Core Theory**: Structured Chaos
- **Productive Confusion**: Controlled disequilibrium within ZPD
- **Error Harvesting**: Errors are data, not failures
- **Exploratory Agency**: User-driven discovery > prescriptive paths
- **Adaptive Not Prescriptive**: System responds to interlanguage state

**Theoretical Grounding**:
- Interlanguage Theory (Selinker, 1972): Learner language as unique system
- Output Hypothesis (Swain, 1985): Production drives development
- Cognitive Disequilibrium (Piaget): Optimal learning at edge of comfort
- Chaos/Complexity Theory (Larsen-Freeman, 1997): Non-linear development

**Input-Driven Progressive Output Model**:
- A1-A2 (70% input, 30% output): Build representations first
- B1-B2 (50/50): Balanced development
- C1+ (30% input, 70% output): Production pressure reorganizes fossilized patterns

### 1.3 System Architecture Conception

**Key Insight**: Separate diagnostic from tutoring
- **Engine 1**: Grading & Harvesting (parallel processors, unified report)
- **Engine 2**: Adaptive Tutoring (rules-based → AI reasoning)

**Why Dual Architecture?**
- Grading requires precision (ML models, acoustic analysis)
- Tutoring requires creativity (LLM reasoning)
- Separation allows independent iteration

### 1.4 Feature Ideation

**Brainstormed 10+ features, prioritized 4 for MVP**:

1. **Chaos Window** (Core): Randomized content + AI interaction
2. **Error Garden** (Core): Pattern tracking + visualization
3. **Deep Fog Mode** (Core): Passive immersion at +1-3 CEFR
4. **Adaptive Tutoring** (Core): AI responds to error patterns

**Deferred to v2.0+**:
- Mystery Shelf (unknown word collection)
- Full fossilization intervention protocols
- Community features (shared Error Gardens, peer challenges)
- Gamification (achievements, streaks)

### 1.5 Content Strategy

**Realization**: Can't build curriculum AND platform simultaneously

**Decision**: Curate existing content
- 10 hours target for MVP (5 video, 3 text, 2 audio)
- YouTube embeds (ToS compliant, no downloads)
- Articles from Romanian news/blogs
- Tatoeba sentences with audio URLs

**Content Difficulty Philosophy**:
- Auto-rate with linguistic analysis (save manual effort)
- User can override if needed
- Build frequency lists over time for better calibration

### 1.6 Technical Stack Research

**Database Decision**: Neon (Serverless Postgres)
- Free tier: 100 CU-hours/month, 0.5GB per project
- Database branching for dev/test/prod
- Scale-to-zero billing (perfect for MVP)
- **Rejected**: Supabase (past issues with realtime, project limits)

**Model Hosting**:
- Training: RunPod GPU Pods ($0.35-0.50/hr RTX 4090)
- Inference MVP: HuggingFace Inference API (free tier)
- Inference Production: RunPod Serverless (pay-per-use)
- Local testing: M3 MacBook

**Speech Recognition Decision**:
- Pre-trained Romanian Whisper models EXIST
- gigant/whisper-medium-romanian (recommended - Common Voice trained)
- Fine-tune if accuracy insufficient
- **No need to train from scratch** (huge time saver)

### 1.7 Documentation

**Created 4 core docs** (foundation for all future work):
- `ChaosLingua-Philosophy-Goal-Synthesis.md`: Vision, theory, pedagogy
- `system-architecture-description.md`: Dual engine, data flow
- `chaoslimba-curriculum-framework.md`: 3-stage progression, SLA theory
- `feature-specifications.md`: Detailed specs for all features

---

## Phase 2: MVP Development
**Timeline**: January - August 2025  
**Status**: 🔄 IN PROGRESS

### 2.1 MVP Scope Definition

**Four Core Features** (user insisted on keeping all):
1. Chaos Window: Timer-based randomized content + basic AI
2. Error Garden: Log mistakes, simple frequency tracking
3. Deep Fog Mode: Passive immersion player
4. Adaptive Tutoring: Rule-based responses → evolving to DeepSeek-R1

**MVP Content Target**: 10 hours quality A1-A2 content
- 5 hours video (YouTube embeds)
- 3 hours text (articles, stories)
- 2 hours audio (Tatoeba sentences)

**Features CUT for MVP**:
- Advanced ML pattern clustering (use simple error counting)
- Full DeepSeek-R1 reasoning (start rule-based)
- Mystery Shelf
- Fossilization intervention protocols
- Advanced proficiency tracking (just accuracy per session + progress graph)

**Why This Scope?**
- Demonstrates core philosophy (productive confusion + error harvesting)
- Functional for personal use (primary goal)
- Enough for Linguistics capstone project
- Foundation for future expansion

### 2.2 Model Training Pipeline

**Priority Order**:
1. ✅ **Grammar Correction** (COMPLETED - BLEU 68.92)
   - Fine-tuned T5/BART model
   - Trained on Romanian grammar error corpus
   - v1 functional and tested

2. 🔄 **Pronunciation Analysis** (NEXT)
   - Acoustic feature extraction
   - Compare learner to native speaker patterns
   - Rate accuracy on phoneme level

3. **Speech Recognition** (Pre-trained available)
   - Start with gigant/whisper-medium-romanian
   - Fine-tune on learner speech if needed
   - Fallback: Use Google Speech API for MVP

4. **Semantic Analysis** (Lowest priority for MVP)
   - Romanian BERT for meaning assessment
   - Can defer to production if time-constrained

**Training Resources**:
- RunPod GPU Pods for training sessions
- HuggingFace for model hosting
- Local M3 MacBook for prototyping/testing

### 2.3 Content Curation Process

**Phase 2.3.1**: Build Tooling (✅ COMPLETE)
- `curate_content.py`: YouTube + article scraper
- `difficulty_rater.py`: Auto CEFR assignment
- `tatoeba_harvester.py`: Bulk Romanian sentence download

**Phase 2.3.2**: Content Harvesting (January - March 2025)
- ✅ Audio: Tatoeba harvester (500+ sentences, 2 hours)
- 🔄 Video: YouTube curation (cooking, vlogs, culture, TVR)
- 🔄 Text: News articles, blogs, social media posts

**Phase 2.3.3**: Quality Control (March - April 2025)
- Manual review of auto-rated content
- Verify audio quality
- Balance CEFR distribution (aim for 60% A1-A2, 30% B1-B2, 10% C1+)

**Content Sources Identified**:
- Video: Romanian YouTube (cooking channels, cultural docs, TVR)
- Text: Adevărul, Digi24, Romanian blogs, RO-stories dataset
- Audio: Tatoeba, Radio România Cultural, audiobooks

### 2.4 Backend Development

**Phase 2.4.1**: Database Setup (April - May 2025)
- Neon PostgreSQL setup
- User profiles table
- Session tracking table
- Error logs table
- Content metadata table
- Progress tracking table

**Phase 2.4.2**: Grading Pipeline (May - June 2025)
- Speech recognition integration (Whisper)
- Pronunciation analyzer integration
- Grammar correction integration
- Unified grading report generation
- Error Garden data population

**Phase 2.4.3**: API Development (June - July 2025)
- FastAPI backend
- User authentication (simple email/password for MVP)
- Content delivery endpoints
- Error logging endpoints
- Progress tracking endpoints

**Tech Stack**:
- Backend: FastAPI (Python)
- Database: Neon PostgreSQL
- Deployment: Render or Railway (free tier)
- ML Inference: HuggingFace Inference API

### 2.5 Frontend Development

**Phase 2.5.1**: UI Framework Selection (May 2025)
- **Options Evaluated**:
  - v0.dev: AI-generated React components
  - Replit: Browser-based IDE with AI
  - Cursor: Agentic development in VSCode
  - Polish existing Cowork prototype

**Decision Pending**: Test each, choose based on:
- Speed of iteration
- Quality of generated code
- Ease of customization
- Your comfort level with the tool

**Phase 2.5.2**: Core Interfaces (June - August 2025)
- Chaos Window interface (content player + timer + AI chat)
- Error Garden dashboard (error categories, patterns, charts)
- Deep Fog Mode player (video/audio/text with unknown marking)
- Basic proficiency tracker (accuracy graph over time)

**Phase 2.5.3**: Polish & Testing (August 2025)
- Responsive design (mobile-friendly)
- Loading states, error handling
- User testing (self + 2-3 friends)
- Bug fixes

**Tech Stack**:
- Frontend: React
- UI Generation: v0/Replit/Cursor (TBD)
- Styling: Tailwind CSS
- State Management: React Context or Zustand

### 2.6 AI Tutoring Integration

**Phase 2.6.1**: Rule-Based Tutoring (June - July 2025)
- Simple if/then logic based on error patterns
- Template responses for common mistakes
- Demonstrates concept for MVP

**Phase 2.6.2**: DeepSeek-R1 Integration (July - August 2025)
- Integrate DeepSeek-R1 API
- Prompt engineering for productive confusion
- Context window management (Error Garden + session history)
- Cost monitoring (stay within free tier if possible)

**Tutoring Modes**:
- Comprehension questions
- Structure-forcing prompts
- Opinion/comparison questions
- Hypothetical scenarios

### 2.7 MVP Testing & Launch

**Phase 2.7.1**: Internal Testing (August 2025)
- Self-testing all features
- Fix critical bugs
- Performance optimization

**Phase 2.7.2**: Beta Testing (September 2025)
- 2-3 Romanian learners test
- Collect feedback
- Prioritize fixes

**Phase 2.7.3**: Capstone Documentation (September - October 2025)
- Write methodology section
- Document results
- Create demo video

**Phase 2.7.4**: MVP Launch (October 2025)
- Deploy to production
- Use for personal learning
- Submit as Linguistics capstone

**Success Criteria**:
- All 4 core features functional
- 10+ hours of content
- Grading pipeline works with 80%+ accuracy
- Error Garden logs and displays patterns
- AI tutor provides coherent responses
- You use it regularly for Romanian practice

---

## Phase 3: Production Platform
**Timeline**: 2026-2027  
**Status**: 📅 PLANNED

### 3.1 Feature Expansion

**Q1 2026: Advanced Error Analysis**
- ML-based pattern clustering (replace simple frequency counting)
- Fossilization detection algorithms
- Interlanguage profiling (phonological, morphological, syntactic, pragmatic)
- Personalized intervention recommendations

**Q2 2026: Mystery Shelf**
- Unknown word collection system
- Spaced repetition for unknowns
- Contextual re-exposure in Chaos Window
- Integration with Error Garden (track vocabulary gaps)

**Q3 2026: Advanced Proficiency Tracking**
- Skill-specific tracking (listening, reading, speaking, writing)
- CEFR placement assessment
- Progress visualization (skill radar charts)
- Advancement criteria automation

**Q4 2026: Community Features**
- Shared Error Gardens (compare patterns with other learners)
- Peer challenges (practice dialogues with other users)
- Leaderboards (opt-in, based on production volume not accuracy)
- Discussion forums (in Romanian, moderated by AI)

### 3.2 Content Expansion

**Goal**: 100+ hours of content across all CEFR levels

**Q1-Q2 2026: B1-B2 Content**
- 30 hours video (documentaries, interviews, TV shows)
- 20 hours text (news, blogs, short stories)
- 10 hours audio (podcasts, audiobooks)

**Q3-Q4 2026: C1-C2 Content**
- 20 hours video (academic lectures, debates)
- 15 hours text (literature, academic articles)
- 5 hours audio (radio programs, expert interviews)

**Content Partnerships** (if possible):
- TVR (Romanian public broadcaster)
- Romanian news outlets (Adevărul, Digi24)
- Romanian authors (short story permissions)

### 3.3 AI Enhancements

**Full DeepSeek-R1 Reasoning**
- Chain-of-thought tutoring
- Socratic questioning
- Adaptive scaffolding based on ZPD
- Error-pattern-informed dialogue

**Advanced Adaptation Engine**
- Automated content sequencing
- ZPD monitoring and adjustment
- Style/register assessment
- Autonomy indicators (when to reduce scaffolding)

**Voice Interaction**
- ElevenLabs TTS for Romanian (realistic pronunciation models)
- Real-time conversation practice
- Pronunciation feedback in-dialogue

### 3.4 Technical Infrastructure Upgrades

**Database Scaling**:
- Upgrade Neon tier or migrate to dedicated Postgres
- Implement caching layer (Redis)
- Optimize queries for 50+ concurrent users

**Model Hosting**:
- Migrate to RunPod Serverless for all inference
- Implement model versioning
- A/B testing infrastructure for model improvements

**Frontend Optimization**:
- Server-side rendering for faster loads
- Progressive Web App (PWA) for offline content
- Mobile apps (React Native or Flutter)

**Backend Enhancements**:
- Microservices architecture (separate grading, tutoring, content services)
- WebSocket for real-time AI interactions
- Analytics pipeline (Mixpanel or custom)

### 3.5 User Acquisition Strategy

**Q1 2026: Soft Launch**
- Friends and family (10-20 users)
- Romanian language learning subreddits
- Romanian expat communities

**Q2-Q3 2026: Beta Program**
- Recruit 50 beta testers
- Collect feedback, iterate
- Build testimonials and case studies

**Q4 2026: Public Launch**
- Product Hunt launch
- Language learning blog posts
- YouTube demos
- Romanian cultural organizations

**Growth Tactics**:
- SEO for "learn Romanian online"
- Content marketing (blog about Romanian language learning)
- Social proof (user success stories)
- Referral program (invite friends, get premium features)

### 3.6 Quality Assurance

**User Testing**:
- Monthly user interviews
- Feature request tracking
- Bug bounty program

**Performance Monitoring**:
- Uptime monitoring (99%+ target)
- Error tracking (Sentry)
- User analytics (session length, feature usage)

**Content Quality**:
- Native speaker review of AI-generated feedback
- Regular content audits
- CEFR calibration checks

---

## Phase 4: Scale & Monetization
**Timeline**: 2027+  
**Status**: 🔮 FUTURE

### 4.1 Monetization Strategy

**Freemium Model**:
- **Free Tier**: 
  - 2 hours content access
  - Basic Error Garden
  - Limited Chaos Window sessions (5/week)
  - Community features

- **Premium ($9.99/month)**:
  - Unlimited content
  - Full Error Garden with ML insights
  - Unlimited Chaos Window
  - Advanced proficiency tracking
  - Voice interaction
  - Priority AI tutoring

- **Pro ($19.99/month)**:
  - Everything in Premium
  - 1-on-1 AI coaching sessions
  - Custom content uploads
  - Export progress data
  - Early access to new features

**Alternative Revenue Streams**:
- B2B sales to universities (site licenses)
- Corporate Romanian language training
- Teacher dashboards (monitor student progress)
- API access for researchers

### 4.2 Platform Expansion

**Multi-Language Support**:
- Apply Structured Chaos methodology to other low-resource languages
- Hungarian, Bulgarian, Czech (similar underserved markets)
- Reuse architecture, train language-specific models

**Institution Partnerships**:
- University of Bucharest (Romanian department)
- Romanian Cultural Institute
- Peace Corps (Romanian language training)

**Research Collaborations**:
- Publish SLA research using platform data
- Partner with linguistics departments
- Open-source anonymized learner corpus

### 4.3 Long-Term Vision

**Become the Standard for Low-Resource CALL**:
- Prove Structured Chaos works at scale
- Open-source architecture for other languages
- Build community of SLA-informed developers

**Personal Goals**:
- PhD research on interlanguage theory + AI
- Teaching position at university
- Consulting for CALL development

---

## Technical Architecture Evolution

### MVP Architecture (2025)

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  Chaos Window  │  Error Garden  │  Deep Fog  │  Tracker    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                          │
│  Auth  │  Content API  │  Error Logging  │  Progress API   │
└─────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│   Grading Pipeline       │  │   Adaptive Tutoring          │
│  - Whisper (Speech Rec)  │  │   - Rule-based responses     │
│  - Pronunciation Model   │  │   - DeepSeek-R1 (basic)      │
│  - Grammar Correction    │  │                              │
│  - Unified Report        │  │                              │
└──────────────────────────┘  └──────────────────────────────┘
                 │                         │
                 └────────────┬────────────┘
                              ▼
                   ┌─────────────────────┐
                   │  Neon PostgreSQL    │
                   │  - Users            │
                   │  - Sessions         │
                   │  - Errors           │
                   │  - Content          │
                   └─────────────────────┘
```

### Production Architecture (2026-2027)

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (PWA + Mobile Apps)              │
│  All MVP features + Mystery Shelf + Community                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                API Gateway (Load Balancer)                   │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌──────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   Content    │   │   Grading        │   │   Tutoring       │
│   Service    │   │   Service        │   │   Service        │
│              │   │                  │   │                  │
│ - Delivery   │   │ - ML Models      │   │ - DeepSeek-R1    │
│ - Curation   │   │ - RunPod         │   │ - Context Mgmt   │
│ - Search     │   │ - Error Garden   │   │ - Scaffolding    │
└──────────────┘   └──────────────────┘   └──────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                   ┌─────────────────────┐
                   │  Database Cluster   │
                   │  - Postgres (main)  │
                   │  - Redis (cache)    │
                   │  - S3 (content)     │
                   └─────────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Analytics Pipeline │
                   │  - User metrics     │
                   │  - Model perf       │
                   │  - A/B tests        │
                   └─────────────────────┘
```

---

## Risk Mitigation & Contingencies

### Technical Risks

**Risk 1: Model Training Fails**
- **Mitigation**: Use pre-trained models (Whisper exists for Romanian)
- **Contingency**: Fall back to rule-based systems or external APIs
- **Status**: Grammar model ✅ trained, Whisper ✅ available

**Risk 2: Hosting Costs Exceed Budget**
- **Mitigation**: Start with free tiers, scale gradually
- **Contingency**: Apply for student credits (RunPod, AWS Educate)
- **Threshold**: If costs >$50/month, pause scaling and reassess

**Risk 3: Database Performance Issues**
- **Mitigation**: Optimize queries, implement caching
- **Contingency**: Migrate to more robust hosting if Neon insufficient
- **Threshold**: If query latency >500ms, investigate scaling

### Content Risks

**Risk 4: Insufficient Content by MVP Deadline**
- **Mitigation**: Tatoeba harvester gets 2 hours instantly
- **Contingency**: Reduce target to 8 hours if needed (still viable)
- **Threshold**: Must have at least 5 hours for functional demo

**Risk 5: Copyright Issues with Curated Content**
- **Mitigation**: YouTube embeds allowed, Tatoeba is CC-BY
- **Contingency**: Focus on Creative Commons and public domain sources
- **Policy**: Always check licenses, maintain attribution records

### Product Risks

**Risk 6: Users Don't Understand "Structured Chaos"**
- **Mitigation**: Onboarding tutorial explaining philosophy
- **Contingency**: Rebrand as "Adaptive Immersion" if needed
- **Testing**: Get feedback from 5 users in beta

**Risk 7: AI Tutoring Not Helpful**
- **Mitigation**: Extensive prompt engineering and testing
- **Contingency**: Improve rules-based system if LLM unreliable
- **Threshold**: If <70% of AI responses rated "helpful", revise approach

### Timeline Risks

**Risk 8: MVP Not Ready by Fall 2025**
- **Mitigation**: Aggressive prioritization (core features only)
- **Contingency**: Use prototype version for capstone, iterate post-graduation
- **Checkpoint**: June 2025 - assess if on track, cut features if needed

**Risk 9: Capstone Requirements Change**
- **Mitigation**: Regular check-ins with advisor
- **Contingency**: Adjust scope to meet new requirements
- **Flexibility**: MVP is functional regardless of capstone status

### Personal Risks

**Risk 10: ADHD/Time Management Issues**
- **Mitigation**: Use Controlled Chaos v4 for task management
- **Contingency**: Reduce scope, focus on what's achievable
- **Support**: Regular check-ins with Claude, peer mentor accountability

**Risk 11: Burnout**
- **Mitigation**: Break work into 2-week sprints, celebrate wins
- **Contingency**: Take break if needed, resume when ready
- **Red Flags**: If not coding for 2+ weeks, reassess commitment

---

## Key Milestones & Deliverables

### Q1 2025 (January - March)
- ✅ Philosophy and architecture docs
- ✅ Content curation tooling
- ✅ Grammar model training
- 🔄 10 hours content harvested
- 🔄 Pronunciation model training

### Q2 2025 (April - June)
- Database setup
- Backend API development
- Frontend UI framework selection
- Grading pipeline integration
- 5 hours additional content

### Q3 2025 (July - September)
- Frontend development (all 4 core features)
- AI tutoring integration
- Internal testing
- Beta testing with 2-3 users
- Bug fixes and polish

### Q4 2025 (October - December)
- MVP launch
- Capstone project submission
- Personal use and iteration
- Plan for production phase

### 2026
- Feature expansion (Mystery Shelf, advanced Error Garden)
- Content expansion (100+ hours)
- User acquisition (50+ users)
- Infrastructure scaling

### 2027+
- Monetization launch
- Platform expansion (multi-language)
- Research collaborations
- Sustainable operation

---

## Success Definitions

### MVP Success (Fall 2025)
✅ All 4 core features work  
✅ 10+ hours quality content  
✅ Grading pipeline 80%+ accurate  
✅ Personal use case satisfied  
✅ Capstone project accepted  

### Production Success (2026)
✅ 50+ active users  
✅ 100+ hours content  
✅ Full AI tutoring functional  
✅ Error Garden ML clustering  
✅ Positive user feedback  

### Scale Success (2027+)
✅ 1,000+ users  
✅ Sustainable revenue  
✅ B2+ proficiency outcomes  
✅ Published SLA research  
✅ Partnerships established  

---

## Conclusion

ChaosLimbă is a **2-3 year journey** from concept to sustainable platform. The MVP (Fall 2025) demonstrates viability and serves your personal learning + capstone needs. Production (2026-2027) scales the concept and validates the Structured Chaos methodology with real users. Future expansion (2027+) brings monetization and potential multi-language platform.

**Key Principles**:
- ✅ Ship MVP before perfecting
- ✅ User feedback drives iteration
- ✅ Pedagogical integrity > feature bloat
- ✅ Sustainable pacing (avoid burnout)
- ✅ Document everything (future PhD research)

**Next Immediate Actions**:
1. Finish content harvesting (Tatoeba + YouTube)
2. Train pronunciation model
3. Set up Neon database
4. Choose frontend framework and start building
5. Integrate grading pipeline

---

*Document Version: 1.0*  
*Last Updated: January 2025*  
*Author: Nae (ChaosLimbă Creator)*
