-- Migration: Add user_preferences table
-- Date: 2026-01-24
-- Purpose: Store user settings and preferences for ChaosLimbă

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY NOT NULL,
  language_level TEXT DEFAULT 'A1' NOT NULL,
  default_chaos_window_duration INTEGER DEFAULT 300 NOT NULL,
  email_notifications BOOLEAN DEFAULT FALSE NOT NULL,
  analytics_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  data_collection_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add check constraint for language level
ALTER TABLE user_preferences
ADD CONSTRAINT user_preferences_language_level_check
CHECK (language_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));

-- Add check constraint for chaos window duration (5-10 minutes)
ALTER TABLE user_preferences
ADD CONSTRAINT user_preferences_duration_check
CHECK (default_chaos_window_duration >= 300 AND default_chaos_window_duration <= 600);

-- Add comments
COMMENT ON TABLE user_preferences IS 'User settings and preferences';
COMMENT ON COLUMN user_preferences.language_level IS 'CEFR level (calculated by proficiency test)';
COMMENT ON COLUMN user_preferences.default_chaos_window_duration IS 'Default duration in seconds (5-10 mins)';
COMMENT ON COLUMN user_preferences.email_notifications IS 'Opt-in for weekly learning summaries';
COMMENT ON COLUMN user_preferences.analytics_enabled IS 'Opt-in for anonymous usage tracking';
COMMENT ON COLUMN user_preferences.data_collection_enabled IS 'Allow error patterns for research';

-- Create index on user_id for faster lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
