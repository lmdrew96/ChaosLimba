# ChaosLimbă MCP Server Expansion

## Context
The MCP server at `~/Projects/chaoslimba-mcp-server` currently has 4 tool files exposing 7 tools, but the database has 16 tables. We need to add tools for the 11 untapped tables so Claude.ai can audit and analyze the full learning platform.

## Repo Structure (DO NOT change existing files except index.ts for imports)
```
src/
  index.ts          ← Add new imports + register calls here
  db.ts             ← Shared pg pool (reuse `query` function)
  cefr.ts           ← CEFR helpers (reuse if needed)
  tools/
    schema.ts       ← cl_get_schema (existing)
    grammar.ts      ← cl_get_grammar_map, cl_get_prerequisite_chain, cl_coverage_report (existing)
    content.ts      ← cl_get_content (existing)
    errors.ts       ← cl_get_error_patterns, cl_get_adaptation_summary (existing)
```

## Pattern to Follow (from errors.ts)
```typescript
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { query } from '../db.js';

export function registerXxxTools(server: McpServer): void {
  server.registerTool(
    'cl_tool_name',
    {
      title: 'Human Title',
      description: 'What this tool does and when to use it.',
      inputSchema: z.object({ /* zod params */ }),
      annotations: { readOnlyHint: true },
    },
    async (params) => {
      // SQL query using `query()` from db.ts
      const result = await query(sql, paramValues);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.rows, null, 2) }],
      };
    }
  );
}
```

## New Tool Files to Create

### 1. `src/tools/exercises.ts` → `registerExerciseTools`

**cl_get_reading_questions**
- Description: "Returns reading comprehension questions, optionally filtered by CEFR level. Shows passage text, question, answer options, and correct index. Useful for auditing question quality and level coverage."
- Params: `level` (optional enum: A1/A2/B1/B2/C1/C2), `limit` (number, default 20, max 100)
- SQL: Select from `reading_questions` WHERE is_active = true, optionally filter by level, ORDER BY sort_order, LIMIT
- Return all columns

**cl_get_stress_pairs**
- Description: "Returns stress minimal pairs — words where stress placement changes meaning (e.g., CÁsă vs caSĂ). Core pronunciation training data."
- Params: `limit` (number, default 30, max 100)
- SQL: Select all from `stress_minimal_pairs` ORDER BY created_at DESC, LIMIT

**cl_get_suggested_questions**
- Description: "Returns AI tutor conversation starter questions, optionally filtered by CEFR level or category. Useful for auditing prompt quality and topic coverage."
- Params: `cefrLevel` (optional enum), `category` (optional string), `limit` (number, default 30)
- SQL: Select from `suggested_questions` WHERE is_active = true, optional filters, ORDER BY sort_order

**cl_get_tutor_openings**
- Description: "Returns tutor opening messages keyed by self-assessment level. Shows how the AI tutor greets learners at different proficiency levels."
- Params: `selfAssessmentKey` (optional string)
- SQL: Select from `tutor_opening_messages` WHERE is_active = true, optional filter on self_assessment_key

### 2. `src/tools/learner-data.ts` → `registerLearnerDataTools`

**cl_get_session_summary**
- Description: "Returns aggregated session data — session counts by type, average duration, and content engagement. All data is anonymized (no user IDs returned). Useful for understanding how learners actually use the app."
- Params: `sessionType` (optional string), `limit` (number, default 30)
- SQL:
```sql
SELECT 
  session_type,
  COUNT(*) as session_count,
  ROUND(AVG(duration_seconds)) as avg_duration_sec,
  ROUND(AVG(EXTRACT(EPOCH FROM (ended_at - started_at)))) as avg_wall_time_sec,
  MIN(started_at) as earliest,
  MAX(started_at) as latest
FROM sessions
GROUP BY session_type
ORDER BY session_count DESC
```
- If sessionType provided, also return a second query with per-content breakdown for that type

**cl_get_proficiency_trends**
- Description: "Returns proficiency score history over time — overall, listening, reading, speaking, writing scores by period. Anonymized across all users. Useful for tracking whether content improvements translate to learner gains."
- Params: `limit` (number, default 20)
- SQL: Select from `proficiency_history`, no user_id in output, ORDER BY recorded_at DESC, LIMIT

