-- Migration: Add modality column to error_logs table
-- Date: 2026-01-23
-- Purpose: Track whether errors came from text or speech mode in Chaos Window

-- Add modality column with default 'text' for existing rows
ALTER TABLE error_logs
ADD COLUMN IF NOT EXISTS modality TEXT DEFAULT 'text';

-- Add check constraint to ensure modality is either 'text' or 'speech'
ALTER TABLE error_logs
ADD CONSTRAINT error_logs_modality_check
CHECK (modality IN ('text', 'speech'));

-- Comment on the column
COMMENT ON COLUMN error_logs.modality IS 'Input modality: text (typed) or speech (audio)';
