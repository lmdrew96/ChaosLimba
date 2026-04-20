# Chaos Monorepo Migration — Execution Spec

**Target:** Restructure ChaosLimbă into `chaos/` monorepo to enable ChaosLengua (Spanish sibling) and future language siblings (FR, DE, PT planned).

**Status:** Planned. Patches stacked in ChaosPatch under `chaoslimba` (Phase 0) and `chaoslengua` (Phase 1+).

**Authored by:** Coru (via audit of `github.com/lmdrew96/chaoslimba`).
**Executed by:** Cody.
**Owner:** Nae.

---

## TL;DR for Cody

ChaosLimbă (Next.js 16 + TypeScript + Clerk + Neon/Drizzle, live prod app) needs to become `apps/chaoslimba/` inside a `chaos/` monorepo so ChaosLengua (Spanish) can reuse infrastructure. We're doing this **incrementally** — Rule of Three applies, so no speculative extraction. Start with Phase 0a: reconcile the dual lockfile situation in the current ChaosLimbă repo.

---

## Decisions already made (do not re-litigate)

- **Monorepo, not fork.** Fork tax with 3+ planned siblings compounds.
- **pnpm workspaces + Turborepo.** Native, lightweight, Vercel-supported. No Nx.
- **Incremental extraction.** ChaosLimbă moves into the monorepo *unchanged* first. Package extraction happens only when pain from duplication surfaces. Big-bang extraction is forbidden.
- **Keep target-language route names per app.** ChaosLimbă has `ce-inseamna`, `cum-se-pronunta` — that's immersive pedagogy, not a bug. ChaosLengua gets `que-significa`, `como-se-pronuncia` equivalents. Do not English-normalize routes.
- **Spanish MVP scope:** Stage 1 only, 4 error patterns — ser/estar, preterite/imperfect, por/para, direct/indirect object pronouns. Skipping subjunctive and gendered nouns (Stage 2+). False cognates woven through exercises, no dedicated skill.
- **ChaosLengua audience:** plateau-breakers (A2→B1 English L1 Spanish learners). NOT absolute beginners.
- **Nae is her own alpha test user** (~80% Spanish reading comprehension). Ashley beta-tests second. Public after.

---

## Target monorepo shape

