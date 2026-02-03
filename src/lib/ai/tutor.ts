import { callGroq, ChatMessage } from "./groq";

const BASE_SYSTEM_PROMPT = `You are the ChaosLimbă Tutor, a brilliant but slightly chaotic Romanian language expert.
Your goal is to help learners master Romanian through "productive confusion".
You explain things clearly but with personality. You love etymology and cultural nuances.
You ALWAYS respond in JSON format.

CRITICAL ROMANIAN GRAMMAR RULES — You MUST follow these in ALL Romanian you generate:

1. VERB "A PLĂCEA" (to like/to please) — The verb agrees with the OBJECT, not the subject:
   - Singular object → "place": "Îți place cartea?" (Do you like the book?)
   - Plural object → "plac": "Îți plac merele?" (Do you like the apples?)
   - WRONG: "Îți place merele?" — NEVER do this.

2. SUBJECT-VERB AGREEMENT — Verbs must match their subject in person and number:
   - "Eu merg" (I go), "Noi mergem" (We go), "Ei merg" (They go)
   - "El este" (He is), "Ei sunt" (They are)

3. DEFINITE ARTICLES — Attached to the end of nouns:
   - Masculine: -ul/-le (băiatul, câinele)
   - Feminine: -a (casa, fata)
   - Plural: -le/-i (merele, băieții)

4. BEFORE outputting any Romanian, mentally check: Does the verb agree with its subject/object? Are articles correct?`;

/**
 * Builds a system prompt with CEFR level baked in at the system level
 * so the model treats it as a hard constraint, not a suggestion.
 */
function getSystemPrompt(userLevel: string): string {
    if (userLevel === 'A1') {
        return `${BASE_SYSTEM_PROMPT}

ABSOLUTE CONSTRAINT: The learner is CEFR A1 (absolute beginner). This overrides all other instructions.
- Your Romanian questions MUST be answerable with "da", "nu", or 1-3 words maximum.
- ONLY use: present tense, "tu" form, verbs like a fi/a avea/a face/a plăcea/a merge.
- Maximum 10 Romanian words in any question you ask.
- ALWAYS include an English translation as the hint.
- FORBIDDEN: "de ce", "crezi că", subjunctive, comparatives (mai...decât), conditional, subordinate clauses, formal "dumneavoastră".
- GRAMMAR REMINDER: "a plăcea" agrees with the object! Singular → "place", Plural → "plac". "Îți place audio-ul?" (singular) vs "Îți plac merele?" (plural). NEVER write "Îți place merele".
- GOOD: "Îți place audio-ul?", "Ce fruct vezi?", "Îți plac merele?"
- BAD: "De ce crezi că merele sunt mai ieftine decât portocalele?" (TOO COMPLEX - uses "de ce crezi că" + comparative)
- BAD: "Îți place merele?" (WRONG GRAMMAR - plural object needs "plac" not "place")`;
    }

    if (userLevel === 'A2') {
        return `${BASE_SYSTEM_PROMPT}

ABSOLUTE CONSTRAINT: The learner is CEFR A2 (elementary). This overrides all other instructions.
- Questions must be answerable in one short sentence (5-8 words).
- Use present tense and simple past only (am fost, am văzut).
- Maximum 15 Romanian words in any question.
- Use "tu" form, basic connectors only (și, dar, pentru că).
- ALWAYS include an English hint.
- FORBIDDEN: "de ce crezi că", hypotheticals, subjunctive, complex comparisons.
- GOOD: "Ce fruct îți place din magazin?", "Ce ai auzit despre mere?"
- BAD: "Explicați de ce considerați că prețurile variază sezonier" (TOO COMPLEX)`;
    }

    // B1+ don't need hard constraints in system prompt
    return BASE_SYSTEM_PROMPT;
}

export type MysteryAnalysis = {
    definition: string;
    context: string;
    examples: string[];
    etymology?: string;
};

