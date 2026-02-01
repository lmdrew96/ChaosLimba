
import { db } from '@/lib/db';
import { contentItems, NewContentItem } from '@/lib/db/schema';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sampleContent: NewContentItem[] = [
    // A1 Level
    {
        type: 'text',
        title: 'La piață',
        difficultyLevel: '2.0',
        durationSeconds: 120,
        topic: 'Cumpărături',
        textContent: 'Merg la piață. Vreau să cumpăr mere și pere. Cât costă un kilogram de roșii? Îmi place să mănânc fructe proaspete.',
        sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    },

    // A2 Level
    {
        type: 'audio',
        title: 'O zi obișnuită',
        difficultyLevel: '3.0',
        durationSeconds: 240,
        topic: 'Rutina zilnică',
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg', // Valid sample audio
        culturalNotes: 'Cafeaua este o parte importantă a dimineții.',
        sourceAttribution: { creator: 'Google Sounds', license: 'CC-BY' },
    },

    // B1 Level (Target for user)
    {
        type: 'text',
        title: 'Despre vampiri și mituri',
        difficultyLevel: '4.5',
        durationSeconds: 300,
        topic: 'Cultură',
        textContent: 'Dracula este cel mai faimos vampir, dar el este bazat pe un domnitor real: Vlad Țepeș. Vlad nu a fost un vampir, ci un lider care a luptat pentru țara sa. Castelul Bran este adesea asociat cu el, deși Vlad nu a locuit acolo.',
        culturalNotes: 'Vlad Țepeș este considerat un erou național, nu un monstru.',
        sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    },
    // B2 Level
    {
        type: 'text',
        title: 'Sistemul de învățământ',
        difficultyLevel: '6.5',
        durationSeconds: 400,
        topic: 'Educație',
        textContent: 'Sistemul educațional din România a trecut prin multe schimbări în ultimii 30 de ani. De la o programă rigidă în perioada comunistă, la o deschidere către metode occidentale. Totuși, provocările rămân: subfinanțarea și nevoia de modernizare a infrastructurii școlare.',
        sourceAttribution: { creator: 'EduToday', license: 'Original' },
    },

    // C1 Level
    {
        type: 'audio',
        title: 'Filosofia lui Cioran',
        difficultyLevel: '8.5',
        durationSeconds: 900,
        topic: 'Filosofie',
        audioUrl: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rocks_1.ogg',
        culturalNotes: 'Emil Cioran a scris majoritatea operelor sale în franceză.',
        sourceAttribution: { creator: 'Philosophy Podcast', license: 'CC-BY' },
    }
];

async function seed() {
    console.log('🌱 Seeding content...');
    try {
        const inserted = await db.insert(contentItems).values(sampleContent).returning();
        console.log(`✅ Successfully seeded ${inserted.length} content items!`);
    } catch (error) {
        console.error('❌ Failed to seed content:', error);
    }
    process.exit(0);
}

seed();