```
chaos/
├── apps/
│   ├── chaoslimba/         # Romanian — moved from current repo, unchanged
│   └── chaoslengua/        # Spanish — new, scaffolded from ChaosLimbă initially
├── packages/               # Extracted only when needed
│   ├── core-ai/            # Conductor, Aggregator, Adaptation Engine (pure logic)
│   ├── ai-clients/         # Groq, Anthropic, HuggingFace wrappers (stateless)
│   ├── db/                 # Drizzle schema + shared queries
│   ├── ui/                 # shadcn/ui + shared feature components
│   └── lang-config/        # TypeScript interface for language modules
├── languages/
│   ├── romanian/           # Prompts, intonation rules, error taxonomy, CEFR content
│   └── spanish/            # Same shape, Spanish content
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

The `packages/` vs `languages/` split is load-bearing: `packages/` is code, `languages/` is pedagogical content + rules. Each language module exports the same typed interface from `@chaos/lang-config` — apps consume them via dependency injection, stay thin.

---

## Shared vs language-specific extraction map

| Component | Classification | Notes |
|---|---|---|
| Conductor, Aggregator, Adaptation Engine | **Shared** | Pure orchestration/logic. Safest first extraction. |
| Groq/Anthropic/HF client wrappers | **Shared** | Stateless. |
| SPAM-A/B (multilingual-MiniLM) | **Shared** | Already multilingual. |
| Drizzle schema + user/error/profile queries | **Shared** | Live RO data requires careful migration strategy. |
| shadcn/ui + feature components | **Shared** | Needs i18n pass on hardcoded strings. |
| PWA service worker + manifest | **Shared core, per-app config** | Each app has its own manifest; SW logic shared. |
| Pronunciation model (romanian-wav2vec2) | **Language-specific** | ES needs spanish-wav2vec2 equivalent (patch pending). |
| SPAM-D intonation rules | **Language-specific** | Rule-based lookup, ~50-100 pairs per language. |
| Grammar / AI tutor prompts | **Language-specific** | Wrapped in stateless clients, prompts come from `languages/{lang}/`. |
| Error taxonomy | **Language-specific** | RO interlanguage errors ≠ ES interlanguage errors. |
| CEFR content + audio assets | **Language-specific** | Separate R2 buckets per language. |
| Dashboard route names | **Language-specific** | Immersive naming — keep target-language routes. |
| Python scripts in `scripts/` | **Unknown** | Phase 0c audits this. |

---

## Phased execution plan

### Phase 0 — ChaosLimbă prep (current repo, no monorepo yet)

Patches under `chaoslimba`:

- **0a (HIGH)** — Reconcile dual lockfiles. `package-lock.json` AND `pnpm-lock.yaml` are both committed. Pick pnpm (better workspace support). Delete `package-lock.json`, run `pnpm install --frozen-lockfile=false` to regenerate, commit, push, verify Vercel rebuild stays green.
- **0b (HIGH)** — Verify full test suite passes on clean pnpm install. Gate before any structural work. If tests fail, fix before proceeding.
- **0c (MED)** — Audit `scripts/` Python files for language coupling. Document which are Romanian-specific (need replication for Spanish), which are reusable. Output goes in `docs/monorepo-migration-notes.md`.
- **0d (MED)** — Confirm no in-flight patches would conflict with structural freeze. One pre-existing ChaosLimbă patch exists as of 2026-04-20 — review, decide ship-first or park.

**Gate to Phase 1:** All Phase 0 patches marked done. Vercel deployment green. Test suite green on pnpm.

### Phase 1 — Monorepo shell

Patch under `chaoslengua`: Phase 1 (HIGH).

1. Create new repo `chaos/` (suggest a new GitHub repo `lmdrew96/chaos` — preserve ChaosLimbă repo history via `git subtree` or similar).
2. Add `pnpm-workspace.yaml`, `turbo.json`, root `package.json` with workspace scripts.
3. Move ChaosLimbă into `apps/chaoslimba/` **unchanged**. Update internal paths only where necessary (Vercel build config, env var references).
4. Configure Turbo pipelines: `build`, `dev`, `lint`, `test`, `db:push`.
5. Update Vercel project settings to point at `apps/chaoslimba/` with appropriate root directory.
6. Deploy. Verify prod still works end-to-end.

**Gate to Phase 2:** `pnpm dev` works from monorepo root. Prod ChaosLimbă deployment confirmed green.

### Phase 2 — Scaffold ChaosLengua as direct importer

Patch under `chaoslengua`: Phase 2 (HIGH).

1. `cp -r apps/chaoslimba apps/chaoslengua`.
2. Update package name, Next.js config, PWA manifest, env var namespacing.
3. **Deliberately import from `../chaoslimba/src/lib/...`** for shared logic. This is intentionally ugly — proves the workspace works and surfaces the actual seams.
4. Replace content directory with minimal ES placeholders (one exercise per planned error pattern).
5. Replace pronunciation model config (stub — real ES wav2vec2 comes later).
6. Stand up new Neon database for ES user data (separate from RO to avoid cross-contamination during alpha).
7. Deploy to Vercel as separate project.

**Gate to Phase 3:** Both apps deploy independently. ChaosLengua renders homepage with Spanish routes. Direct imports from ChaosLimbă work.

### Phase 3 — Extract packages (one at a time, only when pain surfaces)

Patches under `chaoslengua`: Phase 3a/b/c/d (MED).

**Rule of Three:** Only extract when the same code exists in both apps AND duplication is causing real friction. Don't speculate.

Recommended extraction order (safest first):

- **3a — `@chaos/core-ai`** — Conductor, Aggregator, Adaptation Engine. Pure logic, no env vars, no DB. Easiest to move.
- **3b — `@chaos/db`** — Drizzle schema + shared queries. Requires careful migration planning because RO production data is live.
- **3c — `@chaos/ui`** — shadcn/ui components + shared feature components. Needs i18n pass to move hardcoded strings out.
- **3d — `@chaos/ai-clients`** — Groq/Anthropic/HF wrappers. Stateless, easy to move, but less urgent than the others.

Each extraction follows the same recipe:
1. Create `packages/{name}/` with `package.json` and `tsconfig.json`.
2. Move files. Update imports in both apps. Verify `pnpm build` green.
3. Commit, push, verify both Vercel deployments green.
4. Ship. Do not batch multiple extractions in one commit.

### Phase 4 — Codify `@chaos/lang-config`

Patch under `chaoslengua`: Phase 4 (LOW).

Once 2-3 packages are extracted, the shape of "what a language module provides" becomes obvious. Lock it as a TypeScript interface in `@chaos/lang-config`:

```typescript
export interface LanguageModule {
  code: string;                     // 'ro' | 'es' | ...
  displayName: string;              // 'Română' | 'Español'
  pronunciationModel: ModelConfig;  // HF model + invocation params
  intonationRules: IntonationRule[];
  errorTaxonomy: ErrorCategory[];
  prompts: {
    grammar: PromptTemplate;
    tutor: PromptTemplate;
    workshop: PromptTemplate;
  };
  routes: RouteNameMap;             // { wordMeaning: 'ce-inseamna' | 'que-significa', ... }
  cefrContent: CEFRContentSource;
}
```

Romanian module retrofits to conform. Spanish module conforms from the start. Future siblings (FR, DE, PT) just implement this interface.

---

## Sharp edges — read before you start

1. **Dual lockfiles.** Both npm and pnpm lockfiles are in ChaosLimbă as of the audit. Phase 0a fixes this. Do not start Phase 1 until lockfile is reconciled.
2. **Live Romanian production data.** Prod users exist. Schema changes during Phase 3b need a migration strategy that doesn't break existing users. Consider running ES on a fresh Neon DB during alpha to de-risk.
3. **Route naming is pedagogy, not arbitrary.** ChaosLimbă's Romanian route names (`ce-inseamna`, `cum-se-pronunta`) are immersive design. Spanish routes should mirror the pattern (`que-significa`, `como-se-pronuncia`). Do not normalize to English.
4. **Python scripts are unaudited.** Until Phase 0c output is in, assume `scripts/*.py` may have Romanian-specific logic. Don't copy them into ChaosLengua blindly.
5. **MVP stability.** ChaosLimbă README says "99.5% complete." Before Phase 1 freezes the structure, confirm there's no critical RO work that would be harder to ship mid-migration.
6. **Pronunciation model for ES is not free.** romanian-wav2vec2 exists on HF; equivalent Spanish model needs research (separate patch). Phase 2 stubs this; don't block on it.
7. **46 API routes × 2 apps = 92 routes if duplicated.** Handler-factory pattern (take language config, return route handler) is high-leverage during Phase 3. Don't literally copy-paste all 46 routes.

---

## ChaosPatch reference

Patches are tracked in ChaosPatch. Mark `in_progress` when starting, `done` when shipped.

**ChaosLimbă project** (`chaoslimba`):
- Phase 0a — Reconcile dual lockfiles
- Phase 0b — Verify test suite on clean pnpm install
- Phase 0c — Audit Python scripts for language coupling
- Phase 0d — Confirm MVP stability before structural freeze

**ChaosLengua project** (`chaoslengua`):
- Phase 1 — Monorepo shell
- Phase 2 — Scaffold ChaosLengua as direct importer
- Phase 3a — Extract `@chaos/core-ai`
- Phase 3b — Extract `@chaos/db`
- Phase 3c — Extract `@chaos/ui`
- Phase 3d — Extract `@chaos/ai-clients`
- Phase 4 — Codify `@chaos/lang-config`
- Clone/generalize ID consultant skill *(parallel pedagogy track)*
- Derive Spanish Error Garden taxonomy *(parallel pedagogy track)*
- Ser vs estar exercise set *(parallel)*
- Preterite vs imperfect exercise set *(parallel)*
- Por vs para exercise set *(parallel)*
- Direct/indirect object pronoun exercise set *(parallel)*
- Finalize ChaosLengua visual identity *(low priority)*
- Research Spanish pronunciation model options *(low priority)*
- Set up R2 bucket + Google TTS pipeline for ES audio *(low priority)*

---

## First action for Cody

**Phase 0a** in the existing ChaosLimbă repo. Concretely:

```bash
cd /path/to/chaoslimba
rm package-lock.json
pnpm install
pnpm build
pnpm test
git add -A
git commit -m "chore: remove npm lockfile, commit to pnpm-only"
git push
```

Then watch Vercel. If rebuild is green, mark patch Phase 0a done in ChaosPatch (`cp_complete_patch` with the patch ID). If Vercel fails, stop and report the error — do not force-push or paper over.

---

## Out of scope (do not do these yet)

- Spanish pronunciation model integration (stubbed in Phase 2, real work later).
- Spanish TTS audio content generation (separate patch, low priority).
- Branding/logo design for ChaosLengua (low priority).
- Any actual Spanish exercise content beyond minimal Phase 2 placeholders.
- Subjunctive, gendered nouns, or other Stage 2+ grammar.
- Refactoring ChaosLimbă code beyond what's mechanically necessary for monorepo migration.
- Changing any ChaosLimbă user-facing behavior.
- Adding new features to either app during the migration.

---

## Questions / ambiguities to raise with Nae, not guess

- **New `chaos/` repo vs restructure in place?** Spec assumes new repo. If Nae wants to restructure ChaosLimbă in place (rename + reorganize), ask first.
- **ES Neon database: fresh or shared?** Spec recommends fresh for alpha. Confirm before Phase 2.
- **Vercel project structure.** Two separate Vercel projects (one per app) vs monorepo project with multiple apps. Either works; confirm Nae's preference before Phase 1.
- **Route naming for ES.** The `que-significa` / `como-se-pronuncia` examples are Coru's guesses. Nae is the Spanish speaker — she picks final route names.