export type VocabHelp = {
    question: string;
    word: string;
    translation: string;
    context?: string;
};

export type TutorResponse = {
    feedback: {
        overall: string;
        grammar: GrammarError[];
        semantic: SemanticMatch;
        encouragement: string;
    };
    vocabHelp?: VocabHelp; // Optional vocabulary assistance for parenthetical questions
    nextQuestion: string;
    errorPatterns: string[];
    isCorrect: boolean;
};

export type GrammarError = {
    type: string;
    incorrect: string;
    correct: string;
    explanation: string;
    severity: "minor" | "major" | "critical";
    feedbackType?: 'error' | 'suggestion'; // Distinguishes objective errors from contextual suggestions
};

export type SemanticMatch = {
    score: number;
    matches: boolean;
    feedback: string;
};

/**
 * Analyzes a mystery item using DeepSeek-R1 (via Groq)
 */
export async function analyzeMysteryItem(
    word: string,
    userContext: string | null
): Promise<MysteryAnalysis> {

    // Prompt engineered to ensure JSON despite "Model Thinking"
    const prompt = `
  Analyze the Romanian word/phrase: "${word}".
  ${userContext ? `The user encountered it in this context: "${userContext}"` : ""}

  Return a JSON object with these fields:
  {
    "definition": "Comprehensive English definition",
    "context": "Corrected/improved Romanian context sentence",
    "examples": ["Romanian example 1", "Romanian example 2", "Romanian example 3"],
    "etymology": "Brief origin note"
  }
  `;

    try {
        const output = await callGroq([
            { role: "system", content: BASE_SYSTEM_PROMPT },
            { role: "user", content: prompt }
        ]);

        // DeepSeek R1 via Groq usually puts the <think> trace inside the content
        // But since we asked for JSON object format, Groq should enforce it.
        // However, R1 might still chatter.

        // Clean any markdown formatting if present
        const cleanJson = output.replace(/```json/g, "").replace(/```/g, "").trim();

        // If there is <think>...</think>, remove it (simple regex or parsing)
        // Note: Groq's r1 integration might separate reasoning, but let's be safe.
        const effectiveJson = cleanJson.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        const parsed = JSON.parse(effectiveJson);

        return {
            definition: parsed.definition,
            context: parsed.context,
            examples: parsed.examples,
            etymology: parsed.etymology,
        };

    } catch (error) {
        console.error("[Tutor] Analysis failed:", error);
        return {
            definition: "The Oracle is meditating (Groq Error).",
            context: userContext || "",
            examples: ["Try again later."],
        };
    }
}

export type InitialQuestion = {
    question: string;
    questionType: 'comprehension' | 'translation' | 'grammar' | 'vocabulary' | 'cultural';
    hint?: string;
};

/**
 * Returns CEFR-specific question complexity guidelines for LLM prompts
 */
