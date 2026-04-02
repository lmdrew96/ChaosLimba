CREATE TABLE "beautiful_mistakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"full_text" text NOT NULL,
	"note" text NOT NULL,
	"source" text NOT NULL,
	"session_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_narratives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"narrative" text NOT NULL,
	"reflection" text,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"stats" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mystery_items" ADD COLUMN "grammar_info" jsonb;--> statement-breakpoint
ALTER TABLE "mystery_items" ADD COLUMN "related_words" jsonb;--> statement-breakpoint
ALTER TABLE "mystery_items" ADD COLUMN "practice_prompt" text;--> statement-breakpoint
ALTER TABLE "mystery_items" ADD COLUMN "pronunciation" text;--> statement-breakpoint
ALTER TABLE "mystery_items" ADD COLUMN "etymology" text;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "tutorial_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "consent_given_at" timestamp;--> statement-breakpoint
ALTER TABLE "beautiful_mistakes" ADD CONSTRAINT "beautiful_mistakes_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;