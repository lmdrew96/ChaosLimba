# ChaosLimbă: Expand Grammar Feature Map to B1–C2 & Re-tag All Content

## Context

ChaosLimbă is an English-to-Romanian CALL app built on interlanguage theory. The `grammar_feature_map` table currently has **31 features covering A1–A2 only**, but the content library has **1,080+ items spanning difficulty levels 1.5–9.5**. Higher-level content (difficulty 4.5+) uses Romanian-language grammar descriptors like `"modul subjonctiv"` and `"construcții pasive"` that don't match any feature_keys, so the coverage system is blind to B1+ content.

**This task has two phases:**
1. **Phase 1:** Insert new B1, B2, C1, and C2 grammar features into `grammar_feature_map`
2. **Phase 2:** Re-run content tagging across ALL 1,080+ content items to map them to the expanded feature set

---

## Phase 1: Insert B1–C2 Features

### Database Schema

Table: `grammar_feature_map` (Neon Postgres)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Auto-generated |
| feature_key | text | snake_case identifier (UNIQUE) |
| feature_name | text | Human-readable name |
| cefr_level | text | 'A1', 'A2', 'B1', 'B2', 'C1', or 'C2' |
| category | text | 'grammar' or 'vocabulary_domain' |
| description | text | What the feature covers, with examples |
| prerequisites | jsonb | Array of feature_key strings from lower levels |
| sort_order | integer | Ordering within CEFR level (starts at 1) |
| created_at | timestamp | Auto-generated |

### Existing Features (DO NOT duplicate or modify)

**A1 Grammar (10):** vocab_greetings, present_tense_a_fi, present_tense_a_avea, vocab_family, present_tense_regular_group1, vocab_food, indefinite_article, vocab_colors, definite_article, vocab_numbers, gender_agreement, vocab_time_basic, basic_negation, imi_place_construction, basic_questions, basic_prepositions

**A2 Grammar (15):** past_tense_perfect_compus, reflexive_verbs, accusative_pronouns, dative_pronouns, basic_connectors, comparative_adjectives, future_informal_o_sa, imperative_basic, possession_al_a, plural_nouns, vocab_shopping, vocab_health, vocab_travel, vocab_weather, vocab_work

### New Features to Insert

Use a single INSERT statement (or batch) for each CEFR level. Follow these guidelines:

- **feature_key**: snake_case, descriptive, consistent with existing naming
- **prerequisites**: Reference ONLY feature_keys that exist (either existing A1/A2 or newly created B1+ keys). Prerequisite chains should be pedagogically sound — a learner needs the prerequisite to understand the new feature.
- **sort_order**: Restart at 1 for each CEFR level
- **category**: Use 'grammar' for structural features, 'vocabulary_domain' for thematic vocab sets

#### B1 Features (Insert these)