**cl_get_feature_exposure**
- Description: "Returns aggregated feature exposure data — how many times each grammar feature has been seen by learners, with correctness rates. Anonymized. Useful for finding undertaught or poorly-performing features."
- Params: `featureKey` (optional string), `limit` (number, default 50)
- SQL:
```sql
SELECT 
  feature_key,
  exposure_type,
  COUNT(*) as total_exposures,
  SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
  ROUND(100.0 * SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) as accuracy_pct
FROM user_feature_exposure
GROUP BY feature_key, exposure_type
ORDER BY total_exposures DESC
```
- If featureKey provided, filter with WHERE

**cl_get_mystery_items**
- Description: "Returns mystery vocabulary items — words learners encountered and flagged for exploration. Shows word, context, definition, examples, grammar info, and whether the learner has explored it. Useful for understanding organic vocabulary discovery."
- Params: `explored` (optional boolean), `limit` (number, default 30)
- SQL: Select from `mystery_items` (exclude user_id from output), optional WHERE is_explored filter, ORDER BY created_at DESC

**cl_get_generated_content_summary**
- Description: "Returns aggregated stats on AI-generated content — what types are being generated, for which error targets, listening rates, and estimated TTS costs. Anonymized. Useful for auditing the AI tutor's output quality and cost."
- Params: `contentType` (optional string), `limit` (number, default 30)
- SQL:
```sql
SELECT 
  content_type,
  target_error_type,
  target_category,
  COUNT(*) as generated_count,
  SUM(CASE WHEN is_listened THEN 1 ELSE 0 END) as listened_count,
  ROUND(100.0 * SUM(CASE WHEN is_listened THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) as listen_rate_pct,
  SUM(audio_estimated_cost) as total_tts_cost,
  SUM(audio_character_count) as total_characters
FROM generated_content
GROUP BY content_type, target_error_type, target_category
ORDER BY generated_count DESC
LIMIT $1
```

**cl_get_learning_narratives**
- Description: "Returns AI-generated learning narrative summaries — periodic reflections on learner progress with stats. Anonymized. Useful for auditing narrative quality and checking if the reflection system captures meaningful patterns."
- Params: `limit` (number, default 10)
- SQL: Select from `learning_narratives` (exclude user_id), ORDER BY created_at DESC

### 3. `src/tools/usage.ts` → `registerUsageTools`

**cl_get_tts_usage**
- Description: "Returns TTS (text-to-speech) usage stats — characters consumed per day. Useful for monitoring costs and usage trends."
- Params: `days` (number, default 30, max 365)
- SQL:
```sql
SELECT 
  DATE(date) as usage_date,
  SUM(characters_used) as total_characters
FROM tts_usage
WHERE date >= NOW() - INTERVAL '1 day' * $1
GROUP BY DATE(date)
ORDER BY usage_date DESC
```

## Update index.ts

Add these 3 imports and register calls after the existing ones:
```typescript
import { registerExerciseTools } from './tools/exercises.js';
import { registerLearnerDataTools } from './tools/learner-data.js';
import { registerUsageTools } from './tools/usage.js';

// ... after existing register calls:
registerExerciseTools(server);
registerLearnerDataTools(server);
registerUsageTools(server);
```

## IMPORTANT RULES
1. **ALL tools are READ-ONLY** — no INSERT/UPDATE/DELETE. Set `readOnlyHint: true` on every tool.
2. **Anonymize** — NEVER return `user_id` in any output. Aggregate or exclude it.
3. **Use parameterized queries** — never interpolate user input into SQL strings.
4. **Follow the exact pattern** from errors.ts — same imports, same return shape, same `as const`.
5. **Keep descriptions helpful** — describe WHEN to use each tool, not just what it does.
6. **Build and verify** — run `npm run build` after all changes to confirm TypeScript compiles clean.
7. **Commit with message**: "feat: add 11 new MCP tools for exercises, learner data, and TTS usage"
