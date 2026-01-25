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
export const contentTypeEnum = ['video', 'audio', 'text'] as const;
export type ContentType = (typeof contentTypeEnum)[number];

// Main content_items table
export const contentItems = pgTable('content_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').$type<ContentType>().notNull(),
  title: text('title').notNull(),
  difficultyLevel: decimal('difficulty_level', { precision: 3, scale: 1 }).notNull(),
  durationSeconds: integer('duration_seconds').notNull(),

  // Video-specific fields
  youtubeId: text('youtube_id'),
  startTime: integer('start_time'),
  endTime: integer('end_time'),

  // Audio-specific fields
  audioUrl: text('audio_url'),

  // Text-specific fields
  textContent: text('text_content'),
  textUrl: text('text_url'),

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

