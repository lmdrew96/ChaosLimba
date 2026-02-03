CREATE TABLE "generated_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"content_type" text NOT NULL,
	"trigger" text NOT NULL,
	"romanian_text" text NOT NULL,
	"english_text" text,
	"audio_url" text,
	"audio_character_count" integer,
	"audio_estimated_cost" numeric(8, 6),
	"target_error_type" text,
	"target_category" text,
	"pattern_fingerprint" text,
	"user_level" text,
	"session_id" uuid,
	"voice_gender" text DEFAULT 'female',
	"is_listened" boolean DEFAULT false NOT NULL,
	"listened_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_feature_map" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature_key" text NOT NULL,
	"feature_name" text NOT NULL,
	"cefr_level" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"prerequisites" jsonb DEFAULT '[]'::jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "grammar_feature_map_feature_key_unique" UNIQUE("feature_key")
);
--> statement-breakpoint
CREATE TABLE "reading_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" text NOT NULL,
	"passage" text NOT NULL,
	"question" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_index" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stress_minimal_pairs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"word" text NOT NULL,
	"stress" text NOT NULL,
	"meaning" text NOT NULL,
	"example" text NOT NULL,
	"is_suggested" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suggested_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"category" text,
	"cefr_level" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutor_opening_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"self_assessment_key" text NOT NULL,
	"message" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tutor_opening_messages_self_assessment_key_unique" UNIQUE("self_assessment_key")
);
--> statement-breakpoint
CREATE TABLE "user_feature_exposure" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"feature_key" text NOT NULL,
	"exposure_type" text NOT NULL,
	"content_id" uuid,
	"session_id" uuid,
	"is_correct" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "common_voice_clips" CASCADE;--> statement-breakpoint
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feature_exposure" ADD CONSTRAINT "user_feature_exposure_content_id_content_items_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feature_exposure" ADD CONSTRAINT "user_feature_exposure_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;