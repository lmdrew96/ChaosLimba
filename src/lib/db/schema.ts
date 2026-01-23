import { pgTable, uuid, text, timestamp, decimal, integer, jsonb } from 'drizzle-orm/pg-core';

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
