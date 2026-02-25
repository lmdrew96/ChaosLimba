import { db } from '@/lib/db';
import { contentItems, NewContentItem } from '@/lib/db/schema';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// =============================================================================
// P5: Targeted gap content (6 zero-count features + thin features)
// P6: Topic diversification (environment, philosophy, research, sociolinguistics)
//
// Each item is designed to hit specific gaps while also serving P6 goals.
// =============================================================================

const gapContent: NewContentItem[] = [
  // =========================================================================
  // P5: PAST SUBJUNCTIVE (subjunctive_past) — 0 items → 3 items
  // Form: "să fi" + past participle (să fi fost, să fi știut, să fi plecat)
  // =========================================================================
  {
    type: 'text',
    title: 'Regretele mele',
    difficultyLevel: '6.5',
    durationSeconds: 120,
    topic: 'Emoții și reflecție',
    textContent: `Toți avem regrete. Eu mă gândesc uneori la lucrurile pe care aș fi vrut să le fac altfel. Dacă aș fi învățat o limbă străină mai devreme, poate acum aș fi lucrat în străinătate. Dacă nu aș fi renunțat la lecțiile de pian, poate aș fi cântat într-o formație. Mama îmi spune mereu: „Nu are rost să te gândești la ce ar fi fost dacă..." Ea crede că este mai bine să te uiți înainte. „Chiar dacă ai fi făcut lucrurile altfel, nu ai fi fost mai fericit neapărat." Are dreptate. Totuși, e greu să nu te întrebi cum ar fi fost viața ta dacă ai fi ales alt drum. Cred că regretele ne ajută să învățăm, cu condiția să nu ne blocăm în trecut. Important este ca lucrurile pe care le-am ratat să ne motiveze, nu să ne paralizeze.`,
    languageFeatures: {
      grammar: ['subjunctive_past', 'conditional_present', 'conditional_perfect', 'reflexive_verbs', 'basic_connectors', 'advanced_connectors', 'relative_clauses_care', 'reported_speech'],
      vocabulary: {
        keywords: ['regrete', 'renunțat', 'formație', 'neapărat', 'ratat', 'motiveze', 'paralizeze', 'condiția'],
        requiredVocabSize: 85,
      },
      structures: ['Past subjunctive (să fi + participle)', 'Counterfactual conditionals', 'Reported speech'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Dacă nu ar fi plouat în acea zi',
    difficultyLevel: '7.0',
    durationSeconds: 130,
    topic: 'Povești personale',
    textContent: `Sunt momente în viață care ne schimbă complet direcția, chiar dacă par neînsemnate. În cazul meu, totul a început într-o zi ploioasă din octombrie. Dacă nu ar fi plouat, aș fi mers la job pe jos, ca de obicei. Dacă aș fi mers pe jos, nu aș fi intrat în cafeneaua aceea. Și dacă nu aș fi intrat acolo, nu aș fi cunoscut-o pe Irina. Ea stătea la o masă, citind un roman pe care și eu îl citeam în acea perioadă. „Scuză-mă, este bun romanul acela?" am întrebat-o. Dacă nu ar fi fost atât de deschisă, probabil conversația s-ar fi terminat acolo. Dar am vorbit aproape două ore. E ciudat să te gândești că, dacă nu ar fi plouat, nu ne-am fi întâlnit niciodată. Acum suntem căsătoriți de trei ani. Uneori cele mai importante evenimente din viața noastră depind de lucruri pe care nu le putem controla.`,
    languageFeatures: {
      grammar: ['subjunctive_past', 'conditional_perfect', 'conditional_present', 'reflexive_verbs', 'relative_clauses_care', 'advanced_connectors', 'past_tense_perfect_compus', 'basic_negation', 'imperfect_tense'],
      vocabulary: {
        keywords: ['neînsemnate', 'direcția', 'deschisă', 'conversația', 'căsătoriți', 'evenimente', 'controla'],
        requiredVocabSize: 90,
      },
      structures: ['Counterfactual chain (dacă nu ar fi...)', 'Past subjunctive throughout', 'Narrative with philosophical reflection'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Istoria alternativă: dacă Revoluția nu ar fi avut loc',
    difficultyLevel: '7.5',
    durationSeconds: 140,
    topic: 'Istorie și speculație',
    textContent: `Ce s-ar fi întâmplat dacă Revoluția din 1989 nu ar fi avut loc? Este o întrebare pe care mulți istorici și-o pun. Dacă regimul comunist ar fi supraviețuit, economia României ar fi continuat să se degradeze. Cetățenii nu ar fi putut călători liber și nu ar fi avut acces la informație. Este posibil ca oamenii să fi emigrat în secret, cum se întâmpla deja. Dacă tranziția nu ar fi fost atât de brutală, poate România ar fi ajuns mai repede în Uniunea Europeană. Unii cred că, dacă reformele ar fi fost mai bine planificate, societatea nu ar fi suferit atât de mult. Alții argumentează că, fără sacrificiile făcute, libertatea nu ar fi avut aceeași valoare. Ce este clar este că, dacă nu s-ar fi schimbat nimic, generația mea nu ar fi crescut în democrație. Și dacă nu am fi crescut liberi, nu am fi putut construi ce avem astăzi.`,
    languageFeatures: {
      grammar: ['subjunctive_past', 'conditional_perfect', 'conditional_present', 'passive_voice', 'advanced_connectors', 'relative_clauses_care', 'impersonal_constructions', 'reported_speech', 'past_tense_perfect_compus', 'vocab_politics_society'],
      vocabulary: {
        keywords: ['revoluție', 'regim', 'supraviețuit', 'degradeze', 'cetățeni', 'tranziție', 'reformele', 'sacrificii', 'democrație'],
        requiredVocabSize: 100,
      },
      structures: ['Extended counterfactual reasoning', 'Past subjunctive in subordinate clauses', 'Historical speculation', 'Multiple perspectives'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'The Romanian Revolution of December 1989 overthrew the Ceaușescu regime. The transition to democracy was turbulent, and alternative history speculation remains a lively intellectual exercise.',
  },

  // =========================================================================
  // P5: LITERARY TENSES (literary_tenses) — 0 items → 3 items
  // Perfect simplu: merse, făcu, veni, zise, luă, puse, răspunse
  // =========================================================================
  {
    type: 'text',
    title: 'Povestea lui Harap-Alb (fragment adaptat)',
    difficultyLevel: '8.5',
    durationSeconds: 150,
    topic: 'Literatură clasică',
    textContent: `A fost odată ca niciodată un craiu care avea trei feciori. Când se făcu bătrân, chemă pe cel mai mic și-i zise: „Fătul meu, eu sunt acum slab și obosit. Du-te la fratele meu, Împăratul Roș, și spune-i că am nevoie de ajutor." Fiul cel mic plecă la drum. Merse el ce merse și ajunse la o fântână. Acolo stătea o babă care-i zise: „Unde mergi, voinice?" „Merg la Împăratul Roș", răspunse el. Baba îi dădu un sfat: „Ia-ți calul cel alb, nu pe celălalt." Dar el nu ascultă și luă calul cel negru. Când ajunse la un pod, calul se opri și nu vru să meargă mai departe. Atunci el înțelese că greșise și se întoarse la fântână. Baba îl privì și zise: „Ți-am spus eu, dar nu m-ai ascultat." Fiul cel mic luă calul alb și porni din nou la drum.`,
    languageFeatures: {
      grammar: ['literary_tenses', 'archaic_regional_forms', 'past_tense_perfect_compus', 'imperative_basic', 'reported_speech', 'basic_connectors', 'basic_negation', 'reflexive_verbs', 'accusative_pronouns', 'dative_pronouns'],
      vocabulary: {
        keywords: ['craiu', 'feciori', 'fântână', 'babă', 'voinice', 'calul', 'porni', 'merse', 'zise'],
        requiredVocabSize: 80,
      },
      structures: ['Perfect simplu (merse, zise, ajunse, luă, făcu)', 'Fairy tale register', 'Archaic forms (vru, privì)', 'Reported speech in past'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team (adapted from Ion Creangă)', license: 'Public Domain adaptation' },
    culturalNotes: 'Harap-Alb is one of Ion Creangă\'s most famous fairy tales (1877). Perfect simplu is standard in literary narration but almost never used in spoken Romanian.',
  },
  {
    type: 'text',
    title: 'Amintiri din copilărie: la scăldat (fragment adaptat)',
    difficultyLevel: '8.0',
    durationSeconds: 140,
    topic: 'Literatură clasică',
    textContent: `Într-o zi de vară, mama plecă la câmp și ne lăsă singuri acasă. De cum ieși ea pe ușă, eu și cu fratele meu luăm drumul spre râu. Alergăm prin grădini și peste garduri până ajunserăm la mal. Acolo ne dezbrăcăm repede și ne aruncăm în apă. Apa era rece tare, dar nouă nu ne păsa. Fratele meu se duse mai adânc și începu să strige: „Vino și tu încoace!" Eu mă dusei, dar când simții că nu mai dau de fund, mă înspăimântai. Atunci fratele meu mă apucă de mână și mă trase la mal. „Să nu spui mamei!" zise el. Ne îmbrăcăm repede și ne întoarserăm acasă. Mama veni de la câmp și ne găsi stând cuminți în casă. Dar hainele noastre ude ne trădară.`,
    languageFeatures: {
      grammar: ['literary_tenses', 'imperfect_tense', 'past_tense_perfect_compus', 'reflexive_verbs', 'imperative_basic', 'basic_negation', 'basic_connectors', 'accusative_pronouns', 'dative_pronouns'],
      vocabulary: {
        keywords: ['câmp', 'garduri', 'dezbrăcăm', 'înspăimântai', 'apucă', 'trase', 'cuminți', 'trădară'],
        requiredVocabSize: 85,
      },
      structures: ['Perfect simplu narration (plecă, ieși, luă, zise, veni)', 'Mixed literary + conversational register', 'Childhood adventure narrative'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team (in the style of Ion Creangă)', license: 'Original' },
    culturalNotes: 'Ion Creangă\'s "Amintiri din copilărie" (Childhood Memories, 1881-1882) is foundational Romanian literature. Its village humor and perfect simplu narration define the literary register.',
  },
  {
    type: 'text',
    title: 'Luceafărul: o interpretare accesibilă',
    difficultyLevel: '9.0',
    durationSeconds: 160,
    topic: 'Literatură și poezie',
    textContent: `„Luceafărul" lui Mihai Eminescu este considerat cea mai importantă operă poetică din literatura română. Poemul începe astfel: „A fost odată ca-n povești, / A fost ca niciodată..." O fată de împărat privi spre cer și văzu un luceafăr strălucind. Ea-l chemă și-i ceru să coboare la ea. Luceafărul veni sub chip de om frumos, dar fata-i zise că nu poate fi cu el dacă este nemuritor. „Dacă nu mori, atunci nu trăiești cu adevărat", îi spuse ea. Luceafărul se duse la Demiurg și-i ceru să-l facă muritor. Dar Demiurgul răspunse: „Tu ești veșnic. Nu te pot schimba." Când luceafărul se întoarse pe pământ, găsi fata în brațele unui tânăr muritor. Durerea sa fu nemărginită. Poemul se încheie cu celebrele versuri în care luceafărul renunță la dragoste și se întoarce la rece nemurire: „Ce-ți pasă ție, chip de lut, / Dac-oi fi eu sau altul?"`,
    languageFeatures: {
      grammar: ['literary_tenses', 'archaic_regional_forms', 'stylistic_word_order', 'conditional_present', 'subjunctive_sa', 'reported_speech', 'vocative_case', 'relative_clauses_care', 'basic_negation', 'reflexive_verbs', 'vocab_literary_criticism', 'vocab_philosophy_abstract'],
      vocabulary: {
        keywords: ['luceafăr', 'împărat', 'nemuritor', 'Demiurg', 'veșnic', 'nemărginită', 'nemurire', 'versuri'],
        requiredVocabSize: 100,
      },
      structures: ['Perfect simplu (privi, văzu, veni, zise, ceru, fu, spuse)', 'Poetic/archaic register', 'Literary analysis with embedded quotes'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team (analysis of Mihai Eminescu)', license: 'Original' },
    culturalNotes: 'Luceafărul (The Evening Star, 1883) by Mihai Eminescu is the pinnacle of Romanian Romantic poetry. It explores the impossible love between a celestial being and a mortal.',
  },

  // =========================================================================
  // P5: ARCHAIC & REGIONAL FORMS (archaic_regional_forms) — 0 items → 2 items
  // =========================================================================
  {
    type: 'text',
    title: 'Povești din Maramureș: cum vorbeau bunicii',
    difficultyLevel: '8.0',
    durationSeconds: 130,
    topic: 'Dialect și tradiție',
    textContent: `În Maramureș, oamenii mai vorbesc și astăzi un grai vechi, cu forme pe care nu le mai auzi în orașe. Bunica mea, bunăoară, nu spunea „acum", ci „acuma" sau „acuș". Nu zicea „frumos", ci „frumușel", și în loc de „foarte", folosea „tare" sau „nespus de". Când povestea, folosea forme ca „merse" în loc de „a mers" și „făcu" în loc de „a făcut". „Noi nu vorbeam ca la televizor", spunea ea. „Vorbeam cum ne-au învățat moșii și strămoșii." Un cuvânt pe care-l iubeam era „a hăi" — înseamnă a arunca, dar în graiul local suna mult mai expresiv. Sau „a prinde poale" — a fugi repede. Lingviștii spun că dialectul maramureșean păstrează forme din româna veche care au dispărut din limba standard. Este ca o fereastră deschisă spre istoria limbii noastre.`,
    languageFeatures: {
      grammar: ['archaic_regional_forms', 'literary_tenses', 'imperfect_tense', 'reported_speech', 'relative_clauses_care', 'basic_connectors', 'advanced_connectors', 'basic_negation', 'comparative_adjectives', 'diminutives_augmentatives'],
      vocabulary: {
        keywords: ['grai', 'bunăoară', 'acuș', 'moșii', 'strămoșii', 'expresiv', 'lingviștii', 'dialectul', 'dispărut'],
        requiredVocabSize: 90,
      },
      structures: ['Metalinguistic discussion', 'Archaic examples in context', 'Dialect comparison', 'Reported speech from grandparent'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Maramureș in northern Romania preserves one of the oldest Romanian dialects. The wooden churches and traditional way of life are UNESCO protected.',
  },
  {
    type: 'text',
    title: 'Basme populare: Fata babei și fata moșneagului',
    difficultyLevel: '8.5',
    durationSeconds: 150,
    topic: 'Folclor românesc',
    textContent: `Trăia odată un moșneag cu o babă rea. Moșneagul avea o fată bună și harnică, iar baba avea și ea o fată, dar leneșă și rea la suflet. Baba îi dădu fetei moșneagului toate treburile grele. Fata merse la fântână să ia apă și acolo întâlni un broscoi care-i zise: „Spală-mă și te voi răsplăti." Fata se miră, dar făcu cum i se ceru. Broscoiul se prefăcu într-un moș cu barbă albă și-i dărui un cufăr plin cu galbeni. Când baba auzi, o trimise și pe fiică-sa la fântână. Dar aceasta, fiind trufașă, refuză să-l spele pe broscoi. „Du-te de-aici, lighioană!", strigă ea. Broscoiul se prefăcu din nou în moș și-i dărui un cufăr — dar plin de șerpi și broaște. De atunci se zice: „Cum dai, așa primești."`,
    languageFeatures: {
      grammar: ['archaic_regional_forms', 'literary_tenses', 'imperative_basic', 'reflexive_verbs', 'reported_speech', 'vocative_case', 'past_tense_perfect_compus', 'basic_connectors', 'accusative_pronouns', 'dative_pronouns', 'diminutives_augmentatives'],
      vocabulary: {
        keywords: ['moșneag', 'harnică', 'leneșă', 'broscoi', 'cufăr', 'galbeni', 'trufașă', 'lighioană', 'prefăcu'],
        requiredVocabSize: 85,
      },
      structures: ['Perfect simplu (merse, zise, făcu, ceru, auzi, strigă)', 'Fairy tale vocabulary', 'Vocative (lighioană!)', 'Proverb ending'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team (adapted from Ion Creangă)', license: 'Public Domain adaptation' },
    culturalNotes: '"Fata babei și fata moșneagului" (The Old Man\'s Daughter and the Old Woman\'s Daughter) is one of Romania\'s most beloved folk tales, teaching that kindness is rewarded and cruelty punished.',
  },

  // =========================================================================
  // P5: COMBINED CLITICS (clitic_combinations) — 0 items → 3 items
  // Forms: mi-l, ți-l, i-l, ni-l, vi-l, mi-o, ți-o, i-o, etc.
  // =========================================================================
  {
    type: 'text',
    title: 'Mi-l dai sau nu mi-l dai?',
    difficultyLevel: '5.5',
    durationSeconds: 100,
    topic: 'Viața de zi cu zi',
    textContent: `— Unde e telecomanda? Nu o găsesc nicăieri.
— Ți-am pus-o pe masă azi-dimineață. Nu ți-o mai aduci aminte?
— Nu mi-o amintesc deloc. Dar am nevoie de ea. Mi-o dai, te rog?
— Uite-o, e sub ziar. Ți-o dau acum.
— Mulțumesc! Apropo, ai văzut cheia mea de la mașină?
— Da, i-am dat-o tatălui tău. Ți-a cerut-o ieri.
— De ce i-ai dat-o? Aveam nevoie de ea!
— Nu mi-ai spus. Dacă mi-ai fi spus, nu i-aș fi dat-o.
— Bine, o sun pe mama să mi-o trimită. Sau mai bine, îl sun pe tata să mi-o aducă el.
— Du-te și ia-ți-o singur, e mai simplu.
— Ai dreptate. Mi le complic degeaba.`,
    languageFeatures: {
      grammar: ['clitic_combinations', 'accusative_pronouns', 'dative_pronouns', 'reflexive_verbs', 'basic_negation', 'past_tense_perfect_compus', 'imperative_basic', 'conditional_present', 'subjunctive_past'],
      vocabulary: {
        keywords: ['telecomanda', 'amintesc', 'cheia', 'trimită', 'complic', 'degeaba'],
        requiredVocabSize: 65,
      },
      structures: ['Combined clitics throughout (ți-o, mi-o, i-o, mi-l)', 'Dialogue with natural clitic usage', 'Imperative with clitics (ia-ți-o)'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Cadourile de Crăciun',
    difficultyLevel: '6.0',
    durationSeconds: 110,
    topic: 'Familie și sărbători',
    textContent: `De Crăciun, în familia noastră avem o tradiție: fiecare persoană cumpără un cadou pentru altcineva, ales la întâmplare. Anul acesta, mi-a revenit fratele meu. I-am cumpărat o carte pe care mi-o recomandase un prieten. Când i-am dat-o, s-a bucurat foarte mult. „De unde ai știut că mi-o doream?" m-a întrebat. „Nu am știut, mi-a recomandat-o cineva", i-am răspuns. Sora mea i-a cumpărat mamei un fular. Când i l-a arătat, mama a zis: „Cine ți l-a ales? Este exact ce-mi doream!" Tata i-a cumpărat bunicului un album foto. I l-a umplut cu fotografii vechi de familie. Când i l-a deschis, bunicul a plâns de emoție. Mi le amintesc mereu aceste momente. Cadourile nu trebuie să fie scumpe — trebuie doar să le faci cu gândul la persoana care le primește.`,
    languageFeatures: {
      grammar: ['clitic_combinations', 'accusative_pronouns', 'dative_pronouns', 'past_tense_perfect_compus', 'reflexive_verbs', 'relative_clauses_care', 'reported_speech', 'basic_connectors', 'subjunctive_sa', 'pluperfect_tense'],
      vocabulary: {
        keywords: ['tradiție', 'întâmplare', 'recomandase', 'fular', 'album', 'emoție', 'primește'],
        requiredVocabSize: 80,
      },
      structures: ['Combined clitics in narrative (i-am dat-o, i l-a, mi-o, ți l-a)', 'Pluperfect (recomandase)', 'Reported speech chains'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },

  // =========================================================================
  // P5: ADVANCED WORD ORDER (word_order_advanced) — 0 items → 2 items
  // Topicalization, fronting, cleft constructions
  // =========================================================================
  {
    type: 'text',
    title: 'Ceea ce contează cu adevărat',
    difficultyLevel: '7.0',
    durationSeconds: 120,
    topic: 'Reflecții sociale',
    textContent: `Nu banii te fac fericit, ci oamenii din jurul tău. Aceasta este lecția pe care am învățat-o târziu în viață. Fericirii nu-i trebuie lux — îi trebuie sens. Pe prieteni îi apreciezi doar când îi pierzi. Greșelile, pe ele le înțelegi abia după ani. Și timpul — pe el nu-l poți cumpăra cu nimic. Frumoasă este nu casa mare, ci casa în care te simți acasă. Important nu este cât câștigi, ci cât dăruiești. Ceea ce contează cu adevărat este cum te tratezi pe tine și cum îi tratezi pe ceilalți. Acestea sunt lucruri pe care nimeni nu ți le spune la școală. Înveți din viață, din greșeli, din suferință. Și tocmai de aceea sunt valoroase.`,
    languageFeatures: {
      grammar: ['word_order_advanced', 'clitic_doubling', 'basic_negation', 'relative_clauses_care', 'reflexive_verbs', 'accusative_pronouns', 'dative_pronouns', 'advanced_connectors', 'nominalization_complex', 'comparative_adjectives'],
      vocabulary: {
        keywords: ['fericirii', 'apreciezi', 'dăruiești', 'tratezi', 'suferință', 'valoroase'],
        requiredVocabSize: 85,
      },
      structures: ['Topicalization (Greșelile, pe ele le...)', 'Fronting for emphasis (Nu banii...ci)', 'Cleft constructions (Ceea ce contează)', 'Clitic doubling (pe ei îi)'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },

  // =========================================================================
  // P5: IDIOMATIC EXPRESSIONS — 1 item → boost to 4
  // =========================================================================
  {
    type: 'text',
    title: 'Expresii românești pe care trebuie să le cunoști',
    difficultyLevel: '6.0',
    durationSeconds: 120,
    topic: 'Limbă și expresii',
    textContent: `Limba română este plină de expresii colorate care nu se pot traduce literal. Dacă cineva îți spune „a-i merge mintea", înseamnă că este deștept. Dacă „ți-a căzut fața", înseamnă că ai fost dezamăgit. Când „bați câmpii", vorbești fără sens, iar când „dai din casă", spui secrete. „A lua pe cineva de sus" înseamnă a-l trata cu superioritate. „A o lua la sănătoasa" înseamnă a fugi rapid. „A-și face praf" înseamnă a se epuiza complet. Și dacă cineva „nu mișcă un deget", înseamnă că nu face absolut nimic. Multe expresii vin din viața rurală: „a merge ca pe roate" (totul funcționează bine), „a pune sare pe rană" (a agrava o situație), „a ține în frâu" (a controla). Cel mai bun mod de a le învăța este prin conversații reale cu vorbitori nativi.`,
    languageFeatures: {
      grammar: ['idiomatic_expressions', 'reflexive_verbs', 'subjunctive_sa', 'basic_connectors', 'relative_clauses_care', 'infinitive_long', 'basic_negation', 'accusative_pronouns'],
      vocabulary: {
        keywords: ['expresii', 'literal', 'dezamăgit', 'superioritate', 'epuiza', 'rurală', 'frâu', 'nativi'],
        requiredVocabSize: 80,
      },
      structures: ['Idiom explanation format', 'Infinitive long forms (a lua, a merge, a pune)', 'Metalinguistic discussion'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },

  // =========================================================================
  // P6: ENVIRONMENT at lower levels (currently only 8.0)
  // =========================================================================
  {
    type: 'text',
    title: 'Cum să protejăm natura',
    difficultyLevel: '4.5',
    durationSeconds: 100,
    topic: 'Mediu și natură',
    textContent: `Natura este cel mai mare dar pe care îl avem. Dar dacă nu o protejăm, o putem pierde. Iată câteva lucruri simple pe care le putem face toți. În primul rând, trebuie să reciclăm. Hârtia, plasticul și sticla pot fi refolosite. În al doilea rând, putem folosi mai puțină apă. Închide robinetul când te speli pe dinți. De asemenea, putem merge mai mult pe jos sau cu bicicleta în loc de mașină. Plantarea copacilor este și ea importantă — un singur copac absoarbe tone de dioxid de carbon. La școală, copiii învață despre schimbările climatice și despre cum pot ajuta. Fiecare gest mic contează. Dacă toți facem câte puțin, putem face o diferență mare.`,
    languageFeatures: {
      grammar: ['subjunctive_sa', 'imperative_basic', 'basic_connectors', 'advanced_connectors', 'comparative_adjectives', 'relative_clauses_care', 'basic_prepositions', 'vocab_nature', 'plural_nouns'],
      vocabulary: {
        keywords: ['protejăm', 'reciclăm', 'plasticul', 'robinetul', 'copacilor', 'absoarbe', 'climatice', 'diferență'],
        requiredVocabSize: 75,
      },
      structures: ['Advice-giving structure', 'Subjunctive (să reciclăm, să protejăm)', 'Simple scientific vocabulary'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Parcurile Naționale din România',
    difficultyLevel: '6.0',
    durationSeconds: 120,
    topic: 'Mediu și natură',
    textContent: `România are treisprezece parcuri naționale și paisprezece parcuri naturale, ceea ce face din ea una dintre cele mai bogate țări europene din punct de vedere al biodiversității. Munții Carpați adăpostesc cea mai mare populație de urși bruni din Europa — aproximativ șase mii de exemplare. De asemenea, lupii și râșii trăiesc în libertate în pădurile noastre. Delta Dunării, declarată Rezervație a Biosferei de UNESCO, găzduiește peste trei sute de specii de păsări. Cu toate acestea, pădurile României sunt amenințate de tăieri ilegale. Se estimează că în fiecare an se pierd mii de hectare de pădure virgină. Organizații precum Agent Green și WWF luptă pentru protecția acestor resurse. Dacă vrei să ajuți, poți dona, poți face voluntariat sau poți pur și simplu să vizitezi aceste locuri și să le apreciezi.`,
    languageFeatures: {
      grammar: ['vocab_nature', 'relative_clauses_care', 'passive_voice', 'subjunctive_sa', 'advanced_connectors', 'comparative_adjectives', 'impersonal_constructions', 'numbers_advanced', 'vocab_numbers', 'plural_nouns'],
      vocabulary: {
        keywords: ['biodiversitate', 'adăpostesc', 'exemplare', 'Rezervație', 'Biosferei', 'amenințate', 'tăieri', 'virgină'],
        requiredVocabSize: 90,
      },
      structures: ['Factual nature description', 'Passive voice (declarată, amenințate)', 'Statistics and numbers', 'Call to action'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Romania holds about 60% of Europe\'s remaining old-growth forests. Illegal logging is a major issue, with activists sometimes facing threats.',
  },

  // =========================================================================
  // P6: PHILOSOPHY at lower levels (currently only 8.0+)
  // =========================================================================
  {
    type: 'text',
    title: 'Întrebări la care nu există răspunsuri simple',
    difficultyLevel: '5.5',
    durationSeconds: 110,
    topic: 'Filosofie accesibilă',
    textContent: `Ai observat că sunt întrebări la care nimeni nu poate răspunde cu certitudine? De exemplu: ce este fericirea? Unii spun că fericirea vine din bani, alții că vine din relații, iar alții că vine din a face ce îți place. Filozofii s-au gândit la asta de mii de ani. Aristotel credea că fericirea înseamnă să trăiești conform virtuții. Epicur spunea că fericirea vine din plăceri simple: mâncare bună, prieteni dragi, liniște. O altă întrebare mare este: ce înseamnă o viață bună? Este o viață lungă, o viață plină de aventuri, sau o viață în care ajuți pe alții? Nu cred că există un singur răspuns. Fiecare persoană trebuie să-și găsească propriul sens. Și poate tocmai asta este frumusețea vieții — că fiecare o trăiește diferit.`,
    languageFeatures: {
      grammar: ['subjunctive_sa', 'basic_connectors', 'advanced_connectors', 'relative_clauses_care', 'basic_questions', 'imperfect_tense', 'reported_speech', 'reflexive_verbs', 'vocab_philosophy_abstract'],
      vocabulary: {
        keywords: ['certitudine', 'fericirea', 'filozofii', 'virtute', 'plăceri', 'aventuri', 'frumusețea'],
        requiredVocabSize: 80,
      },
      structures: ['Philosophical questioning', 'Multiple perspectives', 'Reported speech from philosophers', 'Rhetorical questions'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },

  // =========================================================================
  // P6: ACADEMIC RESEARCH at lower levels (currently only 9.5)
  // =========================================================================
  {
    type: 'text',
    title: 'Cum funcționează cercetarea științifică',
    difficultyLevel: '6.5',
    durationSeconds: 120,
    topic: 'Cercetare și știință',
    textContent: `Ai fost vreodată curios cum descoperă oamenii de știință lucruri noi? Procesul se numește metoda științifică și are câțiva pași importanți. Mai întâi, cercetătorul observă ceva interesant și pune o întrebare. Apoi, formulează o ipoteză — o explicație posibilă pe care o poate testa. Următorul pas este experimentul: cercetătorul adună date și le analizează. Dacă datele confirmă ipoteza, aceasta devine o teorie. Dacă nu, cercetătorul trebuie să-și modifice ipoteza și să încerce din nou. Un principiu fundamental este că orice experiment trebuie să poată fi repetat de alți cercetători. Aceasta se numește reproductibilitate. Astăzi, multe cercetări se fac în echipe internaționale. De exemplu, vaccinu pentru COVID-19 a fost dezvoltat de echipe din peste treizeci de țări care au colaborat simultan.`,
    languageFeatures: {
      grammar: ['subjunctive_sa', 'passive_voice', 'relative_clauses_care', 'basic_connectors', 'advanced_connectors', 'conditional_present', 'reflexive_verbs', 'impersonal_constructions', 'vocab_science', 'numbers_advanced'],
      vocabulary: {
        keywords: ['cercetător', 'ipoteză', 'experiment', 'date', 'teorie', 'reproductibilitate', 'vaccin', 'colaborat'],
        requiredVocabSize: 85,
      },
      structures: ['Scientific process explanation', 'Passive constructions', 'Conditional reasoning', 'Technical vocabulary in accessible context'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },

  // =========================================================================
  // P6: SOCIOLINGUISTICS at lower levels (currently only 9.5)
  // =========================================================================
  {
    type: 'text',
    title: 'De ce vorbim diferit în funcție de situație',
    difficultyLevel: '6.0',
    durationSeconds: 110,
    topic: 'Limbă și societate',
    textContent: `Ai observat că vorbești diferit cu prietenii față de cum vorbești cu un profesor sau cu un medic? Aceasta se numește variație de registru. Cu prietenii folosim un registru informal: „Ce faci, frate? Hai la un suc!" Cu un profesor, folosim un registru formal: „Bună ziua, domnule profesor. Aș vrea să vă întreb ceva." Limba se schimbă și în funcție de unde ești. Oamenii din Moldova pronunță anumite cuvinte diferit de cei din Transilvania sau Banat. Aceste diferențe se numesc dialecte. Limba se schimbă și cu timpul. Bunicii tăi foloseau cuvinte care astăzi sună ciudat: „dumnealui" în loc de „el", sau „poftim" în loc de „uite". Tinerii de azi folosesc multe cuvinte din engleză: „cool", „weekend", „job". Lingviștii studiază aceste schimbări pentru a înțelege cum evoluează limbile.`,
    languageFeatures: {
      grammar: ['relative_clauses_care', 'basic_connectors', 'advanced_connectors', 'comparative_adjectives', 'reflexive_verbs', 'imperfect_tense', 'conditional_present', 'basic_prepositions', 'basic_questions', 'formal_register'],
      vocabulary: {
        keywords: ['registru', 'informal', 'formal', 'dialecte', 'pronunță', 'lingviștii', 'evoluează'],
        requiredVocabSize: 80,
      },
      structures: ['Metalinguistic discussion', 'Register examples embedded', 'Comparison across time/region', 'Accessible sociolinguistics'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
  },
  {
    type: 'text',
    title: 'Dialectele din România: o hartă lingvistică',
    difficultyLevel: '7.0',
    durationSeconds: 130,
    topic: 'Dialectologie și identitate',
    textContent: `România are patru dialecte principale: daco-român (vorbit în România, Moldova și părți din Serbia), aromân (în Grecia, Albania și Macedonia de Nord), meglenoromân (într-o mică regiune din Grecia) și istroromân (în Istria, Croația). Chiar și în interiorul României, există diferențe semnificative. Moldovenii au tendința de a transforma „e" neaccentuat în „i" — „merg" devine „mirg". Bănățenii folosesc forme ca „am mâncat-o" acolo unde un vorbitor din București ar spune „am mâncat". Transilvănenii păstrează unele forme arhaice și au influențe din maghiară și germană. Oltenii sunt cunoscuți pentru pronunția distinctivă și expresii locale ca „bă, nene". Aceste diferențe nu sunt defecte — sunt dovezi ale unei limbi vii, care se adaptează la comunitățile care o vorbesc. Dialectele sunt patrimoniu cultural și trebuie protejate, nu corectate.`,
    languageFeatures: {
      grammar: ['relative_clauses_care', 'passive_voice', 'advanced_connectors', 'comparative_adjectives', 'impersonal_constructions', 'basic_negation', 'conditional_present', 'plural_nouns', 'genitive_dative_case', 'archaic_regional_forms', 'formal_register'],
      vocabulary: {
        keywords: ['dialecte', 'daco-român', 'aromân', 'semnificative', 'arhaice', 'pronunția', 'patrimoniu', 'protejate'],
        requiredVocabSize: 95,
      },
      structures: ['Linguistic mapping', 'Technical terminology accessible', 'Dialect examples embedded', 'Prescriptivism vs descriptivism stance'],
    },
    sourceAttribution: { creator: 'ChaosLimbă Team', license: 'Original' },
    culturalNotes: 'Romania\'s dialectal diversity is often underappreciated. The four historical dialects of Romanian are sometimes classified as separate Romance languages by some linguists.',
  },
];

async function seed() {
  console.log('🎯 Seeding P5 + P6 content (gap features + topic diversification)...');

  const p5 = gapContent.filter(c =>
    parseFloat(c.difficultyLevel as string) >= 5.5 &&
    (c.languageFeatures as any)?.grammar?.some((g: string) =>
      ['subjunctive_past', 'literary_tenses', 'archaic_regional_forms', 'clitic_combinations', 'word_order_advanced', 'idiomatic_expressions'].includes(g)
    )
  );
  const p6 = gapContent.filter(c => !p5.includes(c));

  console.log(`   P5 (gap features): ${p5.length} items`);
  console.log(`   P6 (topic diversity): ${p6.length} items`);
  console.log(`   Total: ${gapContent.length} items\n`);

  try {
    const inserted = await db.insert(contentItems).values(gapContent).returning();
    console.log(`✅ Successfully seeded ${inserted.length} items!\n`);
    console.log('Items created:');
    for (const item of inserted) {
      const lf = item.languageFeatures as any;
      const tags = (lf?.grammar || []).length;
      console.log(`  [${item.difficultyLevel}] ${item.title} (${item.topic}) — ${tags} tags`);
    }
  } catch (error) {
    console.error('❌ Failed to seed:', error);
  }
  process.exit(0);
}

seed();
