import { useState } from "react";

const COVERAGE_DATA = [
  { level: "A1", total: 16, covered: 16, features: [
    { key: "definite_article", name: "Definite Articles", count: 939 },
    { key: "present_tense_a_fi", name: "a fi (to be)", count: 749 },
    { key: "basic_prepositions", name: "Basic Prepositions", count: 727 },
    { key: "indefinite_article", name: "Indefinite Articles", count: 601 },
    { key: "gender_agreement", name: "Gender Agreement", count: 579 },
    { key: "present_tense_a_avea", name: "a avea (to have)", count: 327 },
    { key: "basic_negation", name: "Negation (nu)", count: 272 },
    { key: "vocab_time_basic", name: "Time Expressions", count: 264 },
    { key: "vocab_numbers", name: "Numbers", count: 176 },
    { key: "vocab_food", name: "Food & Drinks", count: 179 },
    { key: "imi_place_construction", name: "a-i plăcea", count: 148 },
    { key: "vocab_family", name: "Family", count: 145 },
    { key: "vocab_colors", name: "Colors", count: 81 },
    { key: "basic_questions", name: "Question Words", count: 66 },
    { key: "present_tense_regular_group1", name: "Regular -a Verbs", count: 64 },
    { key: "vocab_greetings", name: "Greetings", count: 61 },
  ]},
  { level: "A2", total: 15, covered: 15, features: [
    { key: "basic_connectors", name: "Basic Connectors", count: 580 },
    { key: "reflexive_verbs", name: "Reflexive Verbs", count: 448 },
    { key: "plural_nouns", name: "Noun Plurals", count: 441 },
    { key: "past_tense_perfect_compus", name: "Perfect Compus", count: 408 },
    { key: "comparative_adjectives", name: "Comparatives", count: 280 },
    { key: "dative_pronouns", name: "Dative Pronouns", count: 185 },
    { key: "accusative_pronouns", name: "Accusative Pronouns", count: 149 },
    { key: "vocab_work", name: "Work & Occupations", count: 126 },
    { key: "future_informal_o_sa", name: "Informal Future", count: 111 },
    { key: "possession_al_a", name: "Possession al/a", count: 95 },
    { key: "vocab_travel", name: "Travel", count: 73 },
    { key: "vocab_shopping", name: "Shopping", count: 65 },
    { key: "vocab_health", name: "Health & Body", count: 52 },
    { key: "imperative_basic", name: "Basic Imperative", count: 43 },
    { key: "vocab_weather", name: "Weather", count: 33 },
  ]},
  { level: "B1", total: 15, covered: 15, features: [
    { key: "subjunctive_sa", name: "Subjunctive (să)", count: 437 },
    { key: "relative_clauses_care", name: "Relative Clauses", count: 239 },
    { key: "advanced_connectors", name: "Advanced Connectors", count: 167 },
    { key: "present_tense_irregular", name: "Irregular Verbs", count: 161 },
    { key: "passive_voice", name: "Passive Voice", count: 123 },
    { key: "conditional_present", name: "Present Conditional", count: 112 },
    { key: "genitive_dative_case", name: "Genitive-Dative Case", count: 83 },
    { key: "imperfect_tense", name: "Imperfect Tense", count: 67 },
    { key: "vocab_nature", name: "Nature & Environment", count: 51 },
    { key: "vocab_education", name: "Education", count: 43 },
    { key: "present_tense_group2_3_4", name: "Group II-IV Verbs", count: 40 },
    { key: "adverb_formation", name: "Adverb Formation", count: 31 },
    { key: "vocab_emotions", name: "Emotions", count: 29 },
    { key: "future_formal_voi", name: "Formal Future", count: 28 },
    { key: "clitic_doubling", name: "Clitic Doubling", count: 13 },
  ]},
  { level: "B2", total: 15, covered: 12, features: [
    { key: "impersonal_constructions", name: "Impersonal Constructions", count: 88 },
    { key: "vocab_politics_society", name: "Politics & Society", count: 72 },
    { key: "vocab_arts_culture", name: "Arts & Culture", count: 49 },
    { key: "vocab_technology", name: "Technology", count: 33 },
    { key: "gerund_gerunziu", name: "Gerund", count: 25 },
    { key: "infinitive_long", name: "Long Infinitive", count: 18 },
    { key: "vocative_case", name: "Vocative Case", count: 8 },
    { key: "reported_speech", name: "Reported Speech", count: 6 },
    { key: "numbers_advanced", name: "Advanced Numerals", count: 5 },
    { key: "diminutives_augmentatives", name: "Diminutives", count: 3 },
    { key: "conditional_perfect", name: "Perfect Conditional", count: 3 },
    { key: "pluperfect_tense", name: "Pluperfect", count: 2 },
    { key: "subjunctive_past", name: "Past Subjunctive", count: 0, gap: true },
    { key: "clitic_combinations", name: "Combined Clitics", count: 0, gap: true },
    { key: "word_order_advanced", name: "Advanced Word Order", count: 0, gap: true },
  ]},
  { level: "C1", total: 10, covered: 9, features: [
    { key: "nominalization_complex", name: "Complex Nominalization", count: 64 },
    { key: "passive_reflexive", name: "Reflexive Passive", count: 44 },
    { key: "vocab_philosophy_abstract", name: "Philosophy & Abstract", count: 32 },
    { key: "discourse_markers", name: "Discourse Markers", count: 26 },
    { key: "participle_agreement", name: "Participle Agreement", count: 24 },
    { key: "vocab_science", name: "Science & Research", count: 15 },
    { key: "formal_register", name: "Formal Register", count: 14 },
    { key: "presumptive_mood", name: "Presumptive Mood", count: 14 },
    { key: "idiomatic_expressions", name: "Idiomatic Expressions", count: 2 },
    { key: "aspect_and_aktionsart", name: "Verbal Aspect", count: 0, gap: true },
  ]},
  { level: "C2", total: 8, covered: 6, features: [
    { key: "academic_register", name: "Academic Register", count: 22 },
    { key: "vocab_literary_criticism", name: "Literary Criticism", count: 16 },
    { key: "etymological_awareness", name: "Etymology", count: 9 },
    { key: "pragmatic_competence", name: "Pragmatic Competence", count: 3 },
    { key: "vocab_legal_administrative", name: "Legal Language", count: 2 },
    { key: "stylistic_word_order", name: "Stylistic Word Order", count: 1 },
    { key: "literary_tenses", name: "Literary Tenses", count: 0, gap: true },
    { key: "archaic_regional_forms", name: "Archaic/Regional", count: 0, gap: true },
  ]},
];

const DURATION_DATA = [
  { level: "1.5", avgDuration: 6, count: 9, type: "Crafted dialogues" },
  { level: "3.0", avgDuration: 240, count: 1, type: "Long narrative" },
  { level: "3.5", avgDuration: 4, count: "~100+", type: "Short clips (EU Parliament)" },
  { level: "4.5", avgDuration: 78, count: 8, type: "Long narratives (history, lit, social)" },
  { level: "5.5", avgDuration: 5, count: "~200+", type: "Short clips (EU Parliament)" },
  { level: "7.0", avgDuration: 5, count: "~200+", type: "Short clips (EU Parliament)" },
  { level: "8.0", avgDuration: 119, count: 8, type: "Long narratives (generated)" },
  { level: "8.5", avgDuration: 900, count: 1, type: "Single long piece (Cioran)" },
  { level: "9.5", avgDuration: 128, count: 8, type: "Long narratives (generated)" },
];

const TOPIC_MAP = [
  { topic: "History", levels: ["4.5", "8.0"], count: "4+", status: "strong" },
  { topic: "Literature", levels: ["4.5", "8.0", "9.5"], count: "6+", status: "strong" },
  { topic: "Social Issues", levels: ["4.5", "8.0"], count: "4+", status: "ok" },
  { topic: "Politics/Society", levels: ["3.5", "5.5", "9.5"], count: "many", status: "strong" },
  { topic: "Daily Life/Routine", levels: ["1.5", "3.5", "7.0"], count: "many", status: "ok" },
  { topic: "Philosophy", levels: ["8.0", "8.5", "9.5"], count: "3+", status: "thin" },
  { topic: "Culture/Identity", levels: ["5.5", "7.0", "8.0", "9.5"], count: "many", status: "ok" },
  { topic: "Environment", levels: ["8.0"], count: "1", status: "thin" },
  { topic: "Media/Journalism", levels: ["8.0"], count: "1", status: "thin" },
  { topic: "Introduction/Family/Food", levels: ["1.5"], count: "9", status: "a1-only" },
  { topic: "Academic Research", levels: ["9.5"], count: "1", status: "thin" },
  { topic: "Sociolinguistics", levels: ["9.5"], count: "1", status: "thin" },
];