| feature_key | feature_name | category | description | prerequisites | sort_order |
|---|---|---|---|---|---|
| subjunctive_sa | Subjunctive with "să" | grammar | Subjunctive mood formed with "să" + conjugated verb: Vreau să merg (I want to go), Trebuie să fac (I must do). Required after many verbs and expressions. | ["present_tense_regular_group1"] | 1 |
| present_tense_irregular | Irregular Present Tense Verbs | grammar | Common verbs with irregular present forms: a face (fac), a ști (știu), a veni (vin), a putea (pot), a vrea (vreau), a da (dau), a lua (iau). | ["present_tense_regular_group1"] | 2 |
| imperfect_tense | Imperfect Tense (Imperfectul) | grammar | Past tense for habitual/ongoing actions: mergeam (I was going/used to go), făceam (I was doing). Endings: -am, -ai, -a, -am, -ați, -au. | ["past_tense_perfect_compus"] | 3 |
| future_formal_voi | Formal Future: voi + infinitive | grammar | Literary/formal future tense: voi merge (I will go), va face (he will do). Less common in speech than "o să" but used in writing. | ["future_informal_o_sa"] | 4 |
| conditional_present | Present Conditional (Condiționalul prezent) | grammar | Conditional mood using aș/ai/ar/am/ați/ar + infinitive: Aș vrea (I would like), Ar fi bine (It would be good). | ["future_informal_o_sa"] | 5 |
| genitive_dative_case | Genitive-Dative Case Forms | grammar | Noun/article forms for possession and indirect objects. Masculine: băiatului (of/to the boy). Feminine: fetei (of/to the girl). Often identical forms for genitive and dative. | ["definite_article", "dative_pronouns"] | 6 |
| relative_clauses_care | Relative Clauses with "care" | grammar | Forming relative clauses: Omul care vorbește (The man who speaks), Cartea pe care o citesc (The book which I read). "Care" is invariable but uses "pe care" for direct objects. | ["accusative_pronouns", "basic_connectors"] | 7 |
| advanced_connectors | Advanced Connectors: deși, totuși, cu toate că | grammar | Complex conjunctions: deși/cu toate că (although), totuși (however), prin urmare (therefore), în schimb (on the other hand), fie...fie (either...or). | ["basic_connectors"] | 8 |
| passive_voice | Passive Voice (Diateza pasivă) | grammar | Passive with "a fi" + past participle: Cartea este citită (The book is read), Casa a fost construită (The house was built). Participle agrees in gender/number. | ["past_tense_perfect_compus", "gender_agreement"] | 9 |
| clitic_doubling | Clitic Doubling | grammar | Redundant pronoun construction required in Romanian: Îl văd pe Ion (I see Ion — lit. "Him I-see on Ion"). Mandatory with specific direct objects using "pe". | ["accusative_pronouns"] | 10 |
| present_tense_group2_3_4 | Present Tense: Group II, III, IV Verbs | grammar | Conjugation patterns for non-group-I verbs. Group II (-ea): a vedea → văd. Group III (-e): a merge → merg. Group IV (-î/-i): a hotărî → hotărăsc, a dormi → dorm. | ["present_tense_regular_group1"] | 11 |
| adverb_formation | Adverb Formation & Placement | grammar | Forming adverbs from adjectives (frumos→frumos, rapid→rapid) and placement rules. Common adverbs: bine, rău, repede, încet, deja, încă, mereu. | ["comparative_adjectives"] | 12 |
| vocab_education | Education & Academic Life | vocabulary_domain | universitate, facultate, curs, examen, notă, profesor, student, bibliotecă, diplomă, bursă, a studia, a absolvi. | ["vocab_work"] | 13 |
| vocab_emotions | Emotions & Feelings | vocabulary_domain | fericit, trist, supărat, speriat, îngrijorat, entuziasmat, dezamăgit, mândru, rușinat, recunoscător. | [] | 14 |
| vocab_nature | Nature & Environment | vocabulary_domain | munte, râu, lac, pădure, mare, plajă, floare, copac, animal, mediu, poluare, climă. | ["vocab_weather"] | 15 |

#### B2 Features (Insert these)

