import { pgTable, uuid, text, timestamp, decimal, integer, jsonb, boolean as pgBoolean } from 'drizzle-orm/pg-core';

// Type definitions for JSONB fields
export type LanguageFeatures = {
  grammar: string[];
  vocabulary: {
    keywords: string[];
    requiredVocabSize: number;
  };
  structures: string[];
};

export type SourceAttribution = {
  creator: string;
  originalUrl?: string;
  license: string;
};

// Content type enum
export const contentTypeEnum = ['audio', 'text'] as const;
export type ContentType = (typeof contentTypeEnum)[number];

// Main content_items table
export const contentItems = pgTable('content_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').$type<ContentType>().notNull(),
  title: text('title').notNull(),
  difficultyLevel: decimal('difficulty_level', { precision: 3, scale: 1 }).notNull(),
  durationSeconds: integer('duration_seconds').notNull(),

  // Audio-specific fields
  audioUrl: text('audio_url'),

  // Text-specific fields
  textContent: text('text_content'),
  textUrl: text('text_url'),

  // Transcript fields (for audio content)
  transcript: text('transcript'), // Full transcript text
  transcriptSource: text('transcript_source'), // 'whisper', 'manual'
  transcriptLanguage: text('transcript_language').default('ro'), // Language code (default Romanian)

  // Metadata fields
  languageFeatures: jsonb('language_features').$type<LanguageFeatures>(),
  topic: text('topic').notNull(),
  sourceAttribution: jsonb('source_attribution').$type<SourceAttribution>().notNull(),
  culturalNotes: text('cultural_notes'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Infer types for use in application
export type ContentItem = typeof contentItems.$inferSelect;
export type NewContentItem = typeof contentItems.$inferInsert;

// Error type enum
export const errorTypeEnum = ['grammar', 'pronunciation', 'vocabulary', 'word_order'] as const;
export type ErrorType = (typeof errorTypeEnum)[number];

// Error source enum
export const errorSourceEnum = ['chaos_window', 'content_player', 'deep_fog', 'manual'] as const;
export type ErrorSource = (typeof errorSourceEnum)[number];

// Session type enum
export const sessionTypeEnum = ['chaos_window', 'deep_fog', 'content', 'mystery_shelf'] as const;
export type SessionType = (typeof sessionTypeEnum)[number];

// Modality enum (text vs speech)
export const modalityEnum = ['text', 'speech'] as const;
export type Modality = (typeof modalityEnum)[number];

// Feedback type enum (error vs suggestion)
export const feedbackTypeEnum = ['error', 'suggestion'] as const;
export type FeedbackType = (typeof feedbackTypeEnum)[number];

// Error logs table - tracks user errors for Error Garden
export const errorLogs = pgTable('error_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  errorType: text('error_type').$type<ErrorType>().notNull(),
  category: text('category'), // subcategory like 'genitive_case', 'verb_conjugation'
  context: text('context'), // the sentence/phrase where error occurred
  correction: text('correction'), // the correct form
  source: text('source').$type<ErrorSource>().notNull(),
  modality: text('modality').$type<Modality>().default('text'), // track text vs speech
  feedbackType: text('feedback_type').$type<FeedbackType>().default('error'), // distinguishes objective errors from contextual suggestions
  contentId: uuid('content_id').references(() => contentItems.id),
  sessionId: uuid('session_id').references(() => sessions.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sessions table - tracks user learning sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  sessionType: text('session_type').$type<SessionType>().notNull(),
  contentId: uuid('content_id').references(() => contentItems.id),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  durationSeconds: integer('duration_seconds'),
});

// Infer types for error logs
export type ErrorLog = typeof errorLogs.$inferSelect;
export type NewErrorLog = typeof errorLogs.$inferInsert;

// Infer types for sessions
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// Mystery Shelf Items table
export const mysteryItems = pgTable('mystery_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  word: text('word').notNull(),
  context: text('context'),
  definition: text('definition'),
  examples: jsonb('examples').$type<string[]>(),
  isExplored: pgBoolean('is_explored').default(false).notNull(),
  source: text('source').default('manual').notNull(), // 'manual', 'deep_fog'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Infer types for mystery items
export type MysteryItem = typeof mysteryItems.$inferSelect;
export type NewMysteryItem = typeof mysteryItems.$inferInsert;

// User Preferences table
export const userPreferences = pgTable('user_preferences', {
  userId: text('user_id').primaryKey().notNull(), // Clerk user ID
  languageLevel: text('language_level').$type<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>().default('A1').notNull(), // CEFR level, calculated by app
  onboardingCompleted: pgBoolean('onboarding_completed').default(false).notNull(), // Has user completed proficiency test
  defaultChaosWindowDuration: integer('default_chaos_window_duration').default(300).notNull(), // 5 minutes default, in seconds
  emailNotifications: pgBoolean('email_notifications').default(false).notNull(), // Opt-in weekly summaries
  analyticsEnabled: pgBoolean('analytics_enabled').default(false).notNull(), // Anonymous usage tracking
  dataCollectionEnabled: pgBoolean('data_collection_enabled').default(false).notNull(), // Error patterns for research
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Infer types for user preferences
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

// Word timestamp type for Mystery Shelf
export type WordTimestamp = {
  word: string;
  start: number; // seconds
  end: number;   // seconds
};

// TTS Usage table - tracks ElevenLabs character usage per user per day
export const ttsUsage = pgTable('tts_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  charactersUsed: integer('characters_used').notNull(),
  date: timestamp('date').notNull(), // truncated to day for aggregation
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type TtsUsage = typeof ttsUsage.$inferSelect;
export type NewTtsUsage = typeof ttsUsage.$inferInsert;

// Proficiency period enum
export const proficiencyPeriodEnum = ['daily', 'weekly', 'monthly'] as const;
export type ProficiencyPeriod = (typeof proficiencyPeriodEnum)[number];

// Proficiency History table - tracks proficiency over time
export const proficiencyHistory = pgTable('proficiency_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  overallScore: decimal('overall_score', { precision: 3, scale: 1 }).notNull(), // 1.0-10.0
  listeningScore: decimal('listening_score', { precision: 3, scale: 1 }),
  readingScore: decimal('reading_score', { precision: 3, scale: 1 }),
  speakingScore: decimal('speaking_score', { precision: 3, scale: 1 }),
  writingScore: decimal('writing_score', { precision: 3, scale: 1 }),
  period: text('period').$type<ProficiencyPeriod>().default('daily').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

// Infer types for proficiency history
export type ProficiencyHistoryRecord = typeof proficiencyHistory.$inferSelect;
export type NewProficiencyHistoryRecord = typeof proficiencyHistory.$inferInsert;

// Generated content type enum
export const generatedContentTypeEnum = ['practice_sentences', 'mini_lesson', 'corrected_version'] as const;
export type GeneratedContentType = (typeof generatedContentTypeEnum)[number];

// Generation trigger enum
export const generationTriggerEnum = ['on_demand', 'background'] as const;
export type GenerationTrigger = (typeof generationTriggerEnum)[number];

// Generated personalized content table - stores audio content tailored to user error patterns
export const generatedContent = pgTable('generated_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  contentType: text('content_type').$type<GeneratedContentType>().notNull(),
  trigger: text('trigger').$type<GenerationTrigger>().notNull(),

  // Content
  romanianText: text('romanian_text').notNull(),
  englishText: text('english_text'),

  // Audio
  audioUrl: text('audio_url'),
  audioCharacterCount: integer('audio_character_count'),
  audioEstimatedCost: decimal('audio_estimated_cost', { precision: 8, scale: 6 }),

  // Error pattern linkage
  targetErrorType: text('target_error_type').$type<ErrorType>(),
  targetCategory: text('target_category'),
  patternFingerprint: text('pattern_fingerprint'),

  // Context
  userLevel: text('user_level').$type<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>(),
  sessionId: uuid('session_id').references(() => sessions.id),
  voiceGender: text('voice_gender').default('female'),

  // Tracking
  isListened: pgBoolean('is_listened').default(false).notNull(),
  listenedAt: timestamp('listened_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type GeneratedContent = typeof generatedContent.$inferSelect;
export type NewGeneratedContent = typeof generatedContent.$inferInsert;

// CEFR level type
export const cefrLevelEnum = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CEFRLevelEnum = (typeof cefrLevelEnum)[number];

// Stress minimal pairs table - pronunciation practice words with stress variants
export const stressMinimalPairs = pgTable('stress_minimal_pairs', {
  id: uuid('id').primaryKey().defaultRandom(),
  word: text('word').notNull(),
  stress: text('stress').notNull(),
  meaning: text('meaning').notNull(),
  example: text('example').notNull(),
  isSuggested: pgBoolean('is_suggested').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type StressMinimalPair = typeof stressMinimalPairs.$inferSelect;
export type NewStressMinimalPair = typeof stressMinimalPairs.$inferInsert;

// Suggested questions table - curated questions for Ask Tutor page
export const suggestedQuestions = pgTable('suggested_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  question: text('question').notNull(),
  category: text('category'),
  cefrLevel: text('cefr_level').$type<CEFRLevelEnum>(),
  isActive: pgBoolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type SuggestedQuestion = typeof suggestedQuestions.$inferSelect;
export type NewSuggestedQuestion = typeof suggestedQuestions.$inferInsert;

// Reading questions table - reading comprehension questions for onboarding
export const readingQuestions = pgTable('reading_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  level: text('level').$type<CEFRLevelEnum>().notNull(),
  passage: text('passage').notNull(),
  question: text('question').notNull(),
  options: jsonb('options').$type<string[]>().notNull(),
  correctIndex: integer('correct_index').notNull(),
  isActive: pgBoolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ReadingQuestion = typeof readingQuestions.$inferSelect;
export type NewReadingQuestion = typeof readingQuestions.$inferInsert;

// Tutor opening messages table - onboarding tutor greeting messages by self-assessment level
export const tutorOpeningMessages = pgTable('tutor_opening_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  selfAssessmentKey: text('self_assessment_key').notNull().unique(),
  message: text('message').notNull(),
  isActive: pgBoolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type TutorOpeningMessage = typeof tutorOpeningMessages.$inferSelect;
export type NewTutorOpeningMessage = typeof tutorOpeningMessages.$inferInsert;

// Feature category enum
export const featureCategoryEnum = ['grammar', 'vocabulary_domain'] as const;
export type FeatureCategory = (typeof featureCategoryEnum)[number];

// Exposure type enum
export const exposureTypeEnum = ['encountered', 'produced', 'corrected'] as const;
export type ExposureType = (typeof exposureTypeEnum)[number];

// Grammar Feature Map table - reference table of Romanian grammar/vocab features by CEFR level
export const grammarFeatureMap = pgTable('grammar_feature_map', {
  id: uuid('id').primaryKey().defaultRandom(),
  featureKey: text('feature_key').notNull().unique(), // e.g. 'present_tense_a_fi', 'definite_article'
  featureName: text('feature_name').notNull(), // Human-readable, e.g. "Present Tense: a fi (to be)"
  cefrLevel: text('cefr_level').$type<CEFRLevelEnum>().notNull(),
  category: text('category').$type<FeatureCategory>().notNull(), // 'grammar' | 'vocabulary_domain'
  description: text('description'), // Brief description for AI prompting
  prerequisites: jsonb('prerequisites').$type<string[]>().default([]), // Soft ordering hints (featureKeys)
  sortOrder: integer('sort_order').default(0).notNull(), // Rough priority within level
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type GrammarFeature = typeof grammarFeatureMap.$inferSelect;
export type NewGrammarFeature = typeof grammarFeatureMap.$inferInsert;

// User Feature Exposure table - append-only log of user encounters with grammar/vocab features
export const userFeatureExposure = pgTable('user_feature_exposure', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  featureKey: text('feature_key').notNull(), // References grammarFeatureMap.featureKey
  exposureType: text('exposure_type').$type<ExposureType>().notNull(),
  contentId: uuid('content_id').references(() => contentItems.id),
  sessionId: uuid('session_id').references(() => sessions.id),
  isCorrect: pgBoolean('is_correct'), // null for 'encountered', true/false for 'produced'/'corrected'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type UserFeatureExposureRecord = typeof userFeatureExposure.$inferSelect;
export type NewUserFeatureExposure = typeof userFeatureExposure.$inferInsert;

