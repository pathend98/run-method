CREATE TABLE "training_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"target_distance_metres" integer,
	"target_date" date,
	"target_time_seconds" integer,
	"description" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "training_goals" ADD CONSTRAINT "training_goals_athlete_id_user_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;