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

**Batch JSON format:**
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

### Check Audio URLs
**Script:** `scripts/check-audio-urls.ts`

Verify all audio URLs are accessible.

```bash
npx tsx scripts/check-audio-urls.ts
```

---

## AI Component Verification

### Verify All AI Components
**Script:** `scripts/verify-all-components.ts`

Tests all 7 AI ensemble components.

```bash
npx tsx scripts/verify-all-components.ts
```

### Verify SPAM-B
**Script:** `scripts/verify-spam-b.ts`

```bash
npx tsx scripts/verify-spam-b.ts
```

---

## Development

### Start Development Server

```bash
npm run dev          # Starts on http://localhost:5001
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
# Current: ~7 hours (mostly A1/A2)
# Needed: ~43 more hours

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

*Last updated: February 2026*