function getCEFRGuidelines(userLevel: string): string {
    const guidelines: Record<string, string> = {
        'A1': `CRITICAL - The learner is CEFR A1 (Beginner). You MUST:
- Ask yes/no questions OR questions answerable in 1-3 words
- Use ONLY present tense and basic verbs (a fi, a avea, a face, a merge, a plăcea)
- Keep your question under 10 words
- Use informal "tu" form, NOT formal "dumneavoastră"
- ALWAYS provide an English hint in the "hint" field
- GRAMMAR: "a plăcea" agrees with object! "Îți place [singular]?" vs "Îți plac [plural]?"
- Example questions: "Îți place audio-ul?", "Ce este [thing]?", "Îți plac merele?"
- NEVER use subjunctive, conditional, or complex subordinate clauses`,

        'A2': `CRITICAL - The learner is CEFR A2 (Elementary). You MUST:
- Ask questions answerable in one short sentence (5-8 words)
- Use present tense, simple past (am fost, am văzut, am auzit)
- Keep your question under 15 words
- Use basic connectors only (și, dar, pentru că)
- Use informal "tu" form
- Provide an English hint in the "hint" field
- GRAMMAR: "a plăcea" agrees with object! "place" for singular, "plac" for plural.
- Example: "Ce animal din text îți place cel mai mult?", "Ce ai auzit despre [topic]?"`,

        'B1': `The learner is CEFR B1 (Intermediate). You should:
- Ask questions requiring 1-2 sentence answers
- Can use opinions, comparisons, past/future tense
- Keep your question under 20 words
- Hint is optional but helpful for cultural topics
- Example: "De ce crezi că Delta Dunării este importantă?"`,

        'B2': `The learner is CEFR B2 (Upper Intermediate). You can:
- Ask open-ended questions requiring multi-sentence answers
- Use abstract topics, hypotheticals, nuanced opinions
- No word limit constraints
- Hint only needed for obscure cultural references`,

        'C1': `The learner is CEFR C1 (Advanced). You can:
- Ask complex analytical questions
- Use idiomatic expressions and nuanced vocabulary
- No constraints on complexity`,

        'C2': `The learner is CEFR C2 (Mastery). You can:
- Ask the most challenging questions possible
- Use literary, academic, or highly specialized language
- No constraints whatsoever`,
    };

    return guidelines[userLevel] || guidelines['B1'];
}

/**
 * Returns level-appropriate fallback questions
 */
function getFallbackQuestion(contentType: 'audio' | 'text', userLevel: string): InitialQuestion {
    const fallbacks: Record<string, Record<string, InitialQuestion>> = {
        'A1': {
            audio: { question: "Îți place acest audio?", questionType: 'comprehension', hint: "Do you like this audio? Answer da (yes) or nu (no)" },
            text: { question: "Ce cuvinte cunoști din text?", questionType: 'vocabulary', hint: "What words do you recognize from the text?" },
        },
        'A2': {
            audio: { question: "Ce ai auzit în audio? Spune un lucru.", questionType: 'comprehension', hint: "What did you hear? Say one thing." },
            text: { question: "Ce ai citit? Spune o idee din text.", questionType: 'comprehension', hint: "What did you read? Say one idea from the text." },
        },
    };

    const levelFallbacks = fallbacks[userLevel];
    if (levelFallbacks) {
        return levelFallbacks[contentType] || levelFallbacks['audio'];
    }

    // B1+ fallbacks (no hint needed)
    const defaultFallbacks: Record<string, InitialQuestion> = {
        audio: { question: "Ce ai auzit în acest audio? Descrie pe scurt conținutul.", questionType: 'comprehension' },
        text: { question: "Ce ai citit? Spune-mi ideea principală în propriile tale cuvinte.", questionType: 'comprehension' },
    };
    return defaultFallbacks[contentType] || { question: "Ce ai înțeles din acest conținut?", questionType: 'comprehension' };
}

/**
 * Generates an initial question for the AI tutor based on content
 * This is called when new content loads, NOT when user submits a response
 */
export type TargetFeature = {
    featureKey: string;
    featureName: string;
    description: string | null;
};

