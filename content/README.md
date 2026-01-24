# ChaosLimbă Content Storage

This directory contains curated Romanian language learning content organized by media type.

## Directory Structure

```
/content/
├── text/           # Text-based content (articles, stories, blog posts)
├── youtube/        # YouTube video metadata (titles, descriptions, transcripts)
└── README.md       # This file
```

## File Organization

### Hashed Filenames

Content files use **12-character hexadecimal hashes** as filenames (e.g., `0355fb4f26fe.txt`). This naming convention:

- **Prevents filename conflicts** - Hash-based names are unique
- **Enables content-addressable storage** - Same content = same hash
- **Simplifies file management** - No special character handling needed

### Mapping to Database Records

Content files are tracked in the **Neon PostgreSQL database** via the `content_items` table:

```sql
content_items (
  id,                    -- Primary key
  type,                  -- "text" | "youtube" | "audio"
  title,                 -- Human-readable title
  url,                   -- Original source URL (if applicable)
  file_path,             -- Relative path: "content/text/[hash].txt"
  difficulty_level,      -- A1 | A2 | B1 | B2 | C1 | C2
  duration_seconds,      -- Estimated reading/viewing time
  language_features,     -- JSON array of linguistic features
  source_attribution,    -- Author/creator attribution
  created_at             -- Timestamp
)
```

**To find the database record for a file:**
```sql
SELECT * FROM content_items WHERE file_path = 'content/text/0355fb4f26fe.txt';
```

**To find the file for a content item:**
```sql
SELECT file_path FROM content_items WHERE id = 'some-uuid';
```

## Content Types

### 1. Text Content (`/text/`)

**File format:** Plain text (.txt) with UTF-8 encoding

**Usage:**
- Romanian articles, blog posts, short stories
- Used in Deep Fog (immersive reading mode)
- Processed for Mystery Shelf word collection
- Analyzed for difficulty level and linguistic features

### 2. YouTube Content (`/youtube/`)

**File format:** JSON metadata files

**Contents:**
- Video title and description
- Transcript (if available via YouTube captions)
- Channel information
- Linguistic metadata (difficulty, key vocabulary)

**Note:** Videos are embedded via YouTube player (not downloaded) per YouTube ToS

## Adding New Content

### Using the Curation CLI (Recommended)

The project includes a CLI tool for adding content:

```bash
# Add text content
npm run curate:add

# Add YouTube video
npm run curate:video

# View statistics
npm run curate:stats

# List all content
npm run curate:list
```

The CLI tool (`scripts/curate.ts`) handles:
- ✅ Downloading/fetching content
- ✅ Generating hashed filenames
- ✅ Creating database records
- ✅ Analyzing difficulty level
- ✅ Extracting linguistic features
- ✅ Saving files to appropriate directories

### Manual Addition (Not Recommended)

If adding files manually, you must:

1. **Generate hash:** Use first 12 characters of SHA-256 hash of content
2. **Save file:** Save to appropriate subdirectory with `.txt` or `.json` extension
3. **Create database record:** Insert into `content_items` table with correct metadata
4. **Set permissions:** Ensure file is readable (644)

⚠️ **Manual addition is error-prone** - Use the CLI tool whenever possible.

## Content Curation Goals

**MVP Target:** 50+ hours of curated Romanian content across proficiency levels

**Current Status:** ~1 hour curated (~5 text items)

**Remaining:** ~49 hours needed

**Distribution Target:**
- A1-A2 (Beginner): 30% (~15 hours)
- B1-B2 (Intermediate): 50% (~25 hours)
- C1-C2 (Advanced): 20% (~10 hours)

**Content Sources:**
- Romanian blogs and news sites
- YouTube channels (Romanian language learning, culture, news)
- Public domain Romanian literature
- Creative Commons articles

## Technical Details

### Hash Generation

Content hashes are generated using:

```typescript
import crypto from 'crypto';

function generateContentHash(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content, 'utf-8')
    .digest('hex')
    .substring(0, 12);
}
```

### File Size Recommendations

- **Text files:** 500-3000 words (optimal for Deep Fog reading sessions)
- **YouTube metadata:** No size limit (transcript can be long)

### Character Encoding

All text files must use **UTF-8 encoding** to support Romanian diacritics:
- ă, â, î, ș, ț (lowercase)
- Ă, Â, Î, Ș, Ț (uppercase)

---

**Last Updated:** January 24, 2026
**Maintained By:** Nae Drew
**Related Scripts:** `/scripts/curate.ts`
