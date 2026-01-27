ALTER TABLE "content_items" ADD COLUMN "transcript" text;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "transcript_source" text;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "transcript_language" text DEFAULT 'ro';