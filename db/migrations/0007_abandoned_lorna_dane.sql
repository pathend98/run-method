ALTER TABLE "training_sessions" DROP CONSTRAINT "training_sessions_athlete_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "training_sessions" ALTER COLUMN "athlete_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_athlete_id_user_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;