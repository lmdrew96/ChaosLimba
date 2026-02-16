interface PageGuideConfig {
  pageName: string
  pageDescription: string
  suggestedQuestions: string[]
}

const guideConfig: Record<string, PageGuideConfig> = {
  "/chaos-window": {
    pageName: "Chaos Window",
    pageDescription: "Your main practice space — timed sessions with smart content selection that adapts to your weaknesses.",
    suggestedQuestions: [
      "How does the smart content selection work?",
      "What are fossilization alerts?",
      "Why is the session timed?",
      "How does this adapt to my mistakes?",
    ],
  },
  "/workshop": {
    pageName: "Workshop",
    pageDescription: "Grammar challenges that target your weak spots with 7 different exercise types.",
    suggestedQuestions: [
      "What are the 7 challenge types?",
      "How does it pick which grammar to practice?",
      "What is destabilization and why does it help?",
      "Why are the exercises non-linear?",
    ],
  },
  "/deep-fog": {
    pageName: "Deep Fog",
    pageDescription: "Dive into challenging content just beyond your level — productive confusion that builds fluency.",
    suggestedQuestions: [
      "What is 'productive confusion'?",
      "How does fog depth work?",
      "Why is struggling with hard content useful?",
      "How does CEFR filtering help me?",
    ],
  },
  "/error-garden": {
    pageName: "Error Garden",
    pageDescription: "Your errors visualized as a garden — patterns, trends, and fossilization tiers that track your growth.",
    suggestedQuestions: [
      "Why are errors treated as 'gold'?",
      "What are fossilization tiers?",
      "How do error trends help me improve?",
      "What is L1 transfer interference?",
    ],
  },
  "/mystery-shelf": {
    pageName: "Mystery Shelf",
    pageDescription: "Unknown words and phrases you've encountered — explore them with AI and build your vocabulary.",
    suggestedQuestions: [
      "How does AI exploration work here?",
      "What's the best way to review unknowns?",
      "How do items get added to my shelf?",
      "Why is this better than a flashcard app?",
    ],
  },
  "/proficiency-tracker": {
    pageName: "Proficiency Tracker",
    pageDescription: "Track your progress across all skills with real data from your practice history.",
    suggestedQuestions: [
      "How is my proficiency calculated?",
      "What do the skill insights mean?",
      "Why don't you use streaks?",
      "How often should I check my progress?",
    ],
  },
  "/ce-inseamna": {
    pageName: "Ce înseamnă?",
    pageDescription: "Quick word/phrase lookup — find out what Romanian text means instantly.",
    suggestedQuestions: [
      "How is this different from Google Translate?",
      "Does it remember what I look up?",
      "Can I look up phrases, not just words?",
    ],
  },
  "/cum-se-pronunta": {
    pageName: "Cum se pronunță?",
    pageDescription: "Pronunciation practice — hear how Romanian sounds and practice speaking.",
    suggestedQuestions: [
      "How does pronunciation analysis work?",
      "What should I focus on as an English speaker?",
      "Can I practice specific sounds?",
    ],
  },
  "/ask-tutor": {
    pageName: "Ask Tutor",
    pageDescription: "Your AI Romanian tutor — ask any question about the language and get expert answers.",
    suggestedQuestions: [
      "What can I ask the tutor about?",
      "How is the tutor different from the Chaos Guide?",
      "Does the tutor remember our conversations?",
    ],
  },
  "/journey": {
    pageName: "Your Learning Journey",
    pageDescription: "AI-generated narratives of your Romanian progress — reflect on your story and understand your growth.",
    suggestedQuestions: [
      "Why Romanian?",
      "How are my learning narratives generated?",
      "Why does reflecting on my journey help me learn?",
      "What data goes into my story?",
    ],
  },
  "/settings": {
    pageName: "Settings",
    pageDescription: "Customize your ChaosLimbă experience — themes, preferences, and more.",
    suggestedQuestions: [
      "What themes are available?",
      "Can I change how the app looks?",
      "What settings affect my learning?",
    ],
  },
}

const fallbackConfig: PageGuideConfig = {
  pageName: "ChaosLimbă",
  pageDescription: "Your AI-powered Romanian learning platform built on chaos theory and SLA research.",
  suggestedQuestions: [
    "What makes ChaosLimbă different?",
    "How does the AI ensemble work?",
    "What is the chaos theory approach?",
    "Where should I start?",
  ],
}

export function getGuideConfig(pathname: string): PageGuideConfig {
  return guideConfig[pathname] || fallbackConfig
}