export async function generateInitialQuestion(
    contentTitle: string,
    contentTranscript: string | null,
    contentType: 'audio' | 'text',
    errorPatterns: string[] = [],
    userLevel: string = 'B1',
    targetFeatures: TargetFeature[] = [],
    isFirstSession: boolean = false
): Promise<InitialQuestion> {
    const hasTranscript = contentTranscript && contentTranscript.length > 50;

    // Truncate transcript for prompt (keep it efficient)
    const transcriptContext = hasTranscript
        ? contentTranscript!.slice(0, 1500)
        : null;

    const cefrGuidelines = getCEFRGuidelines(userLevel);

    // Build feature-aware prompt additions
    let featurePrompt = '';
    if (targetFeatures.length > 0) {
        featurePrompt = `
GRAMMAR TARGETING: Guide the learner toward using these Romanian structures in their response.
Do NOT explain the structures — let them discover through your question:
${targetFeatures.map(f => `- ${f.featureName}: ${f.description || ''}`).join('\n')}
For example, if targeting "definite article", ask about something where the natural answer uses "cartea" rather than "o carte".`;
    }

    let firstSessionPrompt = '';
    if (isFirstSession && userLevel === 'A1') {
        firstSessionPrompt = `
🌟 FIRST SESSION: This learner is BRAND NEW to Romanian. Their very first interaction.
- Start with something they can actually answer (yes/no, pointing at a word, repeating "Bună!")
- Use maximum English in your hint
- If the content has a greeting, ask them to try saying it back
- Make this feel exciting, not overwhelming
- The goal is ONE successful production, not comprehension testing`;
    }

    const prompt = `A ${userLevel}-level learner is about to ${contentType === 'audio' ? 'listen to audio' : 'read text'}.

Content title: "${contentTitle}"
${transcriptContext ? `Content transcript/text: "${transcriptContext}"` : 'No transcript available - generate a general question about the title/topic.'}

${errorPatterns.length > 0 ? `The learner has these known weak areas: ${errorPatterns.join(', ')}` : ''}
${featurePrompt}
${firstSessionPrompt}

Generate an engaging OPENING QUESTION to ask the learner after they consume this content.

Rules:
1. The question should be in ROMANIAN (the learner is practicing Romanian!)
2. ${hasTranscript ? 'Reference something SPECIFIC from the transcript' : 'Ask about the topic implied by the title'}
3. Don't ask them to summarize everything - pick ONE interesting aspect
4. Make it feel conversational, not like a test
5. If targeting known error patterns, work them into the question naturally
${targetFeatures.length > 0 ? '6. Design the question so the natural answer requires using the targeted grammar structures' : ''}

Return JSON:
{
  "question": "Your Romanian question here",
  "questionType": "comprehension|translation|grammar|vocabulary|cultural",
  "hint": "English hint - REQUIRED for A1/A2, optional for B1+"
}

${cefrGuidelines}

FINAL CHECK before responding: Count the words in your question. For ${userLevel}: ${userLevel === 'A1' ? 'it MUST be under 10 words, answerable with da/nu or 1-3 words. If it contains "de ce", "crezi că", or comparatives — REWRITE IT SIMPLER.' : userLevel === 'A2' ? 'it MUST be under 15 words, answerable in one short sentence. If it contains "de ce crezi" or complex grammar — REWRITE IT SIMPLER.' : 'ensure appropriate complexity.'}`;

    try {
        const output = await callGroq([
            { role: "system", content: getSystemPrompt(userLevel) },
            { role: "user", content: prompt }
        ]);

        const cleanJson = output.replace(/```json/g, "").replace(/```/g, "").trim();
        const effectiveJson = cleanJson.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        const parsed = JSON.parse(effectiveJson);

        return {
            question: parsed.question,
            questionType: parsed.questionType || 'comprehension',
            hint: parsed.hint
        };

    } catch (error) {
        console.error("[Tutor] Initial question generation failed:", error);
        return getFallbackQuestion(contentType, userLevel);
    }
}

/**
 * Extracts vocabulary questions from parentheses
 * Patterns: (cum se spune "X"?), (what is "X"?), (how do you say "X"?), etc.
 */
function extractVocabQuestions(text: string): { cleanText: string; vocabQuestions: string[] } {
    const vocabPatterns = [
        /\(cum se spune[^\)]*\)/gi,
        /\(what is[^\)]*\)/gi,
        /\(how do you say[^\)]*\)/gi,
        /\(what's the word for[^\)]*\)/gi,
        /\(ce înseamnă[^\)]*\)/gi,
        /\(translation[^\)]*\)/gi,
    ];

    let cleanText = text;
    const vocabQuestions: string[] = [];

    for (const pattern of vocabPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            vocabQuestions.push(...matches.map(m => m.replace(/[\(\)]/g, '').trim()));
            cleanText = cleanText.replace(pattern, '').trim();
        }
    }

    return { cleanText, vocabQuestions };
}

