import { db } from '@/lib/db';
import { contentItems, NewContentItem } from '@/lib/db/schema';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// =============================================================================
// Priority 3: Medium-length content at 3.5–4.0
//
// Bridges 4-second EU Parliament clips (3.5) → 78-second full narratives (4.5).
// Format: 15-30 second pieces — short news, recipes, weather, anecdotes.
// Grammar: B1 intro (subjunctive, relative clauses) + solid A2 (past tense,
//          connectors, reflexive verbs, comparatives).
// =============================================================================

const mediumContent: NewContentItem[] = [
  // =========================================================================
  // DIFFICULTY 3.5 — Upper A2: Short news, summaries, structured descriptions
  // =========================================================================
  {
    type: 'text',
    title: 'Vremea pentru săptămâna viitoare',
    difficultyLevel: '3.5',
    durationSeconds: 25,
    topic: 'Vreme',
    textContent: `Iată prognoza meteo pentru săptămâna viitoare. Luni și marți vom avea temperaturi de douăzeci de grade cu soare. Miercuri se anunță ploi în toată țara, mai ales în zona de vest. Joi și vineri se va răci cu câteva grade, dar va fi senin. La munte, nopțile vor fi reci — doar cinci grade. Weekendul va fi perfect pentru activități în aer liber, cu temperaturi de până la douăzeci și cinci de grade. Nu uitați umbrela miercuri!`,
    languageFeatures: {
      grammar: ['future_informal_o_sa', 'vocab_weather', 'vocab_numbers', 'basic_connectors', 'comparative_adjectives', 'basic_prepositions'],
      vocabulary: {
        keywords: ['prognoză', 'temperaturi', 'ploi', 'senin', 'răci', 'activități', 'aer liber'],
        requiredVocabSize: 70,
      },
      structures: ['Weather forecast format', 'Future tense narration', 'Temporal sequencing by day'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Rețetă: Salată de vinete',
    difficultyLevel: '3.5',
    durationSeconds: 25,
    topic: 'Gătit',
    textContent: `Pentru salata de vinete ai nevoie de două vinete mari, o ceapă, ulei, sare și puțin lămâie. Mai întâi, coace vinetele pe grătar sau în cuptor la două sute de grade timp de patruzeci de minute. Apoi, curăță-le și lasă-le să se scurgă. Tocă vinetele mărunt și adaugă ceapa tocată fin. Pune ulei puțin câte puțin și amestecă bine. La final, adaugă sare și lămâie după gust. Se servește rece, cu pâine proaspătă. Este un fel de mâncare tradițional românesc, perfect pentru vară.`,
    languageFeatures: {
      grammar: ['imperative_basic', 'reflexive_verbs', 'basic_connectors', 'vocab_food', 'vocab_numbers', 'basic_prepositions'],
      vocabulary: {
        keywords: ['vinete', 'grătar', 'cuptor', 'curăță', 'tocă', 'amestecă', 'scurgă', 'tradițional'],
        requiredVocabSize: 70,
      },
      structures: ['Recipe instructions', 'Imperative sequence', 'Sequential markers (mai întâi, apoi, la final)'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Salata de vinete (eggplant salad) is one of Romania\'s most beloved summer dishes. Every family has their own recipe and claims theirs is the best.',
  },
  {
    type: 'text',
    title: 'Știri locale: Parc nou în sector 3',
    difficultyLevel: '3.5',
    durationSeconds: 20,
    topic: 'Știri',
    textContent: `Primăria sectorului 3 din București a inaugurat ieri un nou parc în cartierul Titan. Parcul are o suprafață de cinci hectare și include locuri de joacă pentru copii, o pistă de alergat și un lac mic. Proiectul a costat douăzeci de milioane de lei și a durat doi ani. Locuitorii din zonă sunt foarte mulțumiți. „Aveam nevoie de un spațiu verde", a spus o locuitoare. Parcul este deschis zilnic, de la șase dimineața până la zece seara.`,
    languageFeatures: {
      grammar: ['past_tense_perfect_compus', 'basic_connectors', 'vocab_numbers', 'basic_prepositions', 'plural_nouns', 'definite_article'],
      vocabulary: {
        keywords: ['primăria', 'inaugurat', 'suprafață', 'hectare', 'pistă', 'proiect', 'locuitori', 'spațiu verde'],
        requiredVocabSize: 75,
      },
      structures: ['News article format', 'Reported speech', 'Passive constructions'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'O poveste scurtă de la bunica',
    difficultyLevel: '3.5',
    durationSeconds: 25,
    topic: 'Povești',
    textContent: `Bunica mea îmi povestea mereu despre copilăria ei la sat. Vara, copiii se trezeau devreme și mergeau la câmp cu părinții. Mâncau pâine cu brânză și beau lapte proaspăt. După-amiaza se jucau pe dealuri și se scăldau în râu. Nu aveau jucării, dar nu se plictiseau niciodată. „Eram liberi", spunea bunica. „Nu aveam telefoane și computere, dar aveam natură, prieteni și multă imaginație." Când era iarnă, făceau oameni de zăpadă și mergeau cu sania pe dealul din spatele casei.`,
    languageFeatures: {
      grammar: ['imperfect_tense', 'reflexive_verbs', 'basic_connectors', 'basic_negation', 'past_tense_perfect_compus', 'plural_nouns'],
      vocabulary: {
        keywords: ['povestea', 'copilăria', 'câmp', 'dealuri', 'scăldau', 'plictiseau', 'imaginație', 'sania'],
        requiredVocabSize: 75,
      },
      structures: ['Imperfect tense narration', 'Reported speech', 'Habitual past actions'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Romanian grandparents often share stories of rural childhood. Village life remains deeply valued in Romanian culture, even as the country urbanizes.',
  },
  {
    type: 'text',
    title: 'Ce am învățat din greșelile mele',
    difficultyLevel: '3.5',
    durationSeconds: 25,
    topic: 'Dezvoltare personală',
    textContent: `Toată lumea face greșeli, dar important este ce înveți din ele. Anul trecut am făcut o greșeală mare la muncă — am trimis un email cu informații confidențiale către persoana greșită. Am fost foarte speriat, dar am vorbit imediat cu șeful meu. El m-a ajutat să rezolv situația și mi-a spus ceva important: „Greșelile se întâmplă. Ce contează este cum reacționezi." De atunci, verific de două ori fiecare email înainte să-l trimit. Cred că greșelile ne fac mai atenți și mai puternici, dacă alegem să învățăm din ele.`,
    languageFeatures: {
      grammar: ['past_tense_perfect_compus', 'reflexive_verbs', 'basic_connectors', 'comparative_adjectives', 'subjunctive_sa', 'dative_pronouns', 'accusative_pronouns'],
      vocabulary: {
        keywords: ['greșeli', 'confidențiale', 'speriat', 'rezolv', 'reacționezi', 'verific', 'atenți', 'puternici'],
        requiredVocabSize: 80,
      },
      structures: ['Personal reflection', 'Reported speech', 'Moral lesson structure', 'Subjunctive intro (să-l trimit)'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Cum să alegi un cadou bun',
    difficultyLevel: '3.5',
    durationSeconds: 20,
    topic: 'Sfaturi',
    textContent: `Să alegi un cadou bun nu este ușor. Iată câteva sfaturi utile. În primul rând, gândește-te la ce îi place persoanei. Dacă îi place să citească, o carte este o alegere excelentă. Dacă îi place muzica, un bilet la concert poate fi perfect. În al doilea rând, nu trebuie să cheltuiești mulți bani. Un cadou făcut de tine — o scrisoare, o fotografie sau ceva gătit — poate fi mai valoros decât ceva scump. În al treilea rând, nu lăsa totul pe ultimul moment. Planifică din timp și ai răbdare.`,
    languageFeatures: {
      grammar: ['subjunctive_sa', 'imperative_basic', 'basic_connectors', 'advanced_connectors', 'comparative_adjectives', 'imi_place_construction', 'dative_pronouns'],
      vocabulary: {
        keywords: ['cadou', 'sfaturi', 'alegere', 'cheltuiești', 'valoros', 'scump', 'planifică', 'răbdare'],
        requiredVocabSize: 75,
      },
      structures: ['Advice-giving format', 'Subjunctive (să alegi, să citească)', 'Ordinal discourse markers'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },

  // =========================================================================
  // DIFFICULTY 4.0 — A2→B1 Bridge: Subjunctive, relative clauses, opinions
  // =========================================================================
  {
    type: 'text',
    title: 'Reportaj: Viața studenților în București',
    difficultyLevel: '4.0',
    durationSeconds: 30,
    topic: 'Educație',
    textContent: `Viața de student în București poate fi atât frumoasă, cât și dificilă. Am vorbit cu trei studenți care ne-au povestit despre experiențele lor. Maria, care studiază medicina, spune că programul este foarte încărcat. „Trebuie să învăț în fiecare zi cel puțin șase ore. Nu am timp liber deloc în perioada examenelor." Andrei, student la informatică, are o perspectivă diferită. „Îmi place foarte mult ce fac, dar chiriile sunt scumpe. Împart un apartament cu alți doi colegi ca să pot economisi." Ioana, de la facultatea de litere, adaugă că cel mai greu lucru este incertitudinea. „Nu știu dacă o să găsesc un loc de muncă ușor după ce termin." Cu toate problemele, toți trei spun că nu ar schimba nimic. Studenția este o perioadă unică pe care trebuie să o trăiești din plin.`,
    languageFeatures: {
      grammar: ['subjunctive_sa', 'relative_clauses_care', 'basic_connectors', 'advanced_connectors', 'comparative_adjectives', 'conditional_present', 'future_informal_o_sa'],
      vocabulary: {
        keywords: ['studenți', 'experiențe', 'încărcat', 'perspectivă', 'chiriile', 'economisi', 'incertitudine', 'studenție'],
        requiredVocabSize: 85,
      },
      structures: ['Interview/reportage format', 'Multiple reported speech', 'Relative clauses with care', 'Conditional (nu ar schimba)'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Bucharest is Romania\'s largest university city. Housing costs have risen sharply, and many students share apartments (garsoniere) to manage expenses.',
  },
  {
    type: 'text',
    title: 'De ce ar trebui să învățăm o limbă nouă',
    difficultyLevel: '4.0',
    durationSeconds: 30,
    topic: 'Educație',
    textContent: `Mulți oameni cred că este suficient să vorbești engleza, dar eu cred că este important să înveți cel puțin încă o limbă. În primul rând, când înveți o limbă nouă, îți antrenezi creierul. Studiile arată că persoanele bilingve au o memorie mai bună și pot rezolva probleme mai ușor. De asemenea, o limbă nouă îți deschide o lume întreagă. Poți călători mai ușor, poți înțelege alte culturi și poți comunica cu oameni pe care altfel nu i-ai cunoaște niciodată. Pe de altă parte, procesul nu este simplu. Necesită răbdare, disciplină și curaj de a greși. Dar tocmai greșelile te ajută să progresezi. Fiecare greșeală este o lecție, nu un eșec. Iar satisfacția când reușești să porți o conversație în limba pe care o înveți — această satisfacție nu se compară cu nimic.`,
    languageFeatures: {
      grammar: ['subjunctive_sa', 'relative_clauses_care', 'advanced_connectors', 'comparative_adjectives', 'conditional_present', 'reflexive_verbs', 'accusative_pronouns', 'basic_negation'],
      vocabulary: {
        keywords: ['bilingve', 'memorie', 'culturi', 'răbdare', 'disciplină', 'curaj', 'progresezi', 'satisfacție'],
        requiredVocabSize: 90,
      },
      structures: ['Argumentative essay', 'Discourse markers throughout', 'Multiple subjunctive uses', 'Abstract vocabulary'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Știri: Festival de muzică la Cluj',
    difficultyLevel: '4.0',
    durationSeconds: 25,
    topic: 'Cultură',
    textContent: `Festivalul Electric Castle, care se desfășoară în fiecare an lângă Cluj-Napoca, a atras anul acesta peste două sute de mii de participanți din treizeci de țări. Evenimentul, organizat la Castelul Bánffy din Bonțida, a durat cinci zile și a inclus peste trei sute de artiști pe opt scene diferite. Organizatorii spun că este cea mai mare ediție de până acum. „Am crescut organic, fără să renunțăm la calitate", a declarat directorul festivalului. Pe lângă muzică, festivalul a oferit spectacole de teatru, ateliere de artă și zona de camping care a devenit ea însăși o comunitate temporară. Biletele pentru ediția de anul viitor se pun în vânzare luna aceasta.`,
    languageFeatures: {
      grammar: ['relative_clauses_care', 'past_tense_perfect_compus', 'subjunctive_sa', 'passive_voice', 'basic_connectors', 'advanced_connectors', 'comparative_adjectives', 'vocab_numbers'],
      vocabulary: {
        keywords: ['festival', 'participanți', 'eveniment', 'organizat', 'ediție', 'declarat', 'ateliere', 'comunitate'],
        requiredVocabSize: 90,
      },
      structures: ['News article format', 'Relative clauses', 'Passive constructions', 'Reported speech with attribution'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Electric Castle is one of Romania\'s biggest music festivals, held at the ruins of the Bánffy Castle in Bonțida, Transylvania. It\'s known for its unique atmosphere.',
  },
  {
    type: 'text',
    title: 'Scrisoare unui prieten din străinătate',
    difficultyLevel: '4.0',
    durationSeconds: 30,
    topic: 'Prietenie',
    textContent: `Dragă Thomas, îți mulțumesc pentru scrisoarea ta. Mă bucur că te-ai instalat bine la München. Aici, în România, lucrurile merg bine. M-am mutat într-un apartament nou care este mai mare decât cel vechi și are un balcon de unde văd parcul. La muncă am primit o promovare, ceea ce mă face foarte fericit, deși acum am mai multe responsabilități. Vreau să-ți spun că România s-a schimbat mult de când ai plecat. S-au deschis multe cafenele și restaurante noi în centrul vechi. Clădirile care erau în paragină au fost renovate și acum arată superb. Sper să vii în vizită vara aceasta, ca să vezi cu ochii tăi. Ar fi minunat să ne revedem. Mi-e dor de discuțiile noastre lungi la cafea. Ai grijă de tine și scrie-mi curând!`,
    languageFeatures: {
      grammar: ['relative_clauses_care', 'reflexive_verbs', 'past_tense_perfect_compus', 'subjunctive_sa', 'comparative_adjectives', 'passive_voice', 'conditional_present', 'dative_pronouns'],
      vocabulary: {
        keywords: ['instalat', 'promovare', 'responsabilități', 'paragină', 'renovate', 'revedem', 'discuții'],
        requiredVocabSize: 90,
      },
      structures: ['Letter format', 'Multiple relative clauses', 'Conditional wishes (ar fi)', 'Subjunctive (ca să vezi)'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Rețetă: Papanași cu smântână',
    difficultyLevel: '4.0',
    durationSeconds: 30,
    topic: 'Gătit',
    textContent: `Papanașii sunt probabil cel mai iubit desert românesc. Pentru a-i prepara acasă, ai nevoie de următoarele ingrediente: cinci sute de grame de brânză de vaci, două ouă, trei linguri de zahăr, un plic de zahăr vanilat, puțină sare, cojă de lămâie și făină cât cuprinde. Amestecă brânza cu ouăle, zahărul și aroma. Adaugă făina treptat, până obții un aluat moale care nu se lipește de mâini. Formează bile rotunde cu o adâncitură la mijloc. Prăjește-le în ulei încins la foc mediu până devin aurii pe ambele părți. Servește-le calzi, cu smântână groasă și gem de afine sau de vișine. Secretul este să nu pui prea multă făină — altfel devin tari. Și nu uita: papanașii se mănâncă proaspăt prăjiți, nu la a doua zi!`,
    languageFeatures: {
      grammar: ['imperative_basic', 'subjunctive_sa', 'reflexive_verbs', 'basic_connectors', 'basic_negation', 'vocab_food', 'comparative_adjectives', 'basic_prepositions'],
      vocabulary: {
        keywords: ['desert', 'ingrediente', 'brânză', 'aluat', 'adâncitură', 'prăjește', 'aurii', 'smântână', 'afine'],
        requiredVocabSize: 85,
      },
      structures: ['Detailed recipe with tips', 'Imperative + subjunctive mix', 'Quantity expressions', 'Secret/tip structure'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Papanași are fried cheese dumplings served with sour cream (smântână) and jam. They appear on virtually every Romanian restaurant menu. Arguments about toppings (blueberry vs sour cherry jam) are serious.',
  },
  {
    type: 'text',
    title: 'Problema traficului în orașe',
    difficultyLevel: '4.0',
    durationSeconds: 30,
    topic: 'Societate',
    textContent: `Traficul din marile orașe ale României a devenit o problemă serioasă care afectează calitatea vieții. În București, o persoană petrece în medie aproape o oră pe zi în trafic. Cauzele sunt multiple: numărul mare de mașini, infrastructura veche și lipsa transportului public eficient. Unii experți consideră că soluția ar fi să se investească mai mult în metrou și piste de biciclete. Alții cred că ar trebui să se introducă o taxă pentru mașinile care intră în centru, așa cum s-a făcut în Londra sau Stockholm. Pe de altă parte, mulți români spun că nu pot renunța la mașină pentru că transportul public este nesigur și aglomerat. Este clar că problema nu are o soluție simplă, dar dacă nu se ia nicio măsură, situația se va înrăutăți.`,
    languageFeatures: {
      grammar: ['relative_clauses_care', 'subjunctive_sa', 'passive_voice', 'conditional_present', 'advanced_connectors', 'comparative_adjectives', 'basic_negation', 'impersonal_constructions'],
      vocabulary: {
        keywords: ['trafic', 'calitate', 'infrastructură', 'experți', 'investească', 'taxă', 'aglomerat', 'măsură', 'înrăutăți'],
        requiredVocabSize: 95,
      },
      structures: ['Social issue analysis', 'Multiple perspectives', 'Conditional proposals (ar fi, ar trebui)', 'Passive/impersonal (s-a făcut, se ia)'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Interviu cu un voluntar la adăpostul de animale',
    difficultyLevel: '4.0',
    durationSeconds: 30,
    topic: 'Societate',
    textContent: `Radu are douăzeci și opt de ani și este voluntar la un adăpost de animale din Iași de doi ani. L-am întrebat de ce a ales să facă asta. „Am găsit un câine abandonat pe stradă și l-am dus la adăpost. Când am văzut câți animale sunt acolo și cât de puțini oameni ajută, am decis să rămân." Radu merge la adăpost de trei ori pe săptămână. Hrănește animalele, le plimbă și le curăță cușcile. „Cel mai greu moment este când un animal este bolnav și nu avem fonduri pentru tratament", spune el. Dar există și momente frumoase. „Săptămâna trecută, o familie a adoptat doi căței pe care i-am îngrijit de când erau mici. Am plâns de bucurie." Radu spune că voluntariatul l-a schimbat. „Am învățat să fiu mai răbdător, mai empatic și mai recunoscător pentru ce am."`,
    languageFeatures: {
      grammar: ['past_tense_perfect_compus', 'relative_clauses_care', 'subjunctive_sa', 'accusative_pronouns', 'dative_pronouns', 'reflexive_verbs', 'basic_connectors', 'comparative_adjectives'],
      vocabulary: {
        keywords: ['voluntar', 'adăpost', 'abandonat', 'hrănește', 'cușcile', 'fonduri', 'adoptat', 'îngrijit', 'empatic'],
        requiredVocabSize: 90,
      },
      structures: ['Interview format', 'Extended reported speech', 'Pronoun chains', 'Emotional narrative'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
];

async function seed() {
  console.log('📐 Seeding 3.5–4.0 medium-length content (Priority 3)...');
  console.log(`   ${mediumContent.filter(c => c.difficultyLevel === '3.5').length} items at 3.5`);
  console.log(`   ${mediumContent.filter(c => c.difficultyLevel === '4.0').length} items at 4.0`);
  console.log(`   ${mediumContent.length} items total\n`);

  try {
    const inserted = await db.insert(contentItems).values(mediumContent).returning();
    console.log(`✅ Successfully seeded ${inserted.length} medium-length content items!`);
    console.log('\nItems created:');
    for (const item of inserted) {
      console.log(`  [${item.difficultyLevel}] ${item.title} (${item.topic})`);
    }
  } catch (error) {
    console.error('❌ Failed to seed medium content:', error);
  }
  process.exit(0);
}

seed();
