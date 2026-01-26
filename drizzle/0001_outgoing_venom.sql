CREATE TABLE "common_voice_clips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clip_path" text NOT NULL,
	"sentence" text NOT NULL,
	"sentence_id" text,
	"r2_url" text NOT NULL,
	"duration_ms" integer,
	"age" text,
	"gender" text,
	"accent" text,
	"up_votes" integer DEFAULT 0,
	"down_votes" integer DEFAULT 0,
	"batch_number" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "common_voice_clips_clip_path_unique" UNIQUE("clip_path")
);
--> statement-breakpoint
CREATE TABLE "proficiency_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"overall_score" numeric(3, 1) NOT NULL,
	"listening_score" numeric(3, 1),
	"reading_score" numeric(3, 1),
	"speaking_score" numeric(3, 1),
	"writing_score" numeric(3, 1),
	"period" text DEFAULT 'daily' NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
