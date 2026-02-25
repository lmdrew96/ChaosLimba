import { db } from '@/lib/db';
import { contentItems, NewContentItem } from '@/lib/db/schema';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// =============================================================================
// Priority 1: Fill the 2.0–3.0 content gap
//
// These 25 items bridge beginner A1 dialogues (1.5) → EU Parliament clips (3.5).
// Grammar progression: present tense → past tense → connectors + opinions
// Duration: reading-length text pieces (60-180 seconds)
// =============================================================================

const bridgeContent: NewContentItem[] = [
  // =========================================================================
  // DIFFICULTY 2.0 — Late A1: Present tense, basic vocab, short dialogues
  // =========================================================================
  {
    type: 'text',
    title: 'La magazin',
    difficultyLevel: '2.0',
    durationSeconds: 60,
    topic: 'Cumpărături',
    textContent: `— Bună ziua! Vreau un kilogram de mere, vă rog.
— Sigur. Mai doriți ceva?
— Da, și o pâine. Cât costă?
— Merele costă cinci lei și pâinea trei lei. Opt lei în total.
— Poftiți. Mulțumesc!
— Cu plăcere! O zi bună!`,
    languageFeatures: {
      grammar: ['basic_questions', 'vocab_numbers', 'vocab_food', 'basic_prepositions', 'indefinite_article'],
      vocabulary: {
        keywords: ['kilogram', 'mere', 'pâine', 'costă', 'lei', 'total', 'doriți'],
        requiredVocabSize: 40,
      },
      structures: ['Dialogue format', 'Polite requests', 'Simple questions'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Piața (outdoor market) is central to Romanian daily life. Vendors greet with "Bună ziua" and shoppers say "Poftiți" when handing over money.',
  },
  {
    type: 'text',
    title: 'Unde este banca?',
    difficultyLevel: '2.0',
    durationSeconds: 60,
    topic: 'Orientare',
    textContent: `— Bună ziua! Unde este banca, vă rog?
— Mergeți drept pe această stradă. La semafor, faceți la stânga. Banca este lângă farmacie.
— Este departe?
— Nu, este la cinci minute de aici.
— Mulțumesc mult!
— Cu plăcere!`,
    languageFeatures: {
      grammar: ['basic_questions', 'basic_prepositions', 'imperative_basic', 'present_tense_a_fi'],
      vocabulary: {
        keywords: ['banca', 'stradă', 'semafor', 'stânga', 'farmacie', 'departe', 'minute'],
        requiredVocabSize: 45,
      },
      structures: ['Asking for directions', 'Imperative instructions', 'Location descriptions'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Dimineața mea',
    difficultyLevel: '2.0',
    durationSeconds: 75,
    topic: 'Rutina zilnică',
    textContent: `Mă trezesc la șapte dimineața. Fac cafeaua și mănânc un croissant. Apoi mă spăl pe dinți și mă îmbrac. La opt plec la muncă. Merg cu autobuzul. Drumul durează douăzeci de minute. La birou, deschid computerul și încep să lucrez.`,
    languageFeatures: {
      grammar: ['reflexive_verbs', 'present_tense_regular_group1', 'basic_prepositions', 'vocab_time_basic', 'vocab_numbers'],
      vocabulary: {
        keywords: ['trezesc', 'cafea', 'mănânc', 'spăl', 'îmbrac', 'autobuz', 'birou', 'lucrez'],
        requiredVocabSize: 50,
      },
      structures: ['Daily routine sequence', 'Reflexive verb usage', 'Time expressions'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Romanians often have a light breakfast — coffee and a pastry. Public transport is widely used in cities.',
  },
  {
    type: 'text',
    title: 'Ce vreme este?',
    difficultyLevel: '2.0',
    durationSeconds: 60,
    topic: 'Vreme',
    textContent: `Astăzi este cald și soare. Temperatura este douăzeci și opt de grade. Este o zi perfectă pentru o plimbare în parc. Mâine va fi altfel — va ploua și va fi mai rece. Trebuie să iau umbrela.`,
    languageFeatures: {
      grammar: ['present_tense_a_fi', 'vocab_weather', 'vocab_numbers', 'basic_connectors', 'future_informal_o_sa'],
      vocabulary: {
        keywords: ['cald', 'soare', 'temperatură', 'grade', 'plimbare', 'ploua', 'rece', 'umbrelă'],
        requiredVocabSize: 45,
      },
      structures: ['Weather descriptions', 'Simple future', 'Contrast with mâine'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Animalele mele',
    difficultyLevel: '2.0',
    durationSeconds: 65,
    topic: 'Animale',
    textContent: `Am două pisici și un câine. Pisicile se numesc Luna și Steluța. Câinele se numește Rex. Luna este neagră și Steluța este albă. Rex este mare și jucăuș. Pisicile dorm mult, dar câinele aleargă tot timpul. Îi iubesc foarte mult pe toți.`,
    languageFeatures: {
      grammar: ['present_tense_a_avea', 'gender_agreement', 'definite_article', 'plural_nouns', 'vocab_colors', 'basic_connectors'],
      vocabulary: {
        keywords: ['pisici', 'câine', 'neagră', 'albă', 'mare', 'jucăuș', 'dorm', 'aleargă', 'iubesc'],
        requiredVocabSize: 45,
      },
      structures: ['Descriptive sentences', 'Possessive constructions', 'Contrast with dar'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'La restaurant',
    difficultyLevel: '2.0',
    durationSeconds: 70,
    topic: 'Mâncare',
    textContent: `— Bună seara! O masă pentru două persoane, vă rog.
— Sigur, poftiți aici. Iată meniul.
— Ce ne recomandați?
— Ciorba de legume este foarte bună. Și sarmalele sunt delicioase.
— Vreau ciorbă și o porție de sarmale. Tu ce vrei?
— Eu vreau o salată și o apă minerală.
— Perfect. Vă aduc imediat.`,
    languageFeatures: {
      grammar: ['basic_questions', 'vocab_food', 'indefinite_article', 'present_tense_a_fi', 'plural_nouns', 'basic_prepositions'],
      vocabulary: {
        keywords: ['masă', 'meniu', 'recomandați', 'ciorbă', 'sarmale', 'salată', 'apă minerală', 'porție'],
        requiredVocabSize: 50,
      },
      structures: ['Restaurant dialogue', 'Polite requests', 'Recommendations'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Ciorba (sour soup) and sarmale (cabbage rolls) are iconic Romanian dishes. Servers often recommend the dish of the day.',
  },
  {
    type: 'text',
    title: 'Familia mea',
    difficultyLevel: '2.0',
    durationSeconds: 75,
    topic: 'Familie',
    textContent: `Familia mea nu este mare. Am o soră și un frate. Sora mea, Ana, are treizeci de ani. Ea este profesoară. Fratele meu, Mihai, are douăzeci și cinci de ani. El este student la medicină. Părinții mei locuiesc în Cluj. Tata lucrează la o fabrică și mama este asistentă medicală. Ne vedem în fiecare weekend.`,
    languageFeatures: {
      grammar: ['present_tense_a_avea', 'vocab_family', 'vocab_numbers', 'definite_article', 'gender_agreement', 'possession_al_a', 'vocab_work'],
      vocabulary: {
        keywords: ['soră', 'frate', 'profesoară', 'student', 'părinți', 'fabrică', 'asistentă', 'weekend'],
        requiredVocabSize: 55,
      },
      structures: ['Family descriptions', 'Age expressions', 'Occupation statements'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Îmi place sau nu?',
    difficultyLevel: '2.0',
    durationSeconds: 65,
    topic: 'Preferințe',
    textContent: `Îmi place mult muzica. Ascult muzică în fiecare zi. Îmi place rock-ul și jazz-ul. Nu-mi place muzica populară. Îmi place să cânt la chitară, dar nu cânt bine. Prietenul meu cântă la pian. Lui îi place muzica clasică. Avem gusturi diferite, dar ne place să ascultăm muzică împreună.`,
    languageFeatures: {
      grammar: ['imi_place_construction', 'basic_negation', 'basic_connectors', 'definite_article', 'dative_pronouns'],
      vocabulary: {
        keywords: ['muzică', 'ascult', 'rock', 'jazz', 'populară', 'chitară', 'pian', 'clasică', 'gusturi'],
        requiredVocabSize: 50,
      },
      structures: ['Expressing likes/dislikes', 'Contrast with dar', 'Dative construction a-i plăcea'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },

  // =========================================================================
  // DIFFICULTY 2.5 — A1→A2 Bridge: Past tense intro, reflexive verbs, longer
  // =========================================================================
  {
    type: 'text',
    title: 'Weekendul trecut',
    difficultyLevel: '2.5',
    durationSeconds: 90,
    topic: 'Timp liber',
    textContent: `Weekendul trecut a fost foarte frumos. Sâmbătă dimineața am dormit până la zece. Apoi am făcut micul dejun — ouă și pâine prăjită. După-amiază am mers în parc cu prietenii. Am jucat fotbal și am mâncat înghețată. Duminică am stat acasă. Am citit o carte și am văzut un film. A fost un weekend relaxant.`,
    languageFeatures: {
      grammar: ['past_tense_perfect_compus', 'basic_connectors', 'vocab_time_basic', 'basic_prepositions', 'vocab_food'],
      vocabulary: {
        keywords: ['weekend', 'dormit', 'dejun', 'prieteni', 'fotbal', 'înghețată', 'carte', 'film', 'relaxant'],
        requiredVocabSize: 60,
      },
      structures: ['Past tense narration', 'Temporal sequencing', 'Weekend activities'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'La doctor',
    difficultyLevel: '2.5',
    durationSeconds: 85,
    topic: 'Sănătate',
    textContent: `— Bună ziua, doctore. Nu mă simt bine.
— Ce simptome aveți?
— Mă doare capul și am febră. Tușesc de două zile.
— Să vedem. Deschideți gura, vă rog. Aveți gâtul roșu. Este o răceală.
— Este grav?
— Nu, nu este grav. Trebuie să beți mult ceai și să vă odihniți. Vă dau o rețetă pentru pastile.
— Mulțumesc, doctore.
— Însănătoșire grabnică!`,
    languageFeatures: {
      grammar: ['reflexive_verbs', 'basic_questions', 'imperative_basic', 'present_tense_a_avea', 'vocab_health', 'dative_pronouns'],
      vocabulary: {
        keywords: ['simt', 'simptome', 'doare', 'capul', 'febră', 'tușesc', 'răceală', 'rețetă', 'pastile'],
        requiredVocabSize: 55,
      },
      structures: ['Doctor-patient dialogue', 'Describing symptoms', 'Medical instructions'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: '"Însănătoșire grabnică!" (speedy recovery) is a common Romanian well-wish when someone is sick.',
  },
  {
    type: 'text',
    title: 'Mă pregătesc de plecare',
    difficultyLevel: '2.5',
    durationSeconds: 80,
    topic: 'Călătorii',
    textContent: `Mâine plec în vacanță la mare. Trebuie să mă pregătesc. Am făcut o listă: costume de baie, cremă de soare, ochelari de soare, și câteva cărți. M-am uitat la vreme — va fi cald toată săptămâna. M-am bucurat foarte mult! Hotelul este lângă plajă. O să mă trezesc devreme și o să merg la plajă în fiecare dimineață.`,
    languageFeatures: {
      grammar: ['reflexive_verbs', 'past_tense_perfect_compus', 'future_informal_o_sa', 'vocab_travel', 'basic_prepositions', 'plural_nouns'],
      vocabulary: {
        keywords: ['vacanță', 'mare', 'pregătesc', 'costume de baie', 'cremă', 'ochelari', 'hotel', 'plajă'],
        requiredVocabSize: 60,
      },
      structures: ['Packing list', 'Future plans', 'Reflexive verbs in context'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Mamaia and Vama Veche on the Black Sea coast are popular summer destinations for Romanians.',
  },
  {
    type: 'text',
    title: 'Cu autobuzul prin oraș',
    difficultyLevel: '2.5',
    durationSeconds: 80,
    topic: 'Transport',
    textContent: `Iau autobuzul 41 în fiecare dimineață. Stația este la cinci minute de casa mea. Autobuzul vine la fiecare zece minute. Azi am așteptat cincisprezece minute pentru că autobuzul a întârziat. În autobuz am citit știrile pe telefon. Am coborât la stația de lângă birou. Drumul durează treizeci de minute, dar cu metroul durează doar cincisprezece.`,
    languageFeatures: {
      grammar: ['past_tense_perfect_compus', 'basic_prepositions', 'vocab_numbers', 'vocab_time_basic', 'comparative_adjectives', 'basic_connectors'],
      vocabulary: {
        keywords: ['autobuz', 'stație', 'așteptat', 'întârziat', 'coborât', 'metrou', 'durează', 'telefon'],
        requiredVocabSize: 55,
      },
      structures: ['Daily commute narration', 'Past tense events', 'Duration comparisons'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Bucharest has an extensive bus, tram, and metro system. Line 41 is a real, well-known tram route.',
  },
  {
    type: 'text',
    title: 'Prietenul meu cel mai bun',
    difficultyLevel: '2.5',
    durationSeconds: 90,
    topic: 'Prietenie',
    textContent: `Prietenul meu cel mai bun se numește Andrei. Ne-am cunoscut la școală acum zece ani. El este înalt și are părul scurt. Andrei lucrează ca programator. Îi place să joace jocuri video și să gătească. Ne vedem în fiecare vineri. De obicei mergem la un restaurant sau ne uităm la un film acasă. Andrei este o persoană foarte amuzantă. Mă face mereu să râd.`,
    languageFeatures: {
      grammar: ['past_tense_perfect_compus', 'reflexive_verbs', 'imi_place_construction', 'gender_agreement', 'definite_article', 'basic_connectors', 'vocab_time_basic'],
      vocabulary: {
        keywords: ['prieten', 'cunoscut', 'înalt', 'păr', 'programator', 'gătească', 'amuzant', 'râd'],
        requiredVocabSize: 60,
      },
      structures: ['Person descriptions', 'Past tense origin story', 'Habitual present'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'La supermarket',
    difficultyLevel: '2.5',
    durationSeconds: 85,
    topic: 'Cumpărături',
    textContent: `Ieri am mers la supermarket. Am avut nevoie de multe lucruri: lapte, pâine, brânză, roșii, cartofi și carne de pui. Am luat și un tort de ciocolată pentru că a fost ziua sorei mele. Supermarketul a fost plin de oameni pentru că era sâmbătă. Am așteptat la casă zece minute. Am plătit o sută douăzeci de lei. Am uitat să cumpăr ouă!`,
    languageFeatures: {
      grammar: ['past_tense_perfect_compus', 'plural_nouns', 'vocab_food', 'vocab_numbers', 'basic_connectors', 'vocab_shopping', 'basic_prepositions'],
      vocabulary: {
        keywords: ['supermarket', 'lapte', 'brânză', 'cartofi', 'carne', 'tort', 'casă', 'plătit', 'uitat'],
        requiredVocabSize: 60,
      },
      structures: ['Shopping narration', 'Past tense sequence', 'Reason clauses with pentru că'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'O zi la job',
    difficultyLevel: '2.5',
    durationSeconds: 90,
    topic: 'Muncă',
    textContent: `Lucrez ca ospătar într-un restaurant din centrul orașului. Programul meu este de la zece dimineața până la șase seara. Azi a fost o zi grea. Au venit mulți clienți și am alergat toată ziua. Un client s-a plâns că supa a fost rece. I-am adus o supă nouă și s-a calmat. La sfârșitul zilei eram obosit, dar am primit un bacșiș bun.`,
    languageFeatures: {
      grammar: ['past_tense_perfect_compus', 'reflexive_verbs', 'vocab_work', 'basic_connectors', 'dative_pronouns', 'accusative_pronouns', 'vocab_time_basic'],
      vocabulary: {
        keywords: ['ospătar', 'restaurant', 'programul', 'clienți', 'alergat', 'plâns', 'supă', 'obosit', 'bacșiș'],
        requiredVocabSize: 65,
      },
      structures: ['Work routine', 'Past tense incident narration', 'Reflexive verbs in past'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Tipping (bacșiș) in Romania is usually 10-15% and is appreciated but not mandatory.',
  },
  {
    type: 'text',
    title: 'Cum mă simt azi',
    difficultyLevel: '2.5',
    durationSeconds: 75,
    topic: 'Emoții',
    textContent: `Azi mă simt bine. Ieri m-am simțit trist pentru că a plouat toată ziua și am stat singur acasă. Dar azi soarele strălucește și m-am întâlnit cu o prietenă la cafea. Am vorbit mult și am râs. Acum mă simt fericit. Cred că vremea mă influențează foarte mult. Când este soare, sunt vesel. Când plouă, sunt mai trist.`,
    languageFeatures: {
      grammar: ['reflexive_verbs', 'past_tense_perfect_compus', 'basic_connectors', 'present_tense_a_fi', 'comparative_adjectives', 'vocab_weather'],
      vocabulary: {
        keywords: ['simt', 'trist', 'plouat', 'soare', 'strălucește', 'prietenă', 'fericit', 'influențează', 'vesel'],
        requiredVocabSize: 55,
      },
      structures: ['Emotional state descriptions', 'Weather-mood correlation', 'Temporal contrast ieri/azi'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },

  // =========================================================================
  // DIFFICULTY 3.0 — Early A2: Connectors, opinions, longer narratives
  // =========================================================================
  {
    type: 'text',
    title: 'De ce îmi place Clujul',
    difficultyLevel: '3.0',
    durationSeconds: 110,
    topic: 'Oraș',
    textContent: `Locuiesc în Cluj-Napoca de trei ani și îmi place foarte mult acest oraș. În primul rând, Clujul are multe cafenele frumoase unde poți să lucrezi sau să te relaxezi. De asemenea, viața culturală este bogată — sunt festivaluri de film, teatru și muzică în fiecare lună. Pe de altă parte, orașul are și probleme. Traficul este groaznic, mai ales dimineața și seara. Chiriile sunt scumpe, uneori mai scumpe decât în București. Cu toate acestea, cred că Clujul este un loc minunat pentru tineri. Am mulți prieteni aici și nu vreau să plec.`,
    languageFeatures: {
      grammar: ['basic_connectors', 'advanced_connectors', 'comparative_adjectives', 'imi_place_construction', 'present_tense_a_fi', 'basic_prepositions', 'reflexive_verbs'],
      vocabulary: {
        keywords: ['cafenele', 'culturală', 'festivaluri', 'trafic', 'chirii', 'scumpe', 'tineri', 'minunat'],
        requiredVocabSize: 75,
      },
      structures: ['Opinion essay structure', 'Discourse markers (în primul rând, de asemenea, pe de altă parte)', 'Comparisons'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Cluj-Napoca is Romania\'s second city and unofficial "capital of Transylvania." It has a booming IT sector and vibrant student culture.',
  },
  {
    type: 'text',
    title: 'Am gătit pentru prima dată',
    difficultyLevel: '3.0',
    durationSeconds: 100,
    topic: 'Gătit',
    textContent: `Ieri am încercat să gătesc ciorbă de pui pentru prima dată. Am citit rețeta pe internet și am cumpărat toate ingredientele: pui, morcovi, cartofi, ceapă, și leuștean. Am tăiat legumele și am pus totul la fiert. Din păcate, am uitat de oala pe foc și ciorba a dat în foc. A ieșit un miros groaznic în toată bucătăria! Am sunat-o pe mama și ea mi-a explicat ce am greșit. Data viitoare o să fiu mai atent. Oricum, a doua încercare a fost mai bună.`,
    languageFeatures: {
      grammar: ['past_tense_perfect_compus', 'reflexive_verbs', 'basic_connectors', 'accusative_pronouns', 'dative_pronouns', 'future_informal_o_sa', 'comparative_adjectives', 'vocab_food'],
      vocabulary: {
        keywords: ['gătesc', 'ciorbă', 'rețetă', 'ingrediente', 'morcovi', 'legume', 'fiert', 'greșit', 'încercare'],
        requiredVocabSize: 70,
      },
      structures: ['Sequential past narration', 'Problem-resolution narrative', 'Object pronouns in context'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Ciorbă de pui (chicken sour soup) is a staple comfort food. Leuștean (lovage) is the signature herb — every Romanian kitchen has it.',
  },
  {
    type: 'text',
    title: 'Sportul preferat',
    difficultyLevel: '3.0',
    durationSeconds: 105,
    topic: 'Sport',
    textContent: `Sportul meu preferat este baschetul. Am început să joc la doisprezece ani, când un prieten m-a invitat la un meci. La început nu am fost bun deloc, dar am exersat în fiecare zi. Acum joc într-o echipă locală. Ne antrenăm de trei ori pe săptămână și avem meciuri în fiecare duminică. Cred că sportul este important nu doar pentru sănătate, ci și pentru disciplină. M-a învățat să lucrez în echipă și să nu renunț când este greu. Visul meu este să joc într-o competiție națională.`,
    languageFeatures: {
      grammar: ['past_tense_perfect_compus', 'basic_connectors', 'reflexive_verbs', 'basic_negation', 'vocab_numbers', 'accusative_pronouns', 'comparative_adjectives'],
      vocabulary: {
        keywords: ['baschet', 'meci', 'exersat', 'echipă', 'antrenăm', 'sănătate', 'disciplină', 'renunț', 'competiție'],
        requiredVocabSize: 70,
      },
      structures: ['Personal narrative with timeline', 'Opinion with justification', 'Nu doar...ci și construction'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Prima zi la un job nou',
    difficultyLevel: '3.0',
    durationSeconds: 110,
    topic: 'Muncă',
    textContent: `Luni a fost prima mea zi la noul loc de muncă. Am fost foarte nervos. M-am trezit la șase dimineața, deși programul începe la nouă. Am vrut să fiu sigur că nu întârzii. Colegii mei au fost foarte prietenoși. O femeie pe nume Ioana mi-a arătat biroul și m-a ajutat cu computerul. Am avut o întâlnire cu șeful, care mi-a explicat ce trebuie să fac. La prânz, am mâncat cu echipa la o cantină din apropiere. Pe scurt, a fost o zi bună. Sunt puțin obosit, dar entuziasmat pentru ce urmează.`,
    languageFeatures: {
      grammar: ['past_tense_perfect_compus', 'reflexive_verbs', 'basic_connectors', 'dative_pronouns', 'accusative_pronouns', 'relative_clauses_care', 'vocab_work', 'vocab_time_basic'],
      vocabulary: {
        keywords: ['nervos', 'programul', 'colegii', 'prietenoși', 'birou', 'întâlnire', 'șeful', 'entuziasmat'],
        requiredVocabSize: 75,
      },
      structures: ['First-day narrative', 'Temporal markers (luni, la șase, la prânz)', 'Relative clause with care'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Vacanța la munte',
    difficultyLevel: '3.0',
    durationSeconds: 110,
    topic: 'Călătorii',
    textContent: `Vara trecută am fost în vacanță la Brașov cu familia. Am stat într-o pensiune mică, în apropiere de centrul vechi. În prima zi am vizitat Cetatea Brașovului și am urcat pe Tâmpa cu telecabina. Priveliștea a fost incredibilă! Am putut vedea tot orașul de sus. În a doua zi am mers la Castelul Bran. Mulți oameni cred că este castelul lui Dracula, dar de fapt Vlad Țepeș nu a locuit acolo. Oricum, este un loc frumos și interesant. Seara am mâncat la un restaurant tradițional. Am gustat mici, sarmale și papanași. Au fost cele mai bune sarmale din viața mea!`,
    languageFeatures: {
      grammar: ['past_tense_perfect_compus', 'basic_connectors', 'comparative_adjectives', 'basic_prepositions', 'plural_nouns', 'basic_negation', 'vocab_travel', 'vocab_food'],
      vocabulary: {
        keywords: ['pensiune', 'cetate', 'telecabina', 'priveliște', 'castel', 'tradițional', 'mici', 'sarmale', 'papanași'],
        requiredVocabSize: 80,
      },
      structures: ['Travel narrative', 'Day-by-day sequence', 'Superlative construction (cele mai bune)'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Brașov is a top tourist destination in Transylvania. Tâmpa is the forested hill overlooking the city. Papanași are fried cheese donuts with sour cream and jam — a beloved dessert.',
  },
  {
    type: 'text',
    title: 'Ce vreau să fac anul viitor',
    difficultyLevel: '3.0',
    durationSeconds: 100,
    topic: 'Planuri',
    textContent: `Am câteva planuri pentru anul viitor. În primul rând, vreau să învăț să conduc. Am amânat asta de mult timp, dar cred că este momentul. De asemenea, vreau să economisesc bani pentru o călătorie în Grecia. Nu am fost niciodată acolo și am auzit că este superb. Pe lângă asta, vreau să citesc mai mult. Anul acesta am citit doar trei cărți, ceea ce este puțin. Obiectivul meu este douăzeci de cărți. Nu știu dacă voi reuși totul, dar este bine să ai obiective. Chiar dacă nu le ating pe toate, o să fac progres.`,
    languageFeatures: {
      grammar: ['future_informal_o_sa', 'basic_connectors', 'advanced_connectors', 'past_tense_perfect_compus', 'comparative_adjectives', 'basic_negation', 'vocab_numbers'],
      vocabulary: {
        keywords: ['planuri', 'conduc', 'amânat', 'economisesc', 'călătorie', 'obiectiv', 'reuși', 'progres'],
        requiredVocabSize: 75,
      },
      structures: ['Future plans with vreau să', 'Discourse markers', 'Conditional reasoning (chiar dacă)'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Cartierul meu',
    difficultyLevel: '3.0',
    durationSeconds: 100,
    topic: 'Locuință',
    textContent: `Locuiesc într-un cartier liniștit din zona de nord a Bucureștiului. Blocul meu are opt etaje și eu stau la etajul patru. Apartamentul este mic, dar confortabil — are două camere, o bucătărie și un balcon. Îmi place cartierul pentru că are un parc mare unde merg să alerg dimineața. Sunt și câteva magazine și o piață la cinci minute de bloc. Singurul lucru care nu-mi place este zgomotul de la șantierul din apropiere. Construiesc un bloc nou și se lucrează de la șapte dimineața. Dar în rest, este un loc bun de locuit.`,
    languageFeatures: {
      grammar: ['basic_prepositions', 'definite_article', 'imi_place_construction', 'basic_connectors', 'basic_negation', 'vocab_numbers', 'relative_clauses_care', 'plural_nouns'],
      vocabulary: {
        keywords: ['cartier', 'bloc', 'etaj', 'apartament', 'balcon', 'parc', 'piață', 'zgomot', 'șantier'],
        requiredVocabSize: 75,
      },
      structures: ['Neighborhood description', 'Pros and cons structure', 'Relative clauses with care/unde'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Many Romanians live in bloc (apartment building) housing from the communist era. Northern Bucharest is generally considered more upscale.',
  },
  {
    type: 'text',
    title: 'Un cadou special',
    difficultyLevel: '3.0',
    durationSeconds: 95,
    topic: 'Relații',
    textContent: `Săptămâna trecută a fost ziua prietenei mele. Am vrut să-i fac un cadou special. M-am gândit mult și am decis să-i fac o carte cu fotografii. Am adunat poze de când ne-am cunoscut — de la facultate, din vacanțe, de la petreceri. Am scris câte un mesaj lângă fiecare poză. Când i-am dat cadoul, a început să plângă de bucurie. Mi-a spus că este cel mai frumos cadou pe care l-a primit. M-am simțit foarte bine. Uneori cele mai bune cadouri nu costă mulți bani, ci cer puțin timp și creativitate.`,
    languageFeatures: {
      grammar: ['past_tense_perfect_compus', 'reflexive_verbs', 'dative_pronouns', 'accusative_pronouns', 'basic_connectors', 'comparative_adjectives', 'relative_clauses_care'],
      vocabulary: {
        keywords: ['cadou', 'fotografii', 'poze', 'facultate', 'petreceri', 'mesaj', 'plângă', 'bucurie', 'creativitate'],
        requiredVocabSize: 75,
      },
      structures: ['Gift-giving narrative', 'Pronoun chains (i-am, mi-a, l-a)', 'Moral/reflection at end'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
];

async function seed() {
  console.log('🌉 Seeding 2.0–3.0 bridge content (Priority 1)...');
  console.log(`   ${bridgeContent.filter(c => c.difficultyLevel === '2.0').length} items at 2.0`);
  console.log(`   ${bridgeContent.filter(c => c.difficultyLevel === '2.5').length} items at 2.5`);
  console.log(`   ${bridgeContent.filter(c => c.difficultyLevel === '3.0').length} items at 3.0`);
  console.log(`   ${bridgeContent.length} items total\n`);

  try {
    const inserted = await db.insert(contentItems).values(bridgeContent).returning();
    console.log(`✅ Successfully seeded ${inserted.length} bridge content items!`);
    console.log('\nItems created:');
    for (const item of inserted) {
      console.log(`  [${item.difficultyLevel}] ${item.title} (${item.topic})`);
    }
  } catch (error) {
    console.error('❌ Failed to seed bridge content:', error);
  }
  process.exit(0);
}

seed();