ALTER TABLE "training_sessions" ADD COLUMN "status" text DEFAULT 'SCHEDULED' NOT NULL;
--> statement-breakpoint
ALTER TABLE "training_sessions" ADD COLUMN "skip_reason" text;
--> statement-breakpoint
DELETE FROM "training_sessions";
--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_activity_type_valid" CHECK ("training_sessions"."activity_type" in ('RUN', 'STRENGTH'));
--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_status_valid" CHECK ("training_sessions"."status" in ('SCHEDULED', 'COMPLETED', 'SKIPPED'));
--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_skip_reason_valid" CHECK (("training_sessions"."status" = 'SKIPPED' and "training_sessions"."skip_reason" is not null and length(trim("training_sessions"."skip_reason")) > 0) or ("training_sessions"."status" <> 'SKIPPED' and "training_sessions"."skip_reason" is null));
--> statement-breakpoint
CREATE TABLE "run_details" (
	"training_session_id" uuid NOT NULL,
	"target_type" text NOT NULL,
	"target_distance_metres" integer,
	"target_duration_seconds" integer,
	"target_pace_seconds_per_kilometre" integer,
	"actual_distance_metres" integer,
	"actual_duration_seconds" integer,
	CONSTRAINT "run_details_training_session_id_pk" PRIMARY KEY("training_session_id"),
	CONSTRAINT "run_details_training_session_id_training_sessions_id_fk" FOREIGN KEY ("training_session_id") REFERENCES "training_sessions"("id") ON DELETE cascade,
	CONSTRAINT "run_details_target_type_valid" CHECK ("run_details"."target_type" in ('DISTANCE_DURATION', 'DISTANCE_PACE', 'DURATION_PACE')),
	CONSTRAINT "run_details_target_distance_positive" CHECK ("run_details"."target_distance_metres" is null or "run_details"."target_distance_metres" > 0),
	CONSTRAINT "run_details_target_duration_positive" CHECK ("run_details"."target_duration_seconds" is null or "run_details"."target_duration_seconds" > 0),
	CONSTRAINT "run_details_target_pace_positive" CHECK ("run_details"."target_pace_seconds_per_kilometre" is null or "run_details"."target_pace_seconds_per_kilometre" > 0),
	CONSTRAINT "run_details_actual_distance_positive" CHECK ("run_details"."actual_distance_metres" is null or "run_details"."actual_distance_metres" > 0),
	CONSTRAINT "run_details_actual_duration_positive" CHECK ("run_details"."actual_duration_seconds" is null or "run_details"."actual_duration_seconds" > 0),
	CONSTRAINT "run_details_target_shape_valid" CHECK (("run_details"."target_type" = 'DISTANCE_DURATION' and "run_details"."target_distance_metres" is not null and "run_details"."target_duration_seconds" is not null and "run_details"."target_pace_seconds_per_kilometre" is null) or ("run_details"."target_type" = 'DISTANCE_PACE' and "run_details"."target_distance_metres" is not null and "run_details"."target_duration_seconds" is null and "run_details"."target_pace_seconds_per_kilometre" is not null) or ("run_details"."target_type" = 'DURATION_PACE' and "run_details"."target_distance_metres" is null and "run_details"."target_duration_seconds" is not null and "run_details"."target_pace_seconds_per_kilometre" is not null))
);
--> statement-breakpoint
CREATE TABLE "strength_details" (
	"training_session_id" uuid NOT NULL,
	"target_duration_seconds" integer,
	"actual_duration_seconds" integer,
	CONSTRAINT "strength_details_training_session_id_pk" PRIMARY KEY("training_session_id"),
	CONSTRAINT "strength_details_training_session_id_training_sessions_id_fk" FOREIGN KEY ("training_session_id") REFERENCES "training_sessions"("id") ON DELETE cascade,
	CONSTRAINT "strength_details_target_duration_positive" CHECK ("strength_details"."target_duration_seconds" is null or "strength_details"."target_duration_seconds" > 0),
	CONSTRAINT "strength_details_actual_duration_positive" CHECK ("strength_details"."actual_duration_seconds" is null or "strength_details"."actual_duration_seconds" > 0)
);
--> statement-breakpoint
WITH week_start AS (
	SELECT (current_date - ((extract(isodow from current_date)::int - 1) * interval '1 day'))::date AS monday
),
inserted AS (
	INSERT INTO "training_sessions" (
		"title",
		"activity_type",
		"status",
		"date",
		"time_of_day",
		"description",
		"sort_order",
		"skip_reason"
	)
	SELECT seed.title, seed.activity_type, seed.status, week_start.monday + seed.day_offset, seed.time_of_day, seed.description, seed.sort_order, seed.skip_reason
	FROM week_start
	CROSS JOIN (
		VALUES
			('Easy run', 'RUN', 'SCHEDULED', 0, 'AM', 'Conversational aerobic work', 0, NULL),
			('Lower body strength', 'STRENGTH', 'SCHEDULED', 1, 'PM', 'Squat, hinge, and core circuit', 0, NULL),
			('Tempo run', 'RUN', 'COMPLETED', 3, 'AM', 'Controlled threshold session', 0, NULL),
			('Skipped strength', 'STRENGTH', 'SKIPPED', 5, NULL, 'Optional accessory work', 0, 'Travel day')
	) AS seed(title, activity_type, status, day_offset, time_of_day, description, sort_order, skip_reason)
	RETURNING id, title
)
INSERT INTO "run_details" (
	"training_session_id",
	"target_type",
	"target_distance_metres",
	"target_duration_seconds",
	"target_pace_seconds_per_kilometre",
	"actual_distance_metres",
	"actual_duration_seconds"
)
SELECT id, 'DISTANCE_DURATION', 8000, 2700, NULL, NULL, NULL FROM inserted WHERE title = 'Easy run'
UNION ALL
SELECT id, 'DISTANCE_PACE', 6000, NULL, 255, 6100, 1540 FROM inserted WHERE title = 'Tempo run';
--> statement-breakpoint
INSERT INTO "strength_details" (
	"training_session_id",
	"target_duration_seconds",
	"actual_duration_seconds"
)
SELECT id, 2700, NULL::integer FROM "training_sessions" WHERE title = 'Lower body strength'
UNION ALL
SELECT id, 1800, NULL::integer FROM "training_sessions" WHERE title = 'Skipped strength';
