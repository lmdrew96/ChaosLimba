# ChaosLimbă CLI Scripts Reference

Quick reference for all command-line tools available in the project.

---

## Content Management

### Generate AI Content
**Script:** `scripts/generate-content.ts`

Generates Romanian learning content using AI (Groq) + Google TTS.

```bash
# Interactive single generation
npx tsx scripts/generate-content.ts generate

# Generate with options
npx tsx scripts/generate-content.ts generate --level B1 --topic "Romanian holidays"

# Batch generate multiple items
npx tsx scripts/generate-content.ts batch --level B2 --count 10

# Batch with theme
npx tsx scripts/generate-content.ts batch --level B1 --count 5 --theme "technology"

# Show topic suggestions
npx tsx scripts/generate-content.ts topics
npx tsx scripts/generate-content.ts topics --level B1

# Check content statistics
npx tsx scripts/generate-content.ts stats
```

**Options:**
- `--level` - CEFR level: A1, A2, B1, B2, C1, C2
- `--topic` - Content topic
- `--count` - Number of items (batch mode)
- `--theme` - Theme variation (batch mode)
- `--yes` / `-y` - Skip confirmation prompts
- `--dry-run` - Preview without generating

---

### Curate Content (Manual)
**Script:** `scripts/curate.ts`

Add content manually to the database (text or audio with existing URLs).

```bash
# Interactive add
npx tsx scripts/curate.ts add
npm run curate:add

# Add audio content
npx tsx scripts/curate.ts audio

# Add text content
npx tsx scripts/curate.ts text

# Show statistics
npx tsx scripts/curate.ts stats
npm run curate:stats

# List content
npx tsx scripts/curate.ts list
npx tsx scripts/curate.ts list --level B1 --type audio --limit 10

# Batch import from JSON
npx tsx scripts/curate.ts batch content.json
npx tsx scripts/curate.ts batch content.json --dry-run
```

**Batch JSON format** (see `scripts/sample-batch.json` for a complete example):
```json
[
  {
    "type": "text",
    "title": "My Article",
    "level": "B1",
    "topic": "Culture",
    "textContent": "Romanian text here...",
    "creator": "Author Name",
    "license": "Creative Commons"
  }
]
```

---

## Database Management

### Drizzle ORM Commands

```bash
# Generate migration files
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

---

### Run SQL Migration
**Script:** `scripts/run-migration.js`

Run raw SQL migration files against the database. Splits multi-statement SQL files and executes each statement sequentially.

```bash
node scripts/run-migration.js path/to/migration.sql
```

**Note:** Prefer `npm run db:push` for schema changes. Use this only for custom SQL migrations.

---

### Seed Scripts

```bash
# Seed sample content (6 items)
npx tsx scripts/seed-content.ts

# Seed grammar feature map (CEFR reference)
npx tsx scripts/seed-grammar-features.ts

# Seed curated content (tutor messages, minimal pairs)
npx tsx scripts/seed-curated-content.ts

# Backfill language features on existing content
npx tsx scripts/backfill-language-features.ts
```

---

## Audio Management

### Generate Podcast Audio
**Script:** `scripts/generate-podcast-audio.ts`

```bash
npm run generate:podcasts
npx tsx scripts/generate-podcast-audio.ts
```

### Generate ElevenLabs Audio Content
**Script:** `scripts/generate-elevenlabs-content.ts`

Generates A1-A2 audio content using ElevenLabs TTS API with word-level timestamps. Outputs audio files to `generated-audio/` directory.

```bash
npx tsx scripts/generate-elevenlabs-content.ts
```

**Requires:** `ELEVENLABS_API_KEY` in `.env.local`

### Upload to R2
**Script:** `scripts/upload-to-r2-s3.ts`

```bash
npx tsx scripts/upload-to-r2-s3.ts <local-file> <r2-key>
```

### Update Audio URLs
**Script:** `scripts/update-audio-urls-to-r2.ts`

Migrate audio URLs to R2 storage.

```bash
npx tsx scripts/update-audio-urls-to-r2.ts
```

### Update Audio Titles
**Script:** `scripts/update-audio-titles.ts`

Replaces generic audio titles with Romanian question-based titles (e.g., "Despre ce vorbește?", "Ce auzi?") for ElevenLabs audio items.

```bash
npx tsx scripts/update-audio-titles.ts
```

### Update Content Titles
**Script:** `scripts/update-content-titles.ts`

Uses Groq AI (Llama 3.3 70B) to generate descriptive English titles for content items based on their text and topic.

```bash
npx tsx scripts/update-content-titles.ts
```

### Check Audio URLs
**Script:** `scripts/check-audio-urls.ts`

Verify all audio URLs are accessible.

```bash
npx tsx scripts/check-audio-urls.ts
```

### TTS Text Generators (Python)
**Directory:** `scripts/tts/`

Python scripts that generate Romanian text content organized by CEFR level, used as input for TTS generation pipelines.

```bash
# Generate CSV from all level scripts
python scripts/tts/generate_csv.py

# Individual level scripts (imported by generate_csv.py)
# a1_texts.py, a2_texts.py, b1_texts.py, b2_c1_texts.py
```

---

## AI Component Verification

### Verify All AI Components
**Script:** `scripts/verify-all-components.ts`

Tests all 10 AI ensemble components.

```bash
npx tsx scripts/verify-all-components.ts
```

### Verify SPAM-B
**Script:** `scripts/verify-spam-b.ts`

```bash
npx tsx scripts/verify-spam-b.ts
```

### Test SPAM-B with Real API
**Script:** `scripts/test-spam-b-with-api.ts`

Tests SPAM-B relevance analysis with live HuggingFace API calls (off-topic detection, on-topic validation, edge cases).

```bash
npx tsx scripts/test-spam-b-with-api.ts
```

**Requires:** `HUGGINGFACE_API_KEY` or `HUGGINGFACE_API_TOKEN` in `.env.local`

---

## Manual Tests

**Directory:** `scripts/manual-tests/`

Quick verification scripts for individual components.

```bash
# Test grammar checking (Claude Haiku 4.5)
npx tsx scripts/manual-tests/test-grammar.ts

# Test Groq speech recognition (Whisper)
node scripts/manual-tests/test-groq-speech.js

# Test R2 upload
node scripts/manual-tests/test-r2-upload.js

# Test Google Cloud TTS (Romanian)
node scripts/test-tts.js
```

---

## Development

### Start Development Server

```bash
pnpm dev             # Starts on http://localhost:5001
```

### Build & Start Production

```bash
npm run build
npm run start
```

### Run Tests

```bash
npm test             # Run all tests
npm run test:watch   # Watch mode
```

### Linting

```bash
npm run lint
```

---

## Other Resources

### Common Voice Import
**Directory:** `scripts/CV upload/`

Contains reference material (screenshot) for importing Common Voice audio data into the content system.

### Sample Batch Import
**File:** `scripts/sample-batch.json`

Example JSON file demonstrating the batch import format for `curate.ts batch` command.

---

## Quick Reference Table

| Task | Command |
|------|---------|
| Generate B1 content | `npx tsx scripts/generate-content.ts generate --level B1` |
| Batch generate 20 items | `npx tsx scripts/generate-content.ts batch --level B2 --count 20` |
| Check content stats | `npx tsx scripts/generate-content.ts stats` |
| Add content manually | `npm run curate:add` |
| Push DB changes | `npm run db:push` |
| Open DB GUI | `npm run db:studio` |
| Verify AI components | `npx tsx scripts/verify-all-components.ts` |
| Run SQL migration | `node scripts/run-migration.js path/to/file.sql` |
| Generate ElevenLabs audio | `npx tsx scripts/generate-elevenlabs-content.ts` |
| Update content titles (AI) | `npx tsx scripts/update-content-titles.ts` |
| Test SPAM-B live | `npx tsx scripts/test-spam-b-with-api.ts` |
| Test grammar checker | `npx tsx scripts/manual-tests/test-grammar.ts` |

---

## Environment Variables Required

For content generation scripts to work, ensure `.env.local` contains:

```bash
# Database
DATABASE_URL=postgres://...

# AI
GROQ_API_KEY=gsk_...

# Google TTS
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
# OR
GOOGLE_TTS_CREDENTIALS_JSON={"type":"service_account",...}

# HuggingFace (SPAM-A/B, pronunciation)
HUGGINGFACE_API_KEY=hf_...

# ElevenLabs (audio generation)
ELEVENLABS_API_KEY=sk_...

# Anthropic (grammar checking)
ANTHROPIC_API_KEY=sk-ant-...

# Cloudflare R2
R2_ENDPOINT=https://...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://...
```

---

## Content Generation Strategy

To reach 50 hours of content:

```bash
# Current: ~15.8 hours (1080 items across all CEFR levels)
# Needed: ~34 more hours

# Fill B1 gap (~5 hours needed)
npx tsx scripts/generate-content.ts batch --level B1 --count 50

# Fill B2 gap (~8 hours needed)
npx tsx scripts/generate-content.ts batch --level B2 --count 80

# Fill C1 gap (~5 hours needed)
npx tsx scripts/generate-content.ts batch --level C1 --count 40

# Fill C2 gap (~3 hours needed)
npx tsx scripts/generate-content.ts batch --level C2 --count 25
```

**Estimated TTS cost:** ~$3-5 for 43 hours of content

---

*Last updated: February 16, 2026*
