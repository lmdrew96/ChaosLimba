import { db } from '@/lib/db';
import { grammarFeatureMap } from '@/lib/db/schema';
import type { NewGrammarFeature } from '@/lib/db/schema';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const features: NewGrammarFeature[] = [
  // ═══════════════════════════════════════
  // A1 GRAMMAR FEATURES
  // ═══════════════════════════════════════
  {
    featureKey: 'present_tense_a_fi',
    featureName: 'Present Tense: a fi (to be)',
    cefrLevel: 'A1',
    category: 'grammar',
    description: 'Conjugation of "a fi" (to be): sunt, ești, este, suntem, sunteți, sunt. The most fundamental Romanian verb.',
    prerequisites: [],
    sortOrder: 1,
  },
  {
    featureKey: 'present_tense_a_avea',
    featureName: 'Present Tense: a avea (to have)',
    cefrLevel: 'A1',
    category: 'grammar',
    description: 'Conjugation of "a avea" (to have): am, ai, are, avem, aveți, au. Used for possession and as auxiliary.',
    prerequisites: ['present_tense_a_fi'],
    sortOrder: 2,
  },
  {
    featureKey: 'present_tense_regular_group1',
    featureName: 'Present Tense: Regular -a Verbs',
    cefrLevel: 'A1',
    category: 'grammar',
    description: 'Regular first conjugation verbs ending in -a that follow the -ez/-ează pattern: a lucra (lucrează), a visa (visează), a parca (parchează), a dansa (dansează). Pattern: -ez, -ezi, -ează, -ăm, -ați, -ează. NOTE: Some -a verbs like "a cânta" (cântă) and "a mânca" (mănâncă) have irregular present tense forms and do NOT follow this pattern.',
    prerequisites: ['present_tense_a_fi'],
    sortOrder: 3,
  },
  {
    featureKey: 'definite_article',
    featureName: 'Definite Articles (Articolul Hotărât)',
    cefrLevel: 'A1',
    category: 'grammar',
    description: 'Romanian definite articles are suffixed to nouns: -ul/-le (masc), -a (fem). carte→cartea, om→omul, câine→câinele.',
    prerequisites: ['gender_agreement'],
    sortOrder: 5,
  },
  {
    featureKey: 'indefinite_article',
    featureName: 'Indefinite Articles (un/o)',
    cefrLevel: 'A1',
    category: 'grammar',
    description: 'Indefinite articles: "un" (masculine), "o" (feminine). un băiat, o fată, un câine, o carte.',
    prerequisites: [],
    sortOrder: 4,
  },
  {
    featureKey: 'gender_agreement',
    featureName: 'Noun Gender & Adjective Agreement',
    cefrLevel: 'A1',
    category: 'grammar',
    description: 'Romanian nouns are masculine, feminine, or neuter. Adjectives agree: băiat bun / fată bună, om mare / casă mare.',
    prerequisites: [],
    sortOrder: 6,
  },
  {
    featureKey: 'basic_negation',
    featureName: 'Basic Negation with "nu"',
    cefrLevel: 'A1',
    category: 'grammar',
    description: 'Negation by placing "nu" before the verb: Nu sunt, Nu am, Nu merg, Nu vreau. Simple and consistent.',
    prerequisites: ['present_tense_a_fi'],
    sortOrder: 7,
  },
  {
    featureKey: 'imi_place_construction',
    featureName: 'The "a-i plăcea" Construction',
    cefrLevel: 'A1',
    category: 'grammar',
    description: 'Expressing likes: Îmi place (I like), Îți place (you like), Îi place (he/she likes). Works like Spanish "gustar" — the thing liked is the subject.',
    prerequisites: ['present_tense_a_fi'],
    sortOrder: 8,
  },
  {
    featureKey: 'basic_questions',
    featureName: 'Question Words: ce, unde, cine, cum, când',
    cefrLevel: 'A1',
    category: 'grammar',
    description: 'Basic question words: ce (what), unde (where), cine (who), cum (how), când (when). Word order: Q-word + verb + subject.',
    prerequisites: [],
    sortOrder: 9,
  },
  {
    featureKey: 'basic_prepositions',
    featureName: 'Basic Prepositions: în, la, din, pe, cu',
    cefrLevel: 'A1',
    category: 'grammar',
    description: 'High-frequency prepositions: în (in), la (at/to), din (from), pe (on), cu (with). în casă, la școală, din România, pe masă, cu mine.',
    prerequisites: [],
    sortOrder: 10,
  },

  // ═══════════════════════════════════════
  // A1 VOCABULARY DOMAINS
  // ═══════════════════════════════════════
  {
    featureKey: 'vocab_greetings',
    featureName: 'Greetings & Politeness',
    cefrLevel: 'A1',
    category: 'vocabulary_domain',
    description: 'Bună, Bună ziua, Bună seara, Salut, Mulțumesc, Te rog, Cu plăcere, La revedere, Noapte bună.',
    prerequisites: [],
    sortOrder: 1,
  },
  {
    featureKey: 'vocab_family',
    featureName: 'Family Members',
    cefrLevel: 'A1',
    category: 'vocabulary_domain',
    description: 'mamă, tată, frate, soră, bunic/bunică, soț/soție, copil, fiică, fiu, familie.',
    prerequisites: [],
    sortOrder: 2,
  },
  {
    featureKey: 'vocab_food',
    featureName: 'Food & Drinks',
    cefrLevel: 'A1',
    category: 'vocabulary_domain',
    description: 'pâine, apă, cafea, lapte, carne, legume, fructe, supă, mâncare, a mânca, a bea.',
    prerequisites: [],
    sortOrder: 3,
  },
  {
    featureKey: 'vocab_colors',
    featureName: 'Colors',
    cefrLevel: 'A1',
    category: 'vocabulary_domain',
    description: 'roșu, albastru, verde, galben, alb, negru, portocaliu, roz, maro, gri.',
    prerequisites: [],
    sortOrder: 4,
  },
  {
    featureKey: 'vocab_numbers',
    featureName: 'Numbers 1-100',
    cefrLevel: 'A1',
    category: 'vocabulary_domain',
    description: 'unu, doi, trei...zece, douăzeci, treizeci...o sută. Romanian numbers: 11-19 use "-sprezece" suffix.',
    prerequisites: [],
    sortOrder: 5,
  },
  {
    featureKey: 'vocab_time_basic',
    featureName: 'Basic Time Expressions',
    cefrLevel: 'A1',
    category: 'vocabulary_domain',
    description: 'azi/astăzi (today), mâine (tomorrow), ieri (yesterday), dimineață, seară, noapte, ora, acum (now), apoi (then).',
    prerequisites: [],
    sortOrder: 6,
  },

  // ═══════════════════════════════════════
  // A2 GRAMMAR FEATURES
  // ═══════════════════════════════════════
  {
    featureKey: 'past_tense_perfect_compus',
    featureName: 'Past Tense: Perfect Compus',
    cefrLevel: 'A2',
    category: 'grammar',
    description: 'Compound past tense using "a avea" + past participle: am mers (I went), ai făcut (you did), a fost (he/she was). The main past tense in spoken Romanian.',
    prerequisites: ['present_tense_a_avea'],
    sortOrder: 1,
  },
  {
    featureKey: 'reflexive_verbs',
    featureName: 'Reflexive Verbs',
    cefrLevel: 'A2',
    category: 'grammar',
    description: 'Verbs with reflexive pronouns mă/te/se/ne/vă/se: mă trezesc (I wake up), te duci (you go), se numește (it is called).',
    prerequisites: ['present_tense_regular_group1'],
    sortOrder: 2,
  },
  {
    featureKey: 'accusative_pronouns',
    featureName: 'Accusative Pronouns & "pe"',
    cefrLevel: 'A2',
    category: 'grammar',
    description: 'Direct object pronouns: mă, te, îl/o, ne, vă, îi/le. Personal "pe": Îl văd pe Ion. O sun pe Maria.',
    prerequisites: ['present_tense_regular_group1'],
    sortOrder: 3,
  },
  {
    featureKey: 'dative_pronouns',
    featureName: 'Dative Pronouns: îmi, îți, îi',
    cefrLevel: 'A2',
    category: 'grammar',
    description: 'Indirect object pronouns: îmi (to me), îți (to you), îi (to him/her), ne (to us), vă (to you pl.), le (to them). Îmi dai cartea?',
    prerequisites: ['imi_place_construction'],
    sortOrder: 4,
  },
  {
    featureKey: 'basic_connectors',
    featureName: 'Connectors: și, dar, pentru că, sau',
    cefrLevel: 'A2',
    category: 'grammar',
    description: 'Coordinating conjunctions: și (and), dar (but), sau (or), pentru că (because), deci (so), apoi (then).',
    prerequisites: [],
    sortOrder: 5,
  },
  {
    featureKey: 'comparative_adjectives',
    featureName: 'Comparatives: mai...decât',
    cefrLevel: 'A2',
    category: 'grammar',
    description: 'Comparative constructions: mai + adjective + decât: mai mare decât (bigger than), mai frumos decât (more beautiful than). Superlative: cel mai.',
    prerequisites: ['gender_agreement'],
    sortOrder: 6,
  },
  {
    featureKey: 'future_informal_o_sa',
    featureName: 'Informal Future: o să + subjunctive',
    cefrLevel: 'A2',
    category: 'grammar',
    description: 'Colloquial future tense: o să merg (I will go), o să fac (I will do), o să fie (it will be). Most common future form in spoken Romanian.',
    prerequisites: ['present_tense_regular_group1'],
    sortOrder: 7,
  },
  {
    featureKey: 'imperative_basic',
    featureName: 'Basic Imperative',
    cefrLevel: 'A2',
    category: 'grammar',
    description: 'Command forms: Vino! (Come!), Du-te! (Go!), Stai! (Stay!), Hai! (Let\'s go!), Fă! (Do!). Negative: Nu pleca! (Don\'t leave!).',
    prerequisites: ['present_tense_regular_group1'],
    sortOrder: 8,
  },
  {
    featureKey: 'possession_al_a',
    featureName: 'Possession: al/a/ai/ale',
    cefrLevel: 'A2',
    category: 'grammar',
    description: 'Possessive articles: al meu/a mea (mine), al tău/a ta (yours). Cartea mea, câinele meu, prietenii mei.',
    prerequisites: ['gender_agreement', 'definite_article'],
    sortOrder: 9,
  },
  {
    featureKey: 'plural_nouns',
    featureName: 'Noun Plurals',
    cefrLevel: 'A2',
    category: 'grammar',
    description: 'Romanian plural patterns: -i (masc: băieți), -e (fem: case), -uri (neuter: lucruri). Irregular: om→oameni, copil→copii.',
    prerequisites: ['gender_agreement'],
    sortOrder: 10,
  },

  // ═══════════════════════════════════════
  // A2 VOCABULARY DOMAINS
  // ═══════════════════════════════════════
  {
    featureKey: 'vocab_shopping',
    featureName: 'Shopping & Money',
    cefrLevel: 'A2',
    category: 'vocabulary_domain',
    description: 'a cumpăra, magazin, piață, preț, scump, ieftin, bani, lei, cât costă?, bon, reducere.',
    prerequisites: ['vocab_numbers'],
    sortOrder: 11,
  },
  {
    featureKey: 'vocab_health',
    featureName: 'Health & Body',
    cefrLevel: 'A2',
    category: 'vocabulary_domain',
    description: 'cap, mână, picior, ochi, gură, stomac, mă doare (it hurts me), doctor, sănătos, bolnav.',
    prerequisites: [],
    sortOrder: 12,
  },
  {
    featureKey: 'vocab_travel',
    featureName: 'Travel & Directions',
    cefrLevel: 'A2',
    category: 'vocabulary_domain',
    description: 'tren, autobuz, avion, bilet, stație, stânga, dreapta, drept înainte, hartă, hotel, aeroport.',
    prerequisites: ['basic_prepositions'],
    sortOrder: 13,
  },
  {
    featureKey: 'vocab_weather',
    featureName: 'Weather',
    cefrLevel: 'A2',
    category: 'vocabulary_domain',
    description: 'soare, ploaie, ninge, vânt, cald, frig, nor, furtună, temperatură, vreme frumoasă/urâtă.',
    prerequisites: [],
    sortOrder: 14,
  },
  {
    featureKey: 'vocab_work',
    featureName: 'Work & Occupations',
    cefrLevel: 'A2',
    category: 'vocabulary_domain',
    description: 'a lucra, birou, profesor, doctor, inginer, student, muncă, job, coleg, șef, programator.',
    prerequisites: [],
    sortOrder: 15,
  },
];

async function seedGrammarFeatures() {
  console.log('🧠 Seeding grammar feature map...');
  console.log(`   ${features.filter(f => f.cefrLevel === 'A1' && f.category === 'grammar').length} A1 grammar features`);
  console.log(`   ${features.filter(f => f.cefrLevel === 'A1' && f.category === 'vocabulary_domain').length} A1 vocab domains`);
  console.log(`   ${features.filter(f => f.cefrLevel === 'A2' && f.category === 'grammar').length} A2 grammar features`);
  console.log(`   ${features.filter(f => f.cefrLevel === 'A2' && f.category === 'vocabulary_domain').length} A2 vocab domains`);
  console.log(`   ${features.length} total features\n`);

  try {
    // Upsert: insert or update description if feature_key already exists
    for (const feature of features) {
      await db
        .insert(grammarFeatureMap)
        .values(feature)
        .onConflictDoUpdate({
          target: grammarFeatureMap.featureKey,
          set: { description: feature.description },
        });
    }

    console.log('✅ Grammar feature map seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to seed grammar features:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedGrammarFeatures();
