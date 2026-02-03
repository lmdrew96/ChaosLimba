import { db } from '@/lib/db';
import {
  stressMinimalPairs,
  suggestedQuestions,
  readingQuestions,
  tutorOpeningMessages,
} from '@/lib/db/schema';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function seed() {
  console.log('🌱 Seeding curated content tables...');

  try {
    // 1. Stress Minimal Pairs
    console.log('  → stress_minimal_pairs...');
    await db.insert(stressMinimalPairs).values([
      // torturi (suggested)
      { word: 'torturi', stress: 'TOR-tu-ri', meaning: 'cakes', example: 'Vreau două torturi de ciocolată.', isSuggested: true },
      { word: 'torturi', stress: 'tor-TU-ri', meaning: 'tortures', example: 'Torturile din război au fost oribile.', isSuggested: false },
      // masa (suggested)
      { word: 'masa', stress: 'MA-sa', meaning: 'table', example: 'Pune cartea pe masă.', isSuggested: true },
      { word: 'masa', stress: 'ma-SA', meaning: 'mass/crowd', example: 'Masa de oameni se aduna în piață.', isSuggested: false },
      // copii (suggested)
      { word: 'copii', stress: 'CO-pii', meaning: 'children', example: 'Copiii se joacă în parc.', isSuggested: true },
      { word: 'copii', stress: 'co-PII', meaning: 'copies', example: 'Fă trei copii ale documentului.', isSuggested: false },
      // cara (suggested)
      { word: 'cara', stress: 'CA-ra', meaning: 'face (noun)', example: 'Are o față frumoasă.', isSuggested: true },
      { word: 'cara', stress: 'ca-RA', meaning: 'gray (color)', example: 'Cerul e cărăși gri astăzi.', isSuggested: false },
      // acum (suggested)
      { word: 'acum', stress: 'A-cum', meaning: 'now', example: 'Trebuie să plec acum.', isSuggested: true },
      { word: 'acum', stress: 'a-CUM', meaning: 'just now/recently', example: 'Acum am ajuns acasă.', isSuggested: false },
      // mintea (suggested, no pairs data yet)
      { word: 'mintea', stress: 'MIN-tea', meaning: 'the mind', example: 'Mintea lui e foarte ageră.', isSuggested: true },
      { word: 'mintea', stress: 'min-TEA', meaning: 'the mint (herb)', example: 'Mintea din grădină a crescut frumos.', isSuggested: false },
      // politica (suggested)
      { word: 'politica', stress: 'po-LI-ti-ca', meaning: 'politics', example: 'Politica românească este complicată.', isSuggested: true },
      { word: 'politica', stress: 'po-li-TI-ca', meaning: 'the policy', example: 'Politica firmei s-a schimbat.', isSuggested: false },
      // orice (suggested)
      { word: 'orice', stress: 'O-ri-ce', meaning: 'any/whatever', example: 'Orice ai face, fii atent.', isSuggested: true },
      { word: 'orice', stress: 'o-RI-ce', meaning: 'any (emphatic)', example: 'Oricum ar fi, eu sunt de acord.', isSuggested: false },
      // vedere (suggested)
      { word: 'vedere', stress: 'VE-de-re', meaning: 'view/sight', example: 'Ce vedere frumoasă!', isSuggested: true },
      { word: 'vedere', stress: 've-DE-re', meaning: 'postcard', example: 'Am trimis o vedere din vacanță.', isSuggested: false },
      // omul (suggested)
      { word: 'omul', stress: 'O-mul', meaning: 'the man', example: 'Omul de la fereastră privește afară.', isSuggested: true },
      { word: 'omul', stress: 'o-MUL', meaning: 'the snowman', example: 'Copiii au făcut un omul de zăpadă.', isSuggested: false },
    ]);
    console.log('  ✅ stress_minimal_pairs seeded');

    // 2. Suggested Questions
    console.log('  → suggested_questions...');
    await db.insert(suggestedQuestions).values([
      { question: 'Explain the Romanian genitive case', category: 'grammar', sortOrder: 0 },
      { question: "What's the difference between pe and la?", category: 'grammar', sortOrder: 1 },
      { question: 'How do verb conjugations work in Romanian?', category: 'grammar', sortOrder: 2 },
      { question: 'Tell me about Romanian diacritics', category: 'writing', sortOrder: 3 },
      { question: 'What are the Romanian definite articles?', category: 'grammar', sortOrder: 4 },
      { question: 'How does word order work in Romanian?', category: 'grammar', sortOrder: 5 },
    ]);
    console.log('  ✅ suggested_questions seeded');

    // 3. Reading Questions
    console.log('  → reading_questions...');
    await db.insert(readingQuestions).values([
      {
        level: 'A1',
        passage: 'Bună ziua! Mă numesc Maria. Eu sunt din București. Am 25 de ani.',
        question: 'Cum se numește femeia?',
        options: ['Ana', 'Maria', 'Elena', 'Ioana'],
        correctIndex: 1,
        sortOrder: 0,
      },
      {
        level: 'A2',
        passage: 'Astăzi mergem la piață. Vrem să cumpărăm legume proaspete: roșii, castraveți și ardei. Mama pregătește o salată pentru cină.',
        question: 'Ce vor să cumpere de la piață?',
        options: ['Fructe', 'Carne', 'Legume', 'Pâine'],
        correctIndex: 2,
        sortOrder: 1,
      },
      {
        level: 'B1',
        passage: 'România este situată în sud-estul Europei. Capitala țării este București, cel mai mare oraș din țară. Limba oficială este româna, o limbă romanică derivată din latină.',
        question: 'Din ce limbă derivă limba română?',
        options: ['Slavă', 'Greacă', 'Latină', 'Germană'],
        correctIndex: 2,
        sortOrder: 2,
      },
      {
        level: 'B2',
        passage: 'Transfăgărășanul este un drum montan spectaculos care traversează Munții Făgăraș. Construit în anii 1970, drumul a fost conceput inițial pentru scopuri militare, dar a devenit una dintre cele mai populare atracții turistice din România.',
        question: 'Care a fost scopul inițial al construcției Transfăgărășanului?',
        options: ['Turism', 'Militar', 'Comercial', 'Agricol'],
        correctIndex: 1,
        sortOrder: 3,
      },
    ]);
    console.log('  ✅ reading_questions seeded');

    // 4. Tutor Opening Messages
    console.log('  → tutor_opening_messages...');
    await db.insert(tutorOpeningMessages).values([
      {
        selfAssessmentKey: 'complete_beginner',
        message: `Bună! 👋 Welcome to ChaosLimbă! I see you're just starting your Romanian journey - that's exciting!\n\nDon't worry, I'll speak mostly in English. Let's chat a bit so I can understand where you are. What brought you to learning Romanian?`,
      },
      {
        selfAssessmentKey: 'some_basics',
        message: `Bună ziua! 👋 Welcome to ChaosLimbă! I see you already know some basics - foarte bine!\n\nLet's have a quick chat so I can find your level. Poți să-mi spui, in Romanian or English, what you already know?`,
      },
      {
        selfAssessmentKey: 'intermediate',
        message: `Bună! 👋 Bine ai venit la ChaosLimbă! Văd că ai deja experiență cu româna.\n\nHai să vorbim puțin ca să văd nivelul tău exact. Cum ai învățat limba română până acum?`,
      },
      {
        selfAssessmentKey: 'advanced',
        message: `Salut! 🎭 Bine ai venit la ChaosLimbă! Înțeleg că ești destul de avansat cu limba română.\n\nHai să vedem - povestește-mi puțin despre experiența ta cu româna. Unde ai învățat-o și cât de des o folosești?`,
      },
    ]);
    console.log('  ✅ tutor_opening_messages seeded');

    console.log('\n🎉 All curated content tables seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to seed curated content:', error);
  }

  process.exit(0);
}

seed();
