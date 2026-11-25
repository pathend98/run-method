-- Existing goals are intentionally discarded when moving to training periods.
DELETE FROM "training_goals";--> statement-breakpoint
DROP INDEX "training_goals_active_athlete_idx";--> statement-breakpoint
ALTER TABLE "training_goals" ALTER COLUMN "target_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "training_goals" ADD COLUMN "purpose" text NOT NULL;--> statement-breakpoint
ALTER TABLE "training_goals" ADD COLUMN "training_intentions" text NOT NULL;--> statement-breakpoint
ALTER TABLE "training_goals" ADD COLUMN "start_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "training_goals" ADD COLUMN "resolution" text;--> statement-breakpoint
ALTER TABLE "training_goals" ADD COLUMN "resolved_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "training_goals_athlete_dates_idx" ON "training_goals" USING btree ("athlete_id","start_date","target_date");--> statement-breakpoint
ALTER TABLE "training_goals" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "training_goals" DROP COLUMN "target_distance_metres";--> statement-breakpoint
ALTER TABLE "training_goals" DROP COLUMN "target_time_seconds";--> statement-breakpoint
ALTER TABLE "training_goals" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "training_goals" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "training_goals" ADD CONSTRAINT "training_goals_title_not_empty" CHECK (length(trim("training_goals"."title")) > 0);--> statement-breakpoint
ALTER TABLE "training_goals" ADD CONSTRAINT "training_goals_purpose_not_empty" CHECK (length(trim("training_goals"."purpose")) > 0);--> statement-breakpoint
ALTER TABLE "training_goals" ADD CONSTRAINT "training_goals_intentions_not_empty" CHECK (length(trim("training_goals"."training_intentions")) > 0);--> statement-breakpoint
ALTER TABLE "training_goals" ADD CONSTRAINT "training_goals_dates_valid" CHECK ("training_goals"."start_date" <= "training_goals"."target_date");--> statement-breakpoint
ALTER TABLE "training_goals" ADD CONSTRAINT "training_goals_resolution_valid" CHECK ("training_goals"."resolution" is null or "training_goals"."resolution" in ('completed', 'discarded'));--> statement-breakpoint
ALTER TABLE "training_goals" ADD CONSTRAINT "training_goals_resolved_at_valid" CHECK (("training_goals"."resolution" is null) = ("training_goals"."resolved_at" is null));