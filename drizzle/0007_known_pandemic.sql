CREATE TABLE "adaptation_interventions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"pattern_key" text NOT NULL,
	"error_type" text NOT NULL,
	"category" text,
	"tier" integer NOT NULL,
	"source" text NOT NULL,
	"frequency_at_intervention" integer NOT NULL,
	"frequency_after_window" integer,
	"measured_at" timestamp,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
