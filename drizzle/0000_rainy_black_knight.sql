CREATE TABLE "content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"difficulty_level" numeric(3, 1) NOT NULL,
	"duration_seconds" integer NOT NULL,
	"youtube_id" text,
	"start_time" integer,
	"end_time" integer,
	"audio_url" text,
	"text_content" text,
	"text_url" text,
	"language_features" jsonb,
	"topic" text NOT NULL,
	"source_attribution" jsonb NOT NULL,
	"cultural_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "error_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"error_type" text NOT NULL,
	"category" text,
	"context" text,
	"correction" text,
	"source" text NOT NULL,
	"modality" text DEFAULT 'text',
	"content_id" uuid,
	"session_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mystery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"word" text NOT NULL,
	"context" text,
	"definition" text,
	"examples" jsonb,
	"is_explored" boolean DEFAULT false NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"session_type" text NOT NULL,
	"content_id" uuid,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration_seconds" integer
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"language_level" text DEFAULT 'A1' NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"default_chaos_window_duration" integer DEFAULT 300 NOT NULL,
	"email_notifications" boolean DEFAULT false NOT NULL,
	"analytics_enabled" boolean DEFAULT false NOT NULL,
	"data_collection_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_content_id_content_items_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_content_id_content_items_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;