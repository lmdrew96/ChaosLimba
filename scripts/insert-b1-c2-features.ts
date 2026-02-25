/**
 * Phase 1: Insert B1–C2 grammar features into grammar_feature_map
 *
 * Inserts 48 new features (B1: 15, B2: 15, C1: 10, C2: 8) with ON CONFLICT DO NOTHING
 * so it's safe to re-run (idempotent).
 *
 * Usage: npx tsx scripts/insert-b1-c2-features.ts
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

interface Feature {
  feature_key: string;
  feature_name: string;
  cefr_level: string;
  category: string;
  description: string;
  prerequisites: string[];
  sort_order: number;
}

// ─── B1 Features ──────────────────────────────────────────────────────────────
const b1Features: Feature[] = [
  {
    feature_key: 'subjunctive_sa',
    feature_name: 'Subjunctive with "să"',
    cefr_level: 'B1',
    category: 'grammar',
    description: 'Subjunctive mood formed with "să" + conjugated verb: Vreau să merg (I want to go), Trebuie să fac (I must do). Required after many verbs and expressions.',
    prerequisites: ['present_tense_regular_group1'],
    sort_order: 1,
  },
  {
    feature_key: 'present_tense_irregular',
    feature_name: 'Irregular Present Tense Verbs',
    cefr_level: 'B1',
    category: 'grammar',
    description: 'Common verbs with irregular present forms: a face (fac), a ști (știu), a veni (vin), a putea (pot), a vrea (vreau), a da (dau), a lua (iau).',
    prerequisites: ['present_tense_regular_group1'],
    sort_order: 2,
  },
  {
    feature_key: 'imperfect_tense',
    feature_name: 'Imperfect Tense (Imperfectul)',
    cefr_level: 'B1',
    category: 'grammar',
    description: 'Past tense for habitual/ongoing actions: mergeam (I was going/used to go), făceam (I was doing). Endings: -am, -ai, -a, -am, -ați, -au.',
    prerequisites: ['past_tense_perfect_compus'],
    sort_order: 3,
  },
  {
    feature_key: 'future_formal_voi',
    feature_name: 'Formal Future: voi + infinitive',
    cefr_level: 'B1',
    category: 'grammar',
    description: 'Literary/formal future tense: voi merge (I will go), va face (he will do). Less common in speech than "o să" but used in writing.',
    prerequisites: ['future_informal_o_sa'],
    sort_order: 4,
  },
  {
    feature_key: 'conditional_present',
    feature_name: 'Present Conditional (Condiționalul prezent)',
    cefr_level: 'B1',
    category: 'grammar',
    description: 'Conditional mood using aș/ai/ar/am/ați/ar + infinitive: Aș vrea (I would like), Ar fi bine (It would be good).',
    prerequisites: ['future_informal_o_sa'],
    sort_order: 5,
  },
  {
    feature_key: 'genitive_dative_case',
    feature_name: 'Genitive-Dative Case Forms',
    cefr_level: 'B1',
    category: 'grammar',
    description: 'Noun/article forms for possession and indirect objects. Masculine: băiatului (of/to the boy). Feminine: fetei (of/to the girl). Often identical forms for genitive and dative.',
    prerequisites: ['definite_article', 'dative_pronouns'],
    sort_order: 6,
  },
  {
    feature_key: 'relative_clauses_care',
    feature_name: 'Relative Clauses with "care"',
    cefr_level: 'B1',
    category: 'grammar',
    description: 'Forming relative clauses: Omul care vorbește (The man who speaks), Cartea pe care o citesc (The book which I read). "Care" is invariable but uses "pe care" for direct objects.',
    prerequisites: ['accusative_pronouns', 'basic_connectors'],
    sort_order: 7,
  },
  {
    feature_key: 'advanced_connectors',
    feature_name: 'Advanced Connectors: deși, totuși, cu toate că',
    cefr_level: 'B1',
    category: 'grammar',
    description: 'Complex conjunctions: deși/cu toate că (although), totuși (however), prin urmare (therefore), în schimb (on the other hand), fie...fie (either...or).',
    prerequisites: ['basic_connectors'],
    sort_order: 8,
  },
  {
    feature_key: 'passive_voice',
    feature_name: 'Passive Voice (Diateza pasivă)',
    cefr_level: 'B1',
    category: 'grammar',
    description: 'Passive with "a fi" + past participle: Cartea este citită (The book is read), Casa a fost construită (The house was built). Participle agrees in gender/number.',
    prerequisites: ['past_tense_perfect_compus', 'gender_agreement'],
    sort_order: 9,
  },
  {
    feature_key: 'clitic_doubling',
    feature_name: 'Clitic Doubling',
    cefr_level: 'B1',
    category: 'grammar',
    description: 'Redundant pronoun construction required in Romanian: Îl văd pe Ion (I see Ion — lit. "Him I-see on Ion"). Mandatory with specific direct objects using "pe".',
    prerequisites: ['accusative_pronouns'],
    sort_order: 10,
  },
  {
    feature_key: 'present_tense_group2_3_4',
    feature_name: 'Present Tense: Group II, III, IV Verbs',
    cefr_level: 'B1',
    category: 'grammar',
    description: 'Conjugation patterns for non-group-I verbs. Group II (-ea): a vedea → văd. Group III (-e): a merge → merg. Group IV (-î/-i): a hotărî → hotărăsc, a dormi → dorm.',
    prerequisites: ['present_tense_regular_group1'],
    sort_order: 11,
  },
  {
    feature_key: 'adverb_formation',
    feature_name: 'Adverb Formation & Placement',
    cefr_level: 'B1',
    category: 'grammar',
    description: 'Forming adverbs from adjectives (frumos→frumos, rapid→rapid) and placement rules. Common adverbs: bine, rău, repede, încet, deja, încă, mereu.',
    prerequisites: ['comparative_adjectives'],
    sort_order: 12,
  },
  {
    feature_key: 'vocab_education',
    feature_name: 'Education & Academic Life',
    cefr_level: 'B1',
    category: 'vocabulary_domain',
    description: 'universitate, facultate, curs, examen, notă, profesor, student, bibliotecă, diplomă, bursă, a studia, a absolvi.',
    prerequisites: ['vocab_work'],
    sort_order: 13,
  },
  {
    feature_key: 'vocab_emotions',
    feature_name: 'Emotions & Feelings',
    cefr_level: 'B1',
    category: 'vocabulary_domain',
    description: 'fericit, trist, supărat, speriat, îngrijorat, entuziasmat, dezamăgit, mândru, rușinat, recunoscător.',
    prerequisites: [],
    sort_order: 14,
  },
  {
    feature_key: 'vocab_nature',
    feature_name: 'Nature & Environment',
    cefr_level: 'B1',
    category: 'vocabulary_domain',
    description: 'munte, râu, lac, pădure, mare, plajă, floare, copac, animal, mediu, poluare, climă.',
    prerequisites: ['vocab_weather'],
    sort_order: 15,
  },
];

// ─── B2 Features ──────────────────────────────────────────────────────────────
const b2Features: Feature[] = [
  {
    feature_key: 'pluperfect_tense',
    feature_name: 'Pluperfect (Mai mult ca perfectul)',
    cefr_level: 'B2',
    category: 'grammar',
    description: 'Past before past: mergesem (I had gone), făcusem (I had done). Formed from imperfect stem + special endings. Used for sequencing past events.',
    prerequisites: ['imperfect_tense'],
    sort_order: 1,
  },
  {
    feature_key: 'conditional_perfect',
    feature_name: 'Perfect Conditional (Condiționalul perfect)',
    cefr_level: 'B2',
    category: 'grammar',
    description: 'Would have done: Aș fi mers (I would have gone), Ar fi știut (He would have known). Structure: conditional of "a fi" + past participle.',
    prerequisites: ['conditional_present', 'past_tense_perfect_compus'],
    sort_order: 2,
  },
  {
    feature_key: 'subjunctive_past',
    feature_name: 'Past Subjunctive (Conjunctivul perfect)',
    cefr_level: 'B2',
    category: 'grammar',
    description: 'Să fi mers (to have gone), Să fi făcut (to have done). Used in hypothetical/contrafactual contexts: Ar fi trebuit să fi plecat.',
    prerequisites: ['subjunctive_sa', 'past_tense_perfect_compus'],
    sort_order: 3,
  },
  {
    feature_key: 'gerund_gerunziu',
    feature_name: 'Gerund (Gerunziul)',
    cefr_level: 'B2',
    category: 'grammar',
    description: 'Romanian gerund with -ând/-ind: mergând (going), făcând (doing), citind (reading). Used for simultaneous actions: Mergând pe stradă, am văzut...',
    prerequisites: ['present_tense_group2_3_4'],
    sort_order: 4,
  },
  {
    feature_key: 'infinitive_long',
    feature_name: 'Long Infinitive as Noun',
    cefr_level: 'B2',
    category: 'grammar',
    description: 'Using infinitive forms as abstract nouns: citire (reading), plecare (departure), vedere (sight). Feminine nouns derived from verb infinitives.',
    prerequisites: ['subjunctive_sa'],
    sort_order: 5,
  },
  {
    feature_key: 'reported_speech',
    feature_name: 'Reported/Indirect Speech',
    cefr_level: 'B2',
    category: 'grammar',
    description: 'Converting direct to indirect speech: El a spus că merge (He said he\'s going). Tense shifting, pronoun changes, and conjunction "că".',
    prerequisites: ['past_tense_perfect_compus', 'subjunctive_sa'],
    sort_order: 6,
  },
  {
    feature_key: 'clitic_combinations',
    feature_name: 'Combined Clitic Pronouns',
    cefr_level: 'B2',
    category: 'grammar',
    description: 'Two clitics together: Mi-a dat (He gave me), Ți-l dau (I give it to you), I-am spus (I told him/her). Complex ordering and contraction rules.',
    prerequisites: ['clitic_doubling', 'dative_pronouns'],
    sort_order: 7,
  },
  {
    feature_key: 'vocative_case',
    feature_name: 'Vocative Case',
    cefr_level: 'B2',
    category: 'grammar',
    description: 'Direct address forms: Ioane! (John!), mamă! (mom!), dragă! (dear!), doamnă! (madam!). Special endings vary by gender and noun type.',
    prerequisites: ['genitive_dative_case'],
    sort_order: 8,
  },
  {
    feature_key: 'word_order_advanced',
    feature_name: 'Advanced Word Order & Topicalization',
    cefr_level: 'B2',
    category: 'grammar',
    description: 'Flexible SVO order for emphasis: Cartea am citit-o (The book, I read IT). Topic-comment structure, fronting, and clitic resumption.',
    prerequisites: ['clitic_doubling', 'relative_clauses_care'],
    sort_order: 9,
  },
  {
    feature_key: 'impersonal_constructions',
    feature_name: 'Impersonal Constructions',
    cefr_level: 'B2',
    category: 'grammar',
    description: 'Subjectless constructions: Se pare că (It seems that), Trebuie să (One must), Se poate (It\'s possible), E nevoie de (There\'s need of).',
    prerequisites: ['subjunctive_sa', 'reflexive_verbs'],
    sort_order: 10,
  },
  {
    feature_key: 'diminutives_augmentatives',
    feature_name: 'Diminutives & Augmentatives',
    cefr_level: 'B2',
    category: 'grammar',
    description: 'Affective suffixes: -el/-ică (diminutive), -oi/-oaie (augmentative). căsuță (little house), fetiță (little girl), băiețel (little boy). Expressive and culturally important.',
    prerequisites: ['gender_agreement', 'plural_nouns'],
    sort_order: 11,
  },
  {
    feature_key: 'numbers_advanced',
    feature_name: 'Advanced Numerals & Quantifiers',
    cefr_level: 'B2',
    category: 'grammar',
    description: 'Ordinal numbers (primul, al doilea), fractions (jumătate, sfert), collective numerals (amândoi), approximations (vreo, cam). Agreement patterns.',
    prerequisites: ['vocab_numbers', 'gender_agreement'],
    sort_order: 12,
  },
  {
    feature_key: 'vocab_politics_society',
    feature_name: 'Politics & Society',
    cefr_level: 'B2',
    category: 'vocabulary_domain',
    description: 'guvern, alegeri, democrație, drept, lege, cetățean, societate, politică, libertate, protest.',
    prerequisites: ['vocab_education'],
    sort_order: 13,
  },
  {
    feature_key: 'vocab_arts_culture',
    feature_name: 'Arts & Culture',
    cefr_level: 'B2',
    category: 'vocabulary_domain',
    description: 'artă, muzică, film, teatru, pictură, sculptor, operă, poezie, roman, festival, muzeu, expoziție.',
    prerequisites: [],
    sort_order: 14,
  },
  {
    feature_key: 'vocab_technology',
    feature_name: 'Technology & Digital',
    cefr_level: 'B2',
    category: 'vocabulary_domain',
    description: 'calculator, telefon, internet, aplicație, program, date, rețea, inteligență artificială, ecran, parolă.',
    prerequisites: [],
    sort_order: 15,
  },
];

// ─── C1 Features ──────────────────────────────────────────────────────────────
const c1Features: Feature[] = [
  {
    feature_key: 'presumptive_mood',
    feature_name: 'Presumptive Mood (Modul prezumtiv)',
    cefr_level: 'C1',
    category: 'grammar',
    description: 'Expressing supposition: O fi știind (He probably knows), Vor fi plecând (They\'re probably leaving). Unique to Romanian among Romance languages.',
    prerequisites: ['gerund_gerunziu', 'future_formal_voi'],
    sort_order: 1,
  },
  {
    feature_key: 'passive_reflexive',
    feature_name: 'Reflexive Passive (Pasivul reflexiv)',
    cefr_level: 'C1',
    category: 'grammar',
    description: 'Se vorbește română aici (Romanian is spoken here), Se construiesc case noi (New houses are being built). Passive meaning through reflexive "se".',
    prerequisites: ['passive_voice', 'reflexive_verbs'],
    sort_order: 2,
  },
  {
    feature_key: 'nominalization_complex',
    feature_name: 'Complex Nominalization Patterns',
    cefr_level: 'C1',
    category: 'grammar',
    description: 'Turning clauses into noun phrases: Faptul că a plecat... (The fact that he left...), Ceea ce contează... (What matters...). Academic/formal register.',
    prerequisites: ['relative_clauses_care', 'infinitive_long'],
    sort_order: 3,
  },
  {
    feature_key: 'discourse_markers',
    feature_name: 'Discourse Markers & Hedging',
    cefr_level: 'C1',
    category: 'grammar',
    description: 'Pragmatic markers: de fapt (actually), oricum (anyway), într-adevăr (indeed), în fond (basically), parcă (seemingly/I think), zice-se (they say).',
    prerequisites: ['advanced_connectors'],
    sort_order: 4,
  },
  {
    feature_key: 'aspect_and_aktionsart',
    feature_name: 'Verbal Aspect & Aktionsart',
    cefr_level: 'C1',
    category: 'grammar',
    description: 'Expressing aspect through prefixes and context: a face/a desface, a scrie/a descrie, a pune/a depune. Perfective vs imperfective nuances.',
    prerequisites: ['imperfect_tense', 'past_tense_perfect_compus'],
    sort_order: 5,
  },
  {
    feature_key: 'formal_register',
    feature_name: 'Formal Register & Dumneavoastră',
    cefr_level: 'C1',
    category: 'grammar',
    description: 'Polite address using dumneavoastră (2nd pl.), dumneaei/dumnealui (3rd). Formal verb agreement, letter/email conventions, institutional language.',
    prerequisites: ['subjunctive_sa', 'conditional_present'],
    sort_order: 6,
  },
  {
    feature_key: 'idiomatic_expressions',
    feature_name: 'Idiomatic Expressions & Collocations',
    cefr_level: 'C1',
    category: 'grammar',
    description: 'Fixed expressions: a-i sări muștarul (to lose one\'s temper), a da de gol (to expose/reveal), a o lua la sănătoasa (to run away). Cultural depth.',
    prerequisites: ['advanced_connectors'],
    sort_order: 7,
  },
  {
    feature_key: 'participle_agreement',
    feature_name: 'Participle & Agreement Patterns',
    cefr_level: 'C1',
    category: 'grammar',
    description: 'Past participle agreement in compound structures: Cărțile au fost citite (The books were read — fem. pl. agreement). Participle as adjective: ușa deschisă.',
    prerequisites: ['passive_voice', 'gender_agreement', 'plural_nouns'],
    sort_order: 8,
  },
  {
    feature_key: 'vocab_philosophy_abstract',
    feature_name: 'Abstract & Philosophical Concepts',
    cefr_level: 'C1',
    category: 'vocabulary_domain',
    description: 'libertate, justiție, adevăr, conștiință, existență, morală, identitate, destin, sens, cunoaștere.',
    prerequisites: ['vocab_politics_society'],
    sort_order: 9,
  },
  {
    feature_key: 'vocab_science',
    feature_name: 'Science & Research',
    cefr_level: 'C1',
    category: 'vocabulary_domain',
    description: 'cercetare, experiment, teorie, descoperire, ipoteză, analiză, dovadă, studiu, laborator, concluzie.',
    prerequisites: ['vocab_technology'],
    sort_order: 10,
  },
];

// ─── C2 Features ──────────────────────────────────────────────────────────────
const c2Features: Feature[] = [
  {
    feature_key: 'literary_tenses',
    feature_name: 'Literary Tenses: Perfect Simplu & Mai mult ca perfectul literar',
    cefr_level: 'C2',
    category: 'grammar',
    description: 'Literary past (Perfect simplu): merse, făcu, veni — used in literature, journalism, regional speech. Highly marked register.',
    prerequisites: ['pluperfect_tense'],
    sort_order: 1,
  },
  {
    feature_key: 'stylistic_word_order',
    feature_name: 'Stylistic & Poetic Word Order',
    cefr_level: 'C2',
    category: 'grammar',
    description: 'Inverted and marked word orders for literary/rhetorical effect. Post-verbal subjects, sentence-final focus, rhythmic structuring in formal prose and poetry.',
    prerequisites: ['word_order_advanced'],
    sort_order: 2,
  },
  {
    feature_key: 'archaic_regional_forms',
    feature_name: 'Archaic & Regional Variants',
    cefr_level: 'C2',
    category: 'grammar',
    description: 'Historical forms encountered in literature: dânsa/dânsul (she/he — older polite), -ră ending (ei merseră), Moldovan/Transylvanian dialectal features.',
    prerequisites: ['literary_tenses', 'formal_register'],
    sort_order: 3,
  },
  {
    feature_key: 'academic_register',
    feature_name: 'Academic & Institutional Register',
    cefr_level: 'C2',
    category: 'grammar',
    description: 'Writing conventions for academic Romanian: impersonal structures, nominalized arguments, hedging devices, citation integration, formal cohesion devices.',
    prerequisites: ['nominalization_complex', 'discourse_markers', 'formal_register'],
    sort_order: 4,
  },
  {
    feature_key: 'etymological_awareness',
    feature_name: 'Etymological Awareness & Word Families',
    cefr_level: 'C2',
    category: 'grammar',
    description: 'Understanding Latin roots, Slavic borrowings, and neologism patterns. Word family analysis: a vedea/vedere/vizibil/viziune. Register choices: Latin vs Slavic doublets.',
    prerequisites: ['idiomatic_expressions'],
    sort_order: 5,
  },
  {
    feature_key: 'pragmatic_competence',
    feature_name: 'Pragmatic & Sociolinguistic Competence',
    cefr_level: 'C2',
    category: 'grammar',
    description: 'Appropriate register shifting, politeness strategies, humor, irony, understatement. Understanding cultural pragmatics: when to use tu vs dumneavoastră, implicit communication norms.',
    prerequisites: ['formal_register', 'idiomatic_expressions', 'discourse_markers'],
    sort_order: 6,
  },
  {
    feature_key: 'vocab_legal_administrative',
    feature_name: 'Legal & Administrative Language',
    cefr_level: 'C2',
    category: 'vocabulary_domain',
    description: 'lege, contract, instanță, hotărâre, proces, avocat, drept civil, reclamant, pârât, jurisprudență.',
    prerequisites: ['vocab_politics_society'],
    sort_order: 7,
  },
  {
    feature_key: 'vocab_literary_criticism',
    feature_name: 'Literary Analysis & Criticism',
    cefr_level: 'C2',
    category: 'vocabulary_domain',
    description: 'metaforă, simbolism, narator, perspectivă, temă, motiv, stil, curent literar, interbelic, postmodernism.',
    prerequisites: ['vocab_arts_culture'],
    sort_order: 8,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function insertFeatures() {
  console.log('\n🔧 Phase 1: Insert B1–C2 Grammar Features');
  console.log('─'.repeat(50));

  const levels: { name: string; features: Feature[] }[] = [
    { name: 'B1', features: b1Features },
    { name: 'B2', features: b2Features },
    { name: 'C1', features: c1Features },
    { name: 'C2', features: c2Features },
  ];

  let totalInserted = 0;

  for (const level of levels) {
    let levelInserted = 0;

    for (const f of level.features) {
      try {
        const result = await sql`
          INSERT INTO grammar_feature_map (
            id, feature_key, feature_name, cefr_level, category, description, prerequisites, sort_order, created_at
          ) VALUES (
            gen_random_uuid(),
            ${f.feature_key},
            ${f.feature_name},
            ${f.cefr_level},
            ${f.category},
            ${f.description},
            ${JSON.stringify(f.prerequisites)}::jsonb,
            ${f.sort_order},
            NOW()
          )
          ON CONFLICT (feature_key) DO NOTHING
        `;
        levelInserted++;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Failed to insert ${f.feature_key}: ${msg}`);
      }
    }

    console.log(`   ✅ ${level.name}: ${levelInserted} features inserted`);
    totalInserted += levelInserted;
  }

  console.log(`\n📊 Total: ${totalInserted} features inserted`);

  // Verify counts
  console.log('\n🔍 Verifying feature counts per CEFR level...\n');

  const counts = await sql`
    SELECT cefr_level, COUNT(*) as count
    FROM grammar_feature_map
    GROUP BY cefr_level
    ORDER BY cefr_level
  `;

  let grandTotal = 0;
  for (const row of counts) {
    const count = Number(row.count);
    grandTotal += count;
    console.log(`   ${row.cefr_level}: ${count} features`);
  }
  console.log(`\n   Total: ${grandTotal} features`);

  const expected = { A1: 16, A2: 15, B1: 15, B2: 15, C1: 10, C2: 8 };
  const expectedTotal = Object.values(expected).reduce((a, b) => a + b, 0);

  if (grandTotal === expectedTotal) {
    console.log(`\n✅ Perfect — ${grandTotal} features match expected ${expectedTotal}!`);
  } else {
    console.log(`\n⚠️  Expected ${expectedTotal} total features, got ${grandTotal}. Check for duplicates or missing entries.`);
  }

  console.log('\n🏁 Phase 1 complete!\n');
  process.exit(0);
}

insertFeatures();
