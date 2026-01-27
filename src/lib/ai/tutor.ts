import { callGroq, ChatMessage } from "./groq";

const SYSTEM_PROMPT = `You are the ChaosLimbă Tutor, a brilliant but slightly chaotic Romanian language expert. 
Your goal is to help learners master Romanian through "productive confusion".
You explain things clearly but with personality. You love etymology and cultural nuances.
You ALWAYS respond in JSON format.`;

export type MysteryAnalysis = {
    definition: string;
    context: string;
    examples: string[];
    etymology?: string;
};

export type TutorResponse = {
    feedback: {
        overall: string;
        grammar: GrammarError[];
        semantic: SemanticMatch;
        encouragement: string;
    };
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
            { role: "system", content: SYSTEM_PROMPT },
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
 * Generates an initial question for the AI tutor based on content
 * This is called when new content loads, NOT when user submits a response
 */
export async function generateInitialQuestion(
    contentTitle: string,
    contentTranscript: string | null,
    contentType: 'video' | 'audio' | 'text',
    errorPatterns: string[] = []
): Promise<InitialQuestion> {
    const hasTranscript = contentTranscript && contentTranscript.length > 50;

    // Truncate transcript for prompt (keep it efficient)
    const transcriptContext = hasTranscript
        ? contentTranscript!.slice(0, 1500)
        : null;

    const prompt = `
You are the ChaosLimbă Tutor. A learner is about to ${contentType === 'video' ? 'watch a video' : contentType === 'audio' ? 'listen to audio' : 'read text'}.

Content title: "${contentTitle}"
${transcriptContext ? `Content transcript/text: "${transcriptContext}"` : 'No transcript available - generate a general question about the title/topic.'}

${errorPatterns.length > 0 ? `The learner has these known weak areas: ${errorPatterns.join(', ')}` : ''}

Generate an engaging OPENING QUESTION to ask the learner after they consume this content.

Rules:
1. The question should be in ROMANIAN (the learner is practicing Romanian!)
2. ${hasTranscript ? 'Reference something SPECIFIC from the transcript' : 'Ask about the topic implied by the title'}
3. Don't ask them to summarize everything - pick ONE interesting aspect
4. Make it feel conversational, not like a test
5. If targeting known error patterns, work them into the question naturally

Return JSON:
{
  "question": "Your Romanian question here - should be 1-2 sentences",
  "questionType": "comprehension|translation|grammar|vocabulary|cultural",
  "hint": "Optional hint in English if the question is challenging"
}
`;

    try {
        const output = await callGroq([
            { role: "system", content: SYSTEM_PROMPT },
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
        // Fallback questions based on content type
        const fallbacks = {
            video: "Ce ai înțeles din acest videoclip? Povestește-mi în câteva propoziții.",
            audio: "Ce ai auzit în acest audio? Descrie pe scurt conținutul.",
            text: "Ce ai citit? Spune-mi ideea principală în propriile tale cuvinte."
        };
        return {
            question: fallbacks[contentType] || "Ce ai înțeles din acest conținut?",
            questionType: 'comprehension'
        };
    }
}

/**
 * Generates AI tutor response for Chaos Window interactions
 */
export async function generateTutorResponse(
    userResponse: string,
    context: string,
    errorPatterns: string[] = []
): Promise<TutorResponse> {

    // Detect if context is full transcript vs. title-only fallback
    const hasFullTranscript = !context.includes('[Note: Full transcript not available]');

    const prompt = `
You are the ChaosLimbă Tutor, a brilliant but slightly chaotic Romanian language expert.
Your goal is to help learners master Romanian through "productive confusion".

Context: The user just heard/read: "${context}"
${hasFullTranscript ? '' : '⚠️ NOTE: You only have the content title, not the full transcript. Focus on grammar and form rather than semantic accuracy.'}

User's response: "${userResponse}"
${errorPatterns.length > 0 ? `Known error patterns to watch for: ${errorPatterns.join(', ')}` : ''}

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
        "severity": "minor|major|critical"
      }
    ],
    "semantic": {
      "score": ${hasFullTranscript ? '0.85' : '0.0'},
      "matches": ${hasFullTranscript ? 'true' : 'false'},
      "feedback": "${hasFullTranscript ? 'semantic_feedback' : 'Cannot evaluate semantic accuracy without full transcript'}"
    },
    "encouragement": "motivational_comment"
  },
  "nextQuestion": "follow_up_question${hasFullTranscript ? '_that_references_specific_content' : ''}",
  "errorPatterns": ["any_new_error_patterns_detected"],
  "isCorrect": false
}

Focus on:
1. Grammar accuracy with specific corrections
${hasFullTranscript ? '2. Semantic understanding of the content (DID THEY UNDERSTAND WHAT WAS SAID?)' : '2. ⚠️ SKIP semantic evaluation (no transcript available)'}
3. Encouragement that maintains motivation
4. Next question that ${hasFullTranscript ? 'addresses identified weaknesses AND references the content' : 'focuses on grammar/form'}
5. Error patterns that should go to the Error Garden
`;

    try {
        const output = await callGroq([
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt }
        ]);

        // Clean any markdown formatting
        const cleanJson = output.replace(/```json/g, "").replace(/```/g, "").trim();
        const effectiveJson = cleanJson.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        const parsed = JSON.parse(effectiveJson);

        return {
            feedback: parsed.feedback,
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
            nextQuestion: "Can you try that again in a different way?",
            errorPatterns: [],
            isCorrect: false
        };
    }
}
