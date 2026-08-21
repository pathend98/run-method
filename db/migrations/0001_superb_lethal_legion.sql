CREATE TABLE "training_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"activity_type" text NOT NULL,
	"date" date NOT NULL,
	"time_of_day" text,
	"description" text,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "training_sessions_title_not_empty" CHECK (length(trim("training_sessions"."title")) > 0),
	CONSTRAINT "training_sessions_activity_type_not_empty" CHECK (length(trim("training_sessions"."activity_type")) > 0),
	CONSTRAINT "training_sessions_time_of_day_valid" CHECK ("training_sessions"."time_of_day" is null or "training_sessions"."time_of_day" in ('AM', 'PM')),
	CONSTRAINT "training_sessions_sort_order_non_negative" CHECK ("training_sessions"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE INDEX "training_sessions_date_time_sort_idx" ON "training_sessions" USING btree ("date","time_of_day","sort_order");
--> statement-breakpoint
WITH week_start AS (
	SELECT (current_date - ((extract(isodow from current_date)::int - 1) * interval '1 day'))::date AS monday
)
INSERT INTO "training_sessions" (
	"title",
	"activity_type",
	"date",
	"time_of_day",
	"description",
	"sort_order"
)
SELECT seed.title, seed.activity_type, week_start.monday + seed.day_offset, seed.time_of_day, seed.description, seed.sort_order
FROM week_start
CROSS JOIN (
	VALUES
		('Easy run', 'Run', 0, 'AM', '45 minutes conversational pace', 0),
		('Strides', 'Workout', 0, 'AM', '6 x 20 seconds relaxed and fast', 1),
		('Strength', 'Gym', 1, 'PM', 'Lower body and core', 0),
		('Track intervals', 'Workout', 2, 'AM', '6 x 800m at 10K effort', 0),
		('Mobility', 'Recovery', 3, NULL, 'Hips, calves, and thoracic spine', 0),
		('Easy run', 'Run', 3, 'AM', '35 minutes relaxed', 0),
		('Yoga', 'Recovery', 3, 'PM', 'Gentle flow and breathing', 0),
		('Rest day', 'Rest', 4, NULL, NULL, 0),
		('Long run', 'Run', 5, 'AM', '90 minutes steady on rolling terrain', 0),
		('Recovery spin', 'Cross-training', 6, 'PM', '30 minutes easy bike', 0)
) AS seed(title, activity_type, day_offset, time_of_day, description, sort_order);
