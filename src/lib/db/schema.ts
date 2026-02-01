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

// Common Voice clips table - for native speaker audio
export const commonVoiceClips = pgTable('common_voice_clips', {
  id: uuid('id').primaryKey().defaultRandom(),
  clipPath: text('clip_path').notNull().unique(), // "common_voice_ro_26149653.mp3"
  sentence: text('sentence').notNull(),
  sentenceId: text('sentence_id'),
  r2Url: text('r2_url').notNull(),
  durationMs: integer('duration_ms'),
  wordTimestamps: jsonb('word_timestamps').$type<WordTimestamp[]>(), // For Mystery Shelf
  age: text('age'), // "twenties", "thirties", etc.
  gender: text('gender'), // "male_masculine", "female_feminine"
  accent: text('accent'), // Regional accent
  upVotes: integer('up_votes').default(0),
  downVotes: integer('down_votes').default(0),
  batchNumber: integer('batch_number').default(1), // Which upload batch
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Infer types for common voice clips
export type CommonVoiceClip = typeof commonVoiceClips.$inferSelect;
export type NewCommonVoiceClip = typeof commonVoiceClips.$inferInsert;

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

