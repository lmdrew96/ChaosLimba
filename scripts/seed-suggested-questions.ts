/**
 * Assign CEFR levels to existing suggested_questions + add new ones for full coverage.
 *
 * Usage: npx tsx scripts/seed-suggested-questions.ts
 */
import { db } from '@/lib/db';
import { suggestedQuestions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Step 1: Fix existing rows — assign CEFR levels
const EXISTING_FIXES: { question: string; cefrLevel: string }[] = [
  { question: 'How do verb conjugations work in Romanian?', cefrLevel: 'A1' },
  { question: 'What are the Romanian definite articles?', cefrLevel: 'A1' },
  { question: 'Tell me about Romanian diacritics', cefrLevel: 'A1' },
  { question: "What's the difference between pe and la?", cefrLevel: 'A2' },
  { question: 'How does word order work in Romanian?', cefrLevel: 'A2' },
  { question: 'Explain the Romanian genitive case', cefrLevel: 'B1' },
];

// Step 2: New questions for full CEFR coverage
const NEW_QUESTIONS: { question: string; category: string; cefrLevel: string; sortOrder: number }[] = [
  // A1 — Beginner basics
  { question: "How do I say 'I like' and 'I don't like' in Romanian?", category: 'grammar', cefrLevel: 'A1', sortOrder: 7 },
  { question: 'What are the most common Romanian greetings?', category: 'vocabulary', cefrLevel: 'A1', sortOrder: 8 },
  { question: 'How do I order food in Romanian?', category: 'vocabulary', cefrLevel: 'A1', sortOrder: 9 },
  { question: "How do I ask basic questions like 'where' and 'what'?", category: 'grammar', cefrLevel: 'A1', sortOrder: 10 },

  // A2 — Elementary
  { question: 'How do I talk about what I did yesterday in Romanian?', category: 'grammar', cefrLevel: 'A2', sortOrder: 11 },
  { question: "How do reflexive verbs work? Like 'ma trezesc'?", category: 'grammar', cefrLevel: 'A2', sortOrder: 12 },
  { question: "How do I compare things — like 'bigger' or 'more beautiful'?", category: 'grammar', cefrLevel: 'A2', sortOrder: 13 },
  { question: "What are some common Romanian connectors like 'but' and 'because'?", category: 'grammar', cefrLevel: 'A2', sortOrder: 14 },
  { question: 'How do I ask for directions in Romanian?', category: 'vocabulary', cefrLevel: 'A2', sortOrder: 15 },

  // B1 — Intermediate
  { question: 'When do I use the subjunctive in Romanian?', category: 'grammar', cefrLevel: 'B1', sortOrder: 16 },
  { question: 'How do Romanian noun cases work?', category: 'grammar', cefrLevel: 'B1', sortOrder: 17 },
  { question: 'What are some common Romanian idioms and expressions?', category: 'culture', cefrLevel: 'B1', sortOrder: 18 },
  { question: 'How do I express opinions and disagreement politely?', category: 'grammar', cefrLevel: 'B1', sortOrder: 19 },

  // B2 — Upper Intermediate
  { question: "What's the difference between perfectul compus and perfectul simplu?", category: 'grammar', cefrLevel: 'B2', sortOrder: 20 },
  { question: 'How does the conditional mood work in Romanian?', category: 'grammar', cefrLevel: 'B2', sortOrder: 21 },
  { question: 'Tell me about Romanian cultural customs around holidays', category: 'culture', cefrLevel: 'B2', sortOrder: 22 },
  { question: 'How do Romanians use diminutives in everyday speech?', category: 'grammar', cefrLevel: 'B2', sortOrder: 23 },

  // C1 — Advanced
  { question: 'How do literary and journalistic registers differ in Romanian?', category: 'culture', cefrLevel: 'C1', sortOrder: 24 },
  { question: 'What are the nuances of Romanian aspect and Aktionsart?', category: 'grammar', cefrLevel: 'C1', sortOrder: 25 },
  { question: 'How do regional dialects differ across Romania and Moldova?', category: 'culture', cefrLevel: 'C1', sortOrder: 26 },

  // C2 — Mastery
  { question: 'What Romanian literary tenses appear in classical literature?', category: 'grammar', cefrLevel: 'C2', sortOrder: 27 },
  { question: 'How has Romanian evolved from Vulgar Latin compared to other Romance languages?', category: 'culture', cefrLevel: 'C2', sortOrder: 28 },
];

async function seed() {
  console.log('Seeding suggested questions...\n');

  // Step 1: Update existing questions with CEFR levels
  console.log('Step 1: Assign CEFR levels to existing questions');
  let updated = 0;
  for (const fix of EXISTING_FIXES) {
    const result = await db.update(suggestedQuestions)
      .set({ cefrLevel: fix.cefrLevel as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' })
      .where(eq(suggestedQuestions.question, fix.question))
      .returning({ id: suggestedQuestions.id });

    if (result.length > 0) {
      console.log(`  Updated: "${fix.question}" -> ${fix.cefrLevel}`);
      updated++;
    } else {
      console.log(`  Not found: "${fix.question}"`);
    }
  }
  console.log(`  ${updated}/${EXISTING_FIXES.length} existing questions updated\n`);

  // Step 2: Insert new questions
  console.log('Step 2: Insert new questions for full CEFR coverage');
  const inserted = await db.insert(suggestedQuestions).values(
    NEW_QUESTIONS.map(q => ({
      question: q.question,
      category: q.category,
      cefrLevel: q.cefrLevel as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
      isActive: true,
      sortOrder: q.sortOrder,
    }))
  ).returning({ id: suggestedQuestions.id });

  console.log(`  Inserted ${inserted.length} new questions\n`);

  // Summary
  const all = await db.select().from(suggestedQuestions);
  const byLevel: Record<string, number> = {};
  for (const q of all) {
    const level = q.cefrLevel || 'null';
    byLevel[level] = (byLevel[level] || 0) + 1;
  }
  console.log('Summary:');
  console.log(`  Total: ${all.length} questions`);
  for (const [level, count] of Object.entries(byLevel).sort()) {
    console.log(`  ${level}: ${count}`);
  }

  process.exit(0);
}

seed();