| feature_key | feature_name | category | description | prerequisites | sort_order |
|---|---|---|---|---|---|
| pluperfect_tense | Pluperfect (Mai mult ca perfectul) | grammar | Past before past: mergesem (I had gone), făcusem (I had done). Formed from imperfect stem + special endings. Used for sequencing past events. | ["imperfect_tense"] | 1 |
| conditional_perfect | Perfect Conditional (Condiționalul perfect) | grammar | Would have done: Aș fi mers (I would have gone), Ar fi știut (He would have known). Structure: conditional of "a fi" + past participle. | ["conditional_present", "past_tense_perfect_compus"] | 2 |
| subjunctive_past | Past Subjunctive (Conjunctivul perfect) | grammar | Să fi mers (to have gone), Să fi făcut (to have done). Used in hypothetical/contrafactual contexts: Ar fi trebuit să fi plecat. | ["subjunctive_sa", "past_tense_perfect_compus"] | 3 |
| gerund_gerunziu | Gerund (Gerunziul) | grammar | Romanian gerund with -ând/-ind: mergând (going), făcând (doing), citind (reading). Used for simultaneous actions: Mergând pe stradă, am văzut... | ["present_tense_group2_3_4"] | 4 |
| infinitive_long | Long Infinitive as Noun | grammar | Using infinitive forms as abstract nouns: citire (reading), plecare (departure), vedere (sight). Feminine nouns derived from verb infinitives. | ["subjunctive_sa"] | 5 |
| reported_speech | Reported/Indirect Speech | grammar | Converting direct to indirect speech: El a spus că merge (He said he's going). Tense shifting, pronoun changes, and conjunction "că". | ["past_tense_perfect_compus", "subjunctive_sa"] | 6 |
| clitic_combinations | Combined Clitic Pronouns | grammar | Two clitics together: Mi-a dat (He gave me), Ți-l dau (I give it to you), I-am spus (I told him/her). Complex ordering and contraction rules. | ["clitic_doubling", "dative_pronouns"] | 7 |
| vocative_case | Vocative Case | grammar | Direct address forms: Ioane! (John!), mamă! (mom!), dragă! (dear!), doamnă! (madam!). Special endings vary by gender and noun type. | ["genitive_dative_case"] | 8 |
| word_order_advanced | Advanced Word Order & Topicalization | grammar | Flexible SVO order for emphasis: Cartea am citit-o (The book, I read IT). Topic-comment structure, fronting, and clitic resumption. | ["clitic_doubling", "relative_clauses_care"] | 9 |
| impersonal_constructions | Impersonal Constructions | grammar | Subjectless constructions: Se pare că (It seems that), Trebuie să (One must), Se poate (It's possible), E nevoie de (There's need of). | ["subjunctive_sa", "reflexive_verbs"] | 10 |
| diminutives_augmentatives | Diminutives & Augmentatives | grammar | Affective suffixes: -el/-ică (diminutive), -oi/-oaie (augmentative). căsuță (little house), fetiță (little girl), băiețel (little boy). Expressive and culturally important. | ["gender_agreement", "plural_nouns"] | 11 |
| numbers_advanced | Advanced Numerals & Quantifiers | grammar | Ordinal numbers (primul, al doilea), fractions (jumătate, sfert), collective numerals (amândoi), approximations (vreo, cam). Agreement patterns. | ["vocab_numbers", "gender_agreement"] | 12 |
| vocab_politics_society | Politics & Society | vocabulary_domain | guvern, alegeri, democrație, drept, lege, cetățean, societate, politică, libertate, protest. | ["vocab_education"] | 13 |
| vocab_arts_culture | Arts & Culture | vocabulary_domain | artă, muzică, film, teatru, pictură, sculptor, operă, poezie, roman, festival, muzeu, expoziție. | [] | 14 |
| vocab_technology | Technology & Digital | vocabulary_domain | calculator, telefon, internet, aplicație, program, date, rețea, inteligență artificială, ecran, parolă. | [] | 15 |

#### C1 Features (Insert these)

| feature_key | feature_name | category | description | prerequisites | sort_order |
|---|---|---|---|---|---|
| presumptive_mood | Presumptive Mood (Modul prezumtiv) | grammar | Expressing supposition: O fi știind (He probably knows), Vor fi plecând (They're probably leaving). Unique to Romanian among Romance languages. | ["gerund_gerunziu", "future_formal_voi"] | 1 |
| passive_reflexive | Reflexive Passive (Pasivul reflexiv) | grammar | Se vorbește română aici (Romanian is spoken here), Se construiesc case noi (New houses are being built). Passive meaning through reflexive "se". | ["passive_voice", "reflexive_verbs"] | 2 |
| nominalization_complex | Complex Nominalization Patterns | grammar | Turning clauses into noun phrases: Faptul că a plecat... (The fact that he left...), Ceea ce contează... (What matters...). Academic/formal register. | ["relative_clauses_care", "infinitive_long"] | 3 |
| discourse_markers | Discourse Markers & Hedging | grammar | Pragmatic markers: de fapt (actually), oricum (anyway), într-adevăr (indeed), în fond (basically), parcă (seemingly/I think), zice-se (they say). | ["advanced_connectors"] | 4 |
| aspect_and_aktionsart | Verbal Aspect & Aktionsart | grammar | Expressing aspect through prefixes and context: a face/a desface, a scrie/a descrie, a pune/a depune. Perfective vs imperfective nuances. | ["imperfect_tense", "past_tense_perfect_compus"] | 5 |
| formal_register | Formal Register & Dumneavoastră | grammar | Polite address using dumneavoastră (2nd pl.), dumneaei/dumnealui (3rd). Formal verb agreement, letter/email conventions, institutional language. | ["subjunctive_sa", "conditional_present"] | 6 |
| idiomatic_expressions | Idiomatic Expressions & Collocations | grammar | Fixed expressions: a-i sări muștarul (to lose one's temper), a da de gol (to expose/reveal), a o lua la sănătoasa (to run away). Cultural depth. | ["advanced_connectors"] | 7 |
| participle_agreement | Participle & Agreement Patterns | grammar | Past participle agreement in compound structures: Cărțile au fost citite (The books were read — fem. pl. agreement). Participle as adjective: ușa deschisă. | ["passive_voice", "gender_agreement", "plural_nouns"] | 8 |
| vocab_philosophy_abstract | Abstract & Philosophical Concepts | vocabulary_domain | libertate, justiție, adevăr, conștiință, existență, morală, identitate, destin, sens, cunoaștere. | ["vocab_politics_society"] | 9 |
| vocab_science | Science & Research | vocabulary_domain | cercetare, experiment, teorie, descoperire, ipoteză, analiză, dovadă, studiu, laborator, concluzie. | ["vocab_technology"] | 10 |

#### C2 Features (Insert these)

| feature_key | feature_name | category | description | prerequisites | sort_order |
|---|---|---|---|---|---|
| literary_tenses | Literary Tenses: Perfect Simplu & Mai mult ca perfectul literar | grammar | Literary past (Perfect simplu): merse, făcu, veni — used in literature, journalism, regional speech. Highly marked register. | ["pluperfect_tense"] | 1 |
| stylistic_word_order | Stylistic & Poetic Word Order | grammar | Inverted and marked word orders for literary/rhetorical effect. Post-verbal subjects, sentence-final focus, rhythmic structuring in formal prose and poetry. | ["word_order_advanced"] | 2 |
| archaic_regional_forms | Archaic & Regional Variants | grammar | Historical forms encountered in literature: dânsa/dânsul (she/he — older polite), -ră ending (ei merseră), Moldovan/Transylvanian dialectal features. | ["literary_tenses", "formal_register"] | 3 |
| academic_register | Academic & Institutional Register | grammar | Writing conventions for academic Romanian: impersonal structures, nominalized arguments, hedging devices, citation integration, formal cohesion devices. | ["nominalization_complex", "discourse_markers", "formal_register"] | 4 |
| etymological_awareness | Etymological Awareness & Word Families | grammar | Understanding Latin roots, Slavic borrowings, and neologism patterns. Word family analysis: a vedea/vedere/vizibil/viziune. Register choices: Latin vs Slavic doublets. | ["idiomatic_expressions"] | 5 |
| pragmatic_competence | Pragmatic & Sociolinguistic Competence | grammar | Appropriate register shifting, politeness strategies, humor, irony, understatement. Understanding cultural pragmatics: when to use tu vs dumneavoastră, implicit communication norms. | ["formal_register", "idiomatic_expressions", "discourse_markers"] | 6 |
| vocab_legal_administrative | Legal & Administrative Language | vocabulary_domain | lege, contract, instanță, hotărâre, proces, avocat, drept civil, reclamant, pârât, jurisprudență. | ["vocab_politics_society"] | 7 |
| vocab_literary_criticism | Literary Analysis & Criticism | vocabulary_domain | metaforă, simbolism, narator, perspectivă, temă, motiv, stil, curent literar, interbelic, postmodernism. | ["vocab_arts_culture"] | 8 |

### Phase 1 Execution

Write a migration script that:

1. Connects to Neon Postgres using the existing database connection (use the ORM/connection already in the project — check `drizzle.config.ts` or equivalent)
2. Inserts all B1, B2, C1, and C2 features from the tables above
3. Uses `ON CONFLICT (feature_key) DO NOTHING` to make it idempotent (safe to re-run)
4. Logs the count of features inserted per CEFR level

**Verify after running:**
```sql
SELECT cefr_level, COUNT(*) FROM grammar_feature_map GROUP BY cefr_level ORDER BY cefr_level;
```

Expected result:
- A1: 16
- A2: 15
- B1: 15
- B2: 15
- C1: 10
- C2: 8

**Total: 79 features**

---

## Phase 2: Re-tag ALL Content Items

After the feature map is expanded, re-run grammar tagging across the entire content library. This is the same approach as the previous migration but with the expanded feature set.

### What needs tagging

ALL 1,080+ content items need their `language_features.grammar` array updated to use the new feature_key values. Many items at difficulty 4.5+ currently have Romanian-language descriptors like "modul subjonctiv" or "construcții pasive" instead of matching feature_keys.

### Text Reconstruction

For each content item, get analyzable text:

- **Audio items with `wordTimestamps`**: Join all `.word` values from `language_features.wordTimestamps` into a single string
- **Audio items with `transcript`**: Use the `transcript` field
- **Text items**: Use `text_content`
- **If none available**: Skip the item and log it

### Tagging Process

Use the Anthropic API (claude-sonnet-4-5) to analyze each content item's reconstructed text against the FULL feature map (all 79 features).

**Batch size:** 5–10 content items per API call to stay within context limits.

**System prompt for the API call:**
```
You are a Romanian linguistics expert. For each Romanian text provided, identify which grammar features from the provided feature map are DEMONSTRABLY PRESENT in the text.

Rules:
- Only tag features where clear evidence exists in the text
- A feature is present if the text contains at least one clear instance of that grammatical structure
- Be CONSERVATIVE: false negatives are better than false positives
- For vocabulary_domain features, tag only if 2+ domain-specific words appear
- Return a JSON array of matching feature_key strings for each item

For B1+ features specifically:
- subjunctive_sa: Look for "să" + conjugated verb (not just "să" alone)
- conditional_present: Look for aș/ai/ar/am/ați/ar + infinitive
- passive_voice: Look for "este/a fost/sunt" + past participle with agreement
- genitive_dative_case: Look for modified noun forms (băiatului, fetei, etc.)
- imperfect_tense: Look for -eam/-eai/-ea verb endings
- reported_speech: Look for "a spus că", "a zis că" patterns
- presumptive_mood: Look for "o fi" + gerund patterns
- literary_tenses: Look for perfect simplu forms (merse, făcu, veni)
```

**User prompt structure:**
```
Here is the complete grammar feature map:
[JSON of all 79 features with feature_key and description]

Analyze these content items and return grammar tags:

Item 1 (id: {uuid}, difficulty: {level}):
"{reconstructed text}"

Item 2 (id: {uuid}, difficulty: {level}):
"{reconstructed text}"

...

Return JSON:
{
  "{uuid1}": ["feature_key_1", "feature_key_2", ...],
  "{uuid2}": ["feature_key_1", "feature_key_3", ...],
  ...
}
```

### Updating Content Items

For each content item, UPDATE the `language_features` jsonb field:
- **SET** `language_features.grammar` to the new array of feature_keys returned by the API
- **PRESERVE** all other fields in language_features (wordTimestamps, vocabulary, structures, etc.)
- Use jsonb_set or equivalent to surgically update only the grammar array

### Error Handling

- Implement exponential backoff for API rate limits (start 1s, max 60s)
- Log any items that fail tagging with their IDs
- If an API call returns no features for an item, set grammar to an empty array (don't skip the update)
- Save progress — if the script crashes at item 500, it should be resumable

### Dry Run Mode

Add a `--dry-run` flag that:
- Processes all items through the API
- Prints the proposed tags for each item
- Does NOT write to the database
- Outputs a summary: items processed, features tagged per level, items with 0 tags

### Verification

After running, execute:
```sql
-- Count items with grammar tags per difficulty level
SELECT 
  difficulty_level,
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE jsonb_array_length(language_features->'grammar') > 0) as tagged_items,
  ROUND(AVG(jsonb_array_length(language_features->'grammar')), 1) as avg_features_per_item
FROM content_items 
GROUP BY difficulty_level 
ORDER BY difficulty_level;

-- Check B1+ feature coverage
SELECT 
  gfm.feature_key,
  gfm.cefr_level,
  COUNT(ci.id) as content_count
FROM grammar_feature_map gfm
LEFT JOIN content_items ci 
  ON ci.language_features->'grammar' ? gfm.feature_key
GROUP BY gfm.feature_key, gfm.cefr_level
ORDER BY gfm.cefr_level, content_count DESC;
```

---

## Important Notes

- The database is Neon Postgres. Find the connection string in the project's environment/config files.
- The project likely uses Drizzle ORM — check `drizzle.config.ts`, `src/db/`, or `lib/db/` for the schema and connection setup.
- The Anthropic API key should already be in the environment (check `.env` or `.env.local` for `ANTHROPIC_API_KEY`).
- Run Phase 1 FIRST, verify the feature count, THEN run Phase 2.
- Phase 2 will make ~108-216 API calls (1080 items ÷ 5-10 per batch). Budget ~$5-15 in API costs depending on text lengths.

## Pedagogical Design Notes

The prerequisite chains follow SLA research principles:

- **Romanian case system** is scaffolded: nominative/accusative (A1, often identical forms) → genitive/dative (B1, introduced together since forms are identical) → vocative (B2, least frequent)
- **Verb tenses** follow communicative frequency: present (A1) → perfect compus (A2, most common past) → imperfect (B1, habitual past) → pluperfect (B2, narrative sequencing) → literary tenses (C2, register-specific)
- **Clitic pronouns** build incrementally: fixed expressions (A1, îmi place) → accusative/dative separately (A2) → clitic doubling (B1) → combined clitics (B2)
- **Register awareness** develops late: informal future first (A2) → formal future (B1) → conditional (B1) → formal register/dumneavoastră (C1) → academic register (C2)
- **Vocabulary domains** align with CEFR can-do statements: survival vocab (A1-A2) → social topics (B1) → abstract/professional (B2) → specialized/academic (C1-C2)
