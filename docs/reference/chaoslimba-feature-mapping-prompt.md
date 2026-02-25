# ChaosLimbă: Content-to-Grammar Feature Mapping Migration

## Goal

Create a migration script that tags every `content_items` row in the Neon Postgres database with the correct `feature_key` values from the `grammar_feature_map` table. This fixes a coverage gap — the app's coverage report cross-references these two tables, but right now almost no content items have feature keys in their `language_features` jsonb column.

## Context

**Database:** Neon Postgres (connection string is in the project's `.env` as `DATABASE_URL`)

**Two tables matter:**

1. `grammar_feature_map` — 31 rows defining grammar/vocabulary features with `feature_key` identifiers like `present_tense_a_fi`, `vocab_food`, `definite_article`, etc. Each has a `cefr_level`, `category`, and `description`.

2. `content_items` — 100+ rows of learning content (audio and text types). Each has a `language_features` jsonb column that currently contains:
   - **Audio items:** Only `wordTimestamps` (array of `{word, start, end}` objects) — NO grammar feature references
   - **Text items:** A `grammar` array with Romanian-language descriptors like `"a fi"`, `"prezentul simplu"` — these do NOT match the `feature_key` format and aren't picked up by the coverage report

**The coverage report** (`cl_coverage_report` in the MCP) checks whether `content_items.language_features` contains any of the `feature_key` strings from `grammar_feature_map`. Right now it shows 6% coverage (2 out of 31 features have content). The actual content DOES demonstrate these features — it's just not tagged.

## What the Script Should Do

### Step 1: Fetch all data

- Query all rows from `grammar_feature_map` (31 features with their `feature_key`, `feature_name`, `cefr_level`, `category`, `description`)
- Query all rows from `content_items` (get `id`, `type`, `title`, `topic`, `text_content`, `transcript`, and `language_features`)

### Step 2: Reconstruct text for each content item

- **Text items:** Use the `text_content` field directly
- **Audio items:** Reconstruct the full text by joining all `word` values from the `language_features.wordTimestamps` array (e.g., `"Bună! Mă numesc Maria. Sunt din România."`)

### Step 3: Analyze each item against the feature map

For each content item, determine which `feature_key` values are demonstrated in its text. Use the Anthropic API (Claude) to do this analysis.

**Prompt structure for each item (or batch of items):**

```
You are a Romanian language teaching expert. Given a short Romanian text and a list of grammar/vocabulary features, identify which features are clearly demonstrated in the text.

RULES:
- Only tag a feature if it is CLEARLY present — not just tangentially related
- A verb conjugation feature requires the actual conjugated form to appear
- A vocabulary domain feature requires 2+ words from that domain
- Be conservative — false negatives are better than false positives
- Return ONLY the matching feature_key values as a JSON array

FEATURES:
[insert the 31 features with their feature_key, feature_name, and description]

TEXT: "[reconstructed text]"
TITLE: "[title]"  
TOPIC: "[topic]"

Return a JSON array of matching feature_keys, e.g.: ["present_tense_a_fi", "vocab_food", "basic_prepositions"]
```

**Batching strategy:** Send 5-10 content items per API call to reduce costs/time. Structure each batch so Claude returns a JSON object keyed by content item ID.

### Step 4: Write the feature keys back to the database

For each content item, UPDATE the `language_features` jsonb column to ADD a `grammarFeatures` key containing the array of matched feature_keys. **Do NOT overwrite existing data** — preserve `wordTimestamps`, `grammar`, `vocabulary`, `structures`, and any other existing keys.

Example of the final jsonb structure for an audio item:

```json
{
  "wordTimestamps": [...existing timestamps...],
  "grammarFeatures": ["present_tense_a_fi", "present_tense_a_avea", "imi_place_construction", "basic_prepositions"]
}
```

Example for a text item:

```json
{
  "grammar": ["a fi", "a avea"],
  "structures": [],
  "vocabulary": { "keywords": [...], "requiredVocabSize": 200 },
  "grammarFeatures": ["present_tense_a_fi", "present_tense_a_avea", "vocab_family"]
}
```

### Step 5: Verify

After all updates, run a coverage check query to confirm the improvement:

```sql
SELECT 
  gfm.feature_key,
  gfm.feature_name,
  COUNT(ci.id) as content_count
FROM grammar_feature_map gfm
LEFT JOIN content_items ci 
  ON ci.language_features::text LIKE '%' || gfm.feature_key || '%'
GROUP BY gfm.feature_key, gfm.feature_name
ORDER BY content_count DESC;
```

Print a summary showing before/after coverage stats.

## Technical Requirements

- **Language:** TypeScript or Node.js (this is a Next.js project)
- **Database client:** Use whatever ORM/client the project already uses (likely Prisma or `@neondatabase/serverless` or `pg`) — check the existing codebase
- **Anthropic API:** Use the `@anthropic-ai/sdk` package. The API key should be in `.env` as `ANTHROPIC_API_KEY`. Use `claude-sonnet-4-5-20250514` model for cost efficiency.
- **Run as:** A standalone script (e.g., `scripts/migrate-feature-tags.ts`) that can be executed once via `npx tsx scripts/migrate-feature-tags.ts`
- **Error handling:** If an API call fails, retry up to 3 times with exponential backoff. Log failures and continue with remaining items.
- **Dry run mode:** Add a `--dry-run` flag that prints proposed changes without writing to the database
- **Rate limiting:** Add a small delay between API calls (1-2 seconds) to avoid rate limits

## Important Notes

- The `grammarFeatures` key name matters — check if the app's frontend or coverage report logic already looks for a specific key name in `language_features`. If so, use that exact key name. Search the codebase for references to `language_features` to confirm.
- Some audio items are duplicates (same text, different recordings/voices). They should get the same tags, which will happen naturally since the analysis is text-based.
- The 31 features span A1 and A2 CEFR levels. All current content is at difficulty 1.5 (roughly A1), so most A2 features may have 0 matches — that's expected and correct.
