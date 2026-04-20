# Monorepo Migration Notes

Working notes for the `chaos/` monorepo migration. See `docs/CHAOS-MONOREPO-MIGRATION.md` for the full execution spec.

---

## Phase 0c — Python script audit (`scripts/tts/`)

**Completed:** 2026-04-20
**Scope:** All non-TypeScript scripts in the repo (5 Python files in `scripts/tts/`).

### Pipeline

```
scripts/tts/{a1,a2,b1,b2_c1}_texts.py    ← Romanian CEFR content (dicts)
        ↓ imported by
scripts/tts/generate_csv.py              ← orchestrator: voice assignment,
        ↓ writes                            metrics, CSV output
romanian_month1_124k.csv                 ← project root
        ↓ consumed by
scripts/generate-elevenlabs-content.ts   ← ElevenLabs API + R2 upload
```

Referenced from `docs/reference/CLI-Scripts-Reference.md` (section: "TTS Text Generators (Python)"). `__pycache__/` is gitignored.

### Classification

| File | Lines | Coupling | Notes |
|---|---|---|---|
| `a1_texts.py` | 461 | **Language-specific** | List of Romanian text dicts (id, level, `text_romanian`, topic, speaker_gender). Pure content. |
| `a2_texts.py` | 480 | **Language-specific** | Same shape as A1, B1 Romanian content. |
| `b1_texts.py` | 317 | **Language-specific** | Same shape. |
| `b2_c1_texts.py` | 243 | **Language-specific** | Same shape. |
| `generate_csv.py` | 146 | **Mostly language-specific** | Orchestration logic is reusable; hardcoded Romanian bits: `text_romanian` field name, ElevenLabs voice IDs, `CHARS_PER_SEC = 11.16` (Romanian-tuned), output filename `romanian_month1_124k.csv`. |

### Downstream coupling in TS land

- **`scripts/generate-elevenlabs-content.ts`** — reads `romanian_month1_124k.csv` by hardcoded name and accesses `text_romanian` field. Would need CSV path config + generalized field name to serve Spanish. Rule of Three applies — defer abstraction until duplication actually happens.

### Treatment per migration phase

| Phase | Action |
|---|---|
| **Phase 1 (monorepo shell)** | Move `scripts/tts/` into `apps/chaoslimba/scripts/tts/` unchanged. No logic changes. |
| **Phase 2 (ChaosLengua scaffold)** | Do **not** copy Python scripts blindly into `apps/chaoslengua/`. Instead: (a) add a stub `scripts/tts/` directory for ES with a placeholder note; (b) when Spanish CEFR content work starts, write fresh `a1_texts.py`/etc. with Spanish text; (c) copy `generate_csv.py` and adjust constants (`CHARS_PER_SEC`, voice IDs, field name → e.g., `text_spanish`, output filename). |
| **Phase 3+ (extraction)** | *Possible future:* after both apps have a working `generate_csv.py`, extract shared pipeline skeleton into `packages/tts-pipeline/` that takes a language config (field name, WPM constant, voice roster, output path). Not urgent — both pipelines are ~150 lines and low-churn. Rule of Three first. |

### Open questions for Spanish TTS

Not blocking Phase 0c, but flagging for later:

1. **Spanish voice roster.** ElevenLabs voices in `generate_csv.py` are Romanian-trained. Spanish run needs its own curated voice IDs — region matters (es-ES vs es-MX vs es-LA). Separate research patch.
2. **Spanish `CHARS_PER_SEC` constant.** Romanian tuning (11.16 at 0.90 speed) probably won't transfer. Empirical measurement needed once Spanish voices are chosen.
3. **ElevenLabs vs Google Cloud TTS for Spanish.** ChaosLimbă used both at different points (`generate-elevenlabs-content.ts` + `generate-bridge-audio.ts` uses Google). Which is the canonical path for new languages? Worth deciding before Phase 2 scaffolds a stub.