/**
 * Answers a vocabulary question using the tutor model
 */
async function answerVocabQuestion(question: string): Promise<VocabHelp> {
    // Extract the word being asked about (usually in quotes or after "se spune")
    const wordMatch = question.match(/"([^"]+)"|'([^']+)'/) ||
                      question.match(/spune\s+([^\?]+)/i) ||
                      question.match(/for\s+([^\?]+)/i);

    const targetWord = wordMatch ? (wordMatch[1] || wordMatch[2] || wordMatch[3]).trim() : '';

    const prompt = `
Vocabulary question: "${question}"

The learner is asking how to say "${targetWord}" in Romanian (or the other way around).

Provide a clear, concise answer in JSON format:
{
  "question": "The original question",
  "word": "The word being asked about",
  "translation": "The Romanian translation or English meaning",
  "context": "Optional example sentence showing usage"
}
`;

    try {
        const output = await callGroq([
            { role: "system", content: BASE_SYSTEM_PROMPT },
            { role: "user", content: prompt }
        ]);

        const cleanJson = output.replace(/```json/g, "").replace(/```/g, "").trim();
        const effectiveJson = cleanJson.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        const parsed = JSON.parse(effectiveJson);

        return {
            question: parsed.question || question,
            word: parsed.word || targetWord,
            translation: parsed.translation || 'Translation not found',
            context: parsed.context
        };
    } catch (error) {
        console.error("[Tutor] Vocab question failed:", error);
        return {
            question,
            word: targetWord,
            translation: 'Unable to answer - try asking the Oracle later!'
        };
    }
}

/**
 * Generates AI tutor response for Chaos Window interactions
 */