const ISSUES = [
  { severity: "🔴", title: "Duplicate Content at 1.5", detail: "3 identical \"Introducing Myself\" items (same audio, same text: \"Bună! Mă numesc Maria...\"). Also 2 identical \"Casa mea\" items and 2 identical \"Monday at School\" items. 9 items → effectively ~4 unique items at entry level." },
  { severity: "🔴", title: "Content Desert: 2.0–3.0", detail: "Only 1 item at difficulty 3.0 (a 4-minute narrative). Nothing at 2.0 or 2.5. Learners jump from 6-second beginner dialogues to EU Parliament clips. This is the biggest gap in the entire library." },
  { severity: "🟡", title: "Duration Cliff at 3.5→4.5", detail: "Content at 3.5 averages ~4 seconds (short clips). At 4.5 it jumps to ~78 seconds (full narratives). No medium-length content (15-30 sec) bridges this. Learners need scaffolded listening lengths." },
  { severity: "🟡", title: "Sparse Grammar Tags on High-Difficulty Content", detail: "Items at 8.0-9.5 have only 1-5 grammar tags (mostly definite_article, gender_agreement). The 4.5 items have 12-18 tags. High-difficulty content was batch-generated with minimal language_features metadata." },
  { severity: "🟡", title: "Generic Topics at 8.0-9.5", detail: "Topic labels like \"Complex social issues\" and \"Abstract concepts\" are too vague for content selection. Contrast with 4.5 items that have specific topics like \"The 1989 Revolution\" or \"Eminescu's Poetry\"." },
  { severity: "🟢", title: "6 Feature Gaps (Expected)", detail: "Past subjunctive, combined clitics, advanced word order (B2); verbal aspect (C1); literary tenses, archaic forms (C2). These are either genuinely rare or hard to auto-detect. Not blocking." },
  { severity: "🟢", title: "Strong B1 Coverage", detail: "Subjunctive (437 items), relative clauses (239), passive voice (123) — provides excellent multiple-context exposure for interlanguage development at the most critical acquisition level." },
];

function Bar({ value, max, color = "#3B82F6", height = 16 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ background: "#E5E7EB", borderRadius: 4, height, width: "100%", overflow: "hidden" }}>
      <div style={{ background: color, height: "100%", width: `${pct}%`, borderRadius: 4, transition: "width 0.3s" }} />
    </div>
  );
}

