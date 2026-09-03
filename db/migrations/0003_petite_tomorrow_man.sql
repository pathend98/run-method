ALTER TABLE "run_details" DROP CONSTRAINT "run_details_target_type_valid";--> statement-breakpoint
ALTER TABLE "run_details" DROP CONSTRAINT "run_details_target_pace_positive";--> statement-breakpoint
ALTER TABLE "run_details" DROP CONSTRAINT "run_details_target_shape_valid";--> statement-breakpoint
ALTER TABLE "run_details" DROP CONSTRAINT "run_details_target_distance_positive";--> statement-breakpoint
ALTER TABLE "run_details" DROP CONSTRAINT "run_details_target_duration_positive";--> statement-breakpoint
UPDATE "run_details"
SET "target_duration_seconds" = greatest(
	1,
	round(("target_distance_metres"::numeric * "target_pace_seconds_per_kilometre") / 1000)::integer
)
WHERE "target_duration_seconds" IS NULL;--> statement-breakpoint
UPDATE "run_details"
SET "target_distance_metres" = greatest(
	1,
	round(("target_duration_seconds"::numeric * 1000) / "target_pace_seconds_per_kilometre")::integer
)
WHERE "target_distance_metres" IS NULL;--> statement-breakpoint
ALTER TABLE "run_details" ALTER COLUMN "target_distance_metres" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "run_details" ALTER COLUMN "target_duration_seconds" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "run_details" DROP COLUMN "target_type";--> statement-breakpoint
ALTER TABLE "run_details" DROP COLUMN "target_pace_seconds_per_kilometre";--> statement-breakpoint
ALTER TABLE "run_details" ADD CONSTRAINT "run_details_target_distance_positive" CHECK ("run_details"."target_distance_metres" > 0);--> statement-breakpoint
ALTER TABLE "run_details" ADD CONSTRAINT "run_details_target_duration_positive" CHECK ("run_details"."target_duration_seconds" > 0);