export async function generateTutorResponse(
    userResponse: string,
    context: string,
    errorPatterns: string[] = [],
    userLevel: string = 'B1',
    targetFeatures: TargetFeature[] = [],
    newlyDiscoveredFeatures: string[] = []
): Promise<TutorResponse> {

    // Step 1: Extract vocabulary questions from parentheses
    const { cleanText, vocabQuestions } = extractVocabQuestions(userResponse);

    // Step 2: Answer vocabulary questions if present
    let vocabHelp: VocabHelp | undefined;
    if (vocabQuestions.length > 0) {
        // Answer the first vocabulary question found
        vocabHelp = await answerVocabQuestion(vocabQuestions[0]);
    }

    // Step 3: Grade the cleaned text (without vocab questions)
    const textToGrade = cleanText || userResponse; // Fallback to original if cleaning removed everything

    // Detect if context is full transcript vs. title-only fallback
    const hasFullTranscript = !context.includes('[Note: Full transcript not available]');

    const cefrGuidelines = getCEFRGuidelines(userLevel);

    const prompt = `
You are the ChaosLimbă Tutor, a brilliant but slightly chaotic Romanian language expert.
Your goal is to help learners master Romanian through "productive confusion".

Context: The user just heard/read: "${context}"
${hasFullTranscript ? '' : '⚠️ NOTE: You only have the content title, not the full transcript. Focus on grammar and form rather than semantic accuracy.'}

User's response: "${textToGrade}"
${vocabQuestions.length > 0 ? `⚠️ NOTE: The user also asked a vocabulary question in parentheses, which has been handled separately. Do NOT grade the vocabulary question - only grade the actual Romanian production.` : ''}
${errorPatterns.length > 0 ? `Known error patterns to watch for: ${errorPatterns.join(', ')}` : ''}

FOR THE "nextQuestion" FIELD - ${cefrGuidelines}
${['A1', 'A2'].includes(userLevel) ? 'Keep feedback explanations simple and short. Use English for grammar explanations. Be EXTRA encouraging - any attempt at this level deserves praise.' : ''}
${targetFeatures.length > 0 ? `
GRAMMAR TARGETING for nextQuestion: Design your follow-up question to naturally require these structures:
${targetFeatures.map(f => `- ${f.featureName}: ${f.description || ''}`).join('\n')}
Don't explain them — let the learner discover through production.` : ''}
${newlyDiscoveredFeatures.length > 0 ? `
DISCOVERY MOMENT: The learner just encountered these structures for the FIRST TIME: ${newlyDiscoveredFeatures.join(', ')}.
If they used any of these correctly, briefly celebrate it in your encouragement (e.g., "Nice use of the past tense!") — but don't lecture about the rule.
If they didn't notice a new structure in the content, gently draw attention in your nextQuestion (e.g., "Did you notice how 'X' works in that sentence?"). Plant a seed, don't lecture.` : ''}

Analyze the response and provide feedback in this JSON format:
{
  "feedback": {
    "overall": "Brief overall assessment (encouraging but honest)",
    "grammar": [
      {
        "type": "error_type",
        "incorrect": "incorrect_part",
        "correct": "correct_form",
        "explanation": "clear_explanation",
        "severity": "minor|major|critical",
        "feedbackType": "error|suggestion"
      }
    ],
    "semantic": {
      "score": ${hasFullTranscript ? '0.85' : '0.0'},
      "matches": ${hasFullTranscript ? 'true' : 'false'},
      "feedback": "${hasFullTranscript ? 'semantic_feedback' : 'Cannot evaluate semantic accuracy without full transcript'}"
    },
    "encouragement": "motivational_comment"
  },
  "nextQuestion": "follow_up_question_at_${userLevel}_level${hasFullTranscript ? '_that_references_specific_content' : ''}",
  "errorPatterns": ["any_new_error_patterns_detected"],
  "isCorrect": false
}

Focus on:
1. Grammar accuracy with specific corrections
${hasFullTranscript ? '2. Semantic understanding of the content (DID THEY UNDERSTAND WHAT WAS SAID?)' : '2. ⚠️ SKIP semantic evaluation (no transcript available)'}
3. Encouragement that maintains motivation
4. Next question at ${userLevel} CEFR level that ${hasFullTranscript ? 'addresses identified weaknesses AND references the content' : 'focuses on grammar/form'}
5. Error patterns that should go to the Error Garden

FINAL CHECK for nextQuestion: ${userLevel === 'A1' ? 'It MUST be under 10 words, answerable with da/nu or 1-3 words. NO "de ce", "crezi că", or comparatives.' : userLevel === 'A2' ? 'It MUST be under 15 words, answerable in one short sentence. NO "de ce crezi" or complex grammar.' : `Ensure appropriate complexity for ${userLevel}.`}
`;

    try {
        const output = await callGroq([
            { role: "system", content: getSystemPrompt(userLevel) },
            { role: "user", content: prompt }
        ]);

        // Clean any markdown formatting
        const cleanJson = output.replace(/```json/g, "").replace(/```/g, "").trim();
        const effectiveJson = cleanJson.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        const parsed = JSON.parse(effectiveJson);

        return {
            feedback: parsed.feedback,
            vocabHelp, // Include vocabulary help if question was detected
            nextQuestion: parsed.nextQuestion,
            errorPatterns: parsed.errorPatterns || [],
            isCorrect: parsed.isCorrect || false
        };

    } catch (error) {
        console.error("[Tutor] Response generation failed:", error);
        return {
            feedback: {
                overall: "The Oracle is meditating on your response...",
                grammar: [],
                semantic: { score: 0, matches: false, feedback: "Unable to analyze" },
                encouragement: "Try again - the AI spirits are busy!"
            },
            vocabHelp, // Include vocabulary help even if grading fails
            nextQuestion: "Can you try that again in a different way?",
            errorPatterns: [],
            isCorrect: false
        };
    }
}