function LevelCard({ data, isExpanded, onToggle }) {
  const pct = Math.round((data.covered / data.total) * 100);
  const color = pct === 100 ? "#10B981" : pct >= 80 ? "#F59E0B" : "#EF4444";
  const gaps = data.features.filter(f => f.gap);
  const thin = data.features.filter(f => !f.gap && f.count <= 5);

  return (
    <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #E5E7EB", marginBottom: 12 }}>
      <div onClick={onToggle} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: color, color: "white", fontWeight: 700, fontSize: 14, padding: "6px 12px", borderRadius: 8, minWidth: 40, textAlign: "center" }}>
          {data.level}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#1F2937" }}>{data.covered}/{data.total} features covered</span>
            <span style={{ fontWeight: 700, fontSize: 14, color }}>{pct}%</span>
          </div>
          <Bar value={data.covered} max={data.total} color={color} height={8} />
        </div>
        <span style={{ fontSize: 18, color: "#9CA3AF" }}>{isExpanded ? "▼" : "▶"}</span>
      </div>

      {isExpanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
          {gaps.length > 0 && (
            <div style={{ marginBottom: 8, padding: "6px 10px", background: "#FEF2F2", borderRadius: 6, fontSize: 12, color: "#991B1B" }}>
              ❌ Gaps: {gaps.map(g => g.name).join(", ")}
            </div>
          )}
          {thin.length > 0 && (
            <div style={{ marginBottom: 8, padding: "6px 10px", background: "#FFFBEB", borderRadius: 6, fontSize: 12, color: "#92400E" }}>
              ⚠️ Thin (≤5 items): {thin.map(t => `${t.name} (${t.count})`).join(", ")}
            </div>
          )}
          <div style={{ display: "grid", gap: 6 }}>
            {data.features.map(f => (
              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 8, opacity: f.gap ? 0.5 : 1 }}>
                <span style={{ fontSize: 12, color: "#6B7280", minWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</span>
                <div style={{ flex: 1 }}><Bar value={f.count} max={data.features[0].count} color={f.gap ? "#EF4444" : f.count <= 5 ? "#F59E0B" : "#3B82F6"} height={10} /></div>
                <span style={{ fontSize: 11, color: "#9CA3AF", minWidth: 36, textAlign: "right" }}>{f.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Audit() {
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [activeTab, setActiveTab] = useState("coverage");

  const tabs = [
    { id: "coverage", label: "📊 Coverage" },
    { id: "structure", label: "📐 Structure" },
    { id: "issues", label: "🔍 Issues" },
    { id: "actions", label: "🎯 Actions" },
  ];

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 680, margin: "0 auto", padding: 16, background: "#F9FAFB", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1F2937", margin: 0 }}>ChaosLimbă Library Audit</h1>
        <p style={{ color: "#6B7280", fontSize: 13, margin: "4px 0 0" }}>1,080+ items · 79 features · A1→C2</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Coverage", value: "92%", sub: "73/79", color: "#10B981" },
          { label: "Items", value: "1,080+", sub: "audio + text", color: "#3B82F6" },
          { label: "Gaps", value: "6", sub: "expected", color: "#F59E0B" },
          { label: "Critical", value: "2", sub: "issues", color: "#EF4444" },
        ].map(c => (
          <div key={c.label} style={{ background: "white", borderRadius: 10, padding: 12, textAlign: "center", border: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: 10, color: "#9CA3AF" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "white", borderRadius: 10, padding: 4, border: "1px solid #E5E7EB" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ flex: 1, padding: "8px 4px", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: activeTab === t.id ? "#3B82F6" : "transparent",
              color: activeTab === t.id ? "white" : "#6B7280",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Coverage Tab */}
      {activeTab === "coverage" && (
        <div>
          {COVERAGE_DATA.map(d => (
            <LevelCard key={d.level} data={d}
              isExpanded={expandedLevel === d.level}
              onToggle={() => setExpandedLevel(expandedLevel === d.level ? null : d.level)}
            />
          ))}
        </div>
      )}

      {/* Structure Tab */}
      {activeTab === "structure" && (
        <div>
          <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #E5E7EB", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1F2937", margin: "0 0 12px" }}>Duration × Difficulty Landscape</h3>
            <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 12px" }}>Each row shows the content format at that difficulty level. Mismatches in duration create scaffolding gaps.</p>
            {DURATION_DATA.map(d => (
              <div key={d.level} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#3B82F6", minWidth: 28 }}>{d.level}</span>
                <div style={{ flex: 1 }}>
                  <Bar value={Math.min(d.avgDuration, 300)} max={300} color={d.avgDuration <= 10 ? "#93C5FD" : d.avgDuration <= 90 ? "#3B82F6" : "#1E3A5F"} height={20} />
                </div>
                <span style={{ fontSize: 11, color: "#6B7280", minWidth: 50, textAlign: "right" }}>{d.avgDuration >= 60 ? `${Math.round(d.avgDuration/60)}m${d.avgDuration%60>0?` ${d.avgDuration%60}s`:''}` : `${d.avgDuration}s`}</span>
                <span style={{ fontSize: 10, color: "#9CA3AF", minWidth: 120 }}>{d.type}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #E5E7EB" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1F2937", margin: "0 0 12px" }}>Topic × Difficulty Coverage</h3>
            {TOPIC_MAP.map(t => (
              <div key={t.topic} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "4px 0" }}>
                <span style={{ fontSize: 12, color: "#1F2937", fontWeight: 500, minWidth: 140 }}>{t.topic}</span>
                <div style={{ display: "flex", gap: 3, flex: 1 }}>
                  {t.levels.map(l => (
                    <span key={l} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#EFF6FF", color: "#3B82F6", fontWeight: 600 }}>{l}</span>
                  ))}
                </div>
                <span style={{
                  fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600,
                  background: t.status === "strong" ? "#D1FAE5" : t.status === "ok" ? "#FEF3C7" : t.status === "thin" ? "#FEE2E2" : "#F3E8FF",
                  color: t.status === "strong" ? "#065F46" : t.status === "ok" ? "#92400E" : t.status === "thin" ? "#991B1B" : "#6B21A8",
                }}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues Tab */}
      {activeTab === "issues" && (
        <div>
          {ISSUES.map((issue, i) => (
            <div key={i} style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #E5E7EB", marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18 }}>{issue.severity}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1F2937", marginBottom: 4 }}>{issue.title}</div>
                  <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{issue.detail}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions Tab */}
      {activeTab === "actions" && (
        <div>
          <div style={{ background: "white", borderRadius: 12, padding: 16, border: "2px solid #EF4444", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#DC2626", margin: "0 0 8px" }}>🔴 Priority 1: Fill the 2.0–3.0 Gap</h3>
            <p style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
              Generate 20-30 items at difficulty 2.0-3.0. These should be <strong>10-20 second clips</strong> bridging beginner dialogues and EU Parliament content. 
              Topics: shopping, asking directions, describing your day, simple opinions. 
              Grammar targets: perfect compus, reflexive verbs, basic connectors, plural nouns.
              <br/><br/>
              <strong>Why urgent:</strong> Without this, learners hit a wall after the 1.5 introductions. The jump to 3.5 EU Parliament clips is too steep.
            </p>
          </div>

          <div style={{ background: "white", borderRadius: 12, padding: 16, border: "2px solid #EF4444", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#DC2626", margin: "0 0 8px" }}>🔴 Priority 2: Deduplicate 1.5 Content</h3>
            <p style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
              Delete 5 duplicate items at difficulty 1.5 (3 identical "Introducing Myself", 2 identical "Casa mea" / school). 
              Then generate 5 <strong>new unique</strong> items to replace them with varied topics: weather, pets, hobbies, school subjects, weekend activities.
            </p>
          </div>

          <div style={{ background: "white", borderRadius: 12, padding: 16, border: "2px solid #F59E0B", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#D97706", margin: "0 0 8px" }}>🟡 Priority 3: Medium-Length Content at 3.5-4.0</h3>
            <p style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
              Create 10-15 items at 15-30 seconds bridging 4-second clips → 78-second narratives. 
              Format: short news summaries, recipe instructions, weather reports, brief personal anecdotes.
            </p>
          </div>

          <div style={{ background: "white", borderRadius: 12, padding: 16, border: "2px solid #F59E0B", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#D97706", margin: "0 0 8px" }}>🟡 Priority 4: Re-tag 8.0-9.5 Content</h3>
            <p style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
              Run the B1-C2 tagger again specifically on the 8.0-9.5 items which currently have minimal grammar tags. 
              These items likely contain genitive case, advanced connectors, passive voice, formal register — they just weren't tagged for it.
              Also: replace vague topic labels with specific descriptors.
            </p>
          </div>

          <div style={{ background: "white", borderRadius: 12, padding: 16, border: "2px solid #10B981", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#059669", margin: "0 0 8px" }}>🟢 Priority 5: Targeted Gap Content</h3>
            <p style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
              Create 3-5 items each for: <strong>past subjunctive</strong> (regret/counterfactual scenarios), <strong>literary tenses</strong> (Creangă/Eminescu excerpts), 
              <strong>archaic forms</strong> (folk tales, regional interviews). 
              Consider reclassifying <strong>verbal aspect</strong> as a teaching concept, not a content tag.
              Re-run tagger with clitic-specific prompt for <strong>combined clitics</strong>.
            </p>
          </div>

          <div style={{ background: "white", borderRadius: 12, padding: 16, border: "2px solid #10B981" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#059669", margin: "0 0 8px" }}>🟢 Priority 6: Topic Diversification</h3>
            <p style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
              Thin topics that need more breadth: <strong>Environment</strong> (only at 8.0), <strong>Philosophy</strong> (only at 8.0+), 
              <strong>Academic Research</strong> (only at 9.5), <strong>Sociolinguistics</strong> (only at 9.5).
              Goal: Each topic should appear at 2+ difficulty levels for spiral revisiting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
