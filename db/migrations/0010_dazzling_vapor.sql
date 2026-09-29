ALTER TABLE "user" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "measurement_unit" text DEFAULT 'KILOMETRES' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_first_name_valid" CHECK ("user"."first_name" is null or (length(trim("user"."first_name")) > 0 and length("user"."first_name") <= 100));--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_measurement_unit_valid" CHECK ("user"."measurement_unit" in ('KILOMETRES', 'MILES'));