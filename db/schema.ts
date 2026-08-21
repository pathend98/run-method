import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  primaryKey,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const trainingSessions = pgTable(
  "training_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    activityType: text("activity_type").notNull(),
    status: text("status").notNull().default("SCHEDULED"),
    date: date("date").notNull(),
    timeOfDay: text("time_of_day"),
    description: text("description"),
    sortOrder: integer("sort_order").notNull(),
    skipReason: text("skip_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "training_sessions_title_not_empty",
      sql`length(trim(${table.title})) > 0`,
    ),
    check(
      "training_sessions_activity_type_valid",
      sql`${table.activityType} in ('RUN', 'STRENGTH')`,
    ),
    check(
      "training_sessions_status_valid",
      sql`${table.status} in ('SCHEDULED', 'COMPLETED', 'SKIPPED')`,
    ),
    check(
      "training_sessions_time_of_day_valid",
      sql`${table.timeOfDay} is null or ${table.timeOfDay} in ('AM', 'PM')`,
    ),
    check(
      "training_sessions_sort_order_non_negative",
      sql`${table.sortOrder} >= 0`,
    ),
    check(
      "training_sessions_skip_reason_valid",
      sql`(${table.status} = 'SKIPPED' and ${table.skipReason} is not null and length(trim(${table.skipReason})) > 0) or (${table.status} <> 'SKIPPED' and ${table.skipReason} is null)`,
    ),
    index("training_sessions_date_time_sort_idx").on(
      table.date,
      table.timeOfDay,
      table.sortOrder,
    ),
  ],
);

export const runDetails = pgTable(
  "run_details",
  {
    trainingSessionId: uuid("training_session_id")
      .notNull()
      .references(() => trainingSessions.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull(),
    targetDistanceMetres: integer("target_distance_metres"),
    targetDurationSeconds: integer("target_duration_seconds"),
    targetPaceSecondsPerKilometre: integer("target_pace_seconds_per_kilometre"),
    actualDistanceMetres: integer("actual_distance_metres"),
    actualDurationSeconds: integer("actual_duration_seconds"),
  },
  (table) => [
    primaryKey({ columns: [table.trainingSessionId] }),
    check(
      "run_details_target_type_valid",
      sql`${table.targetType} in ('DISTANCE_DURATION', 'DISTANCE_PACE', 'DURATION_PACE')`,
    ),
    check(
      "run_details_target_distance_positive",
      sql`${table.targetDistanceMetres} is null or ${table.targetDistanceMetres} > 0`,
    ),
    check(
      "run_details_target_duration_positive",
      sql`${table.targetDurationSeconds} is null or ${table.targetDurationSeconds} > 0`,
    ),
    check(
      "run_details_target_pace_positive",
      sql`${table.targetPaceSecondsPerKilometre} is null or ${table.targetPaceSecondsPerKilometre} > 0`,
    ),
    check(
      "run_details_actual_distance_positive",
      sql`${table.actualDistanceMetres} is null or ${table.actualDistanceMetres} > 0`,
    ),
    check(
      "run_details_actual_duration_positive",
      sql`${table.actualDurationSeconds} is null or ${table.actualDurationSeconds} > 0`,
    ),
    check(
      "run_details_target_shape_valid",
      sql`(${table.targetType} = 'DISTANCE_DURATION' and ${table.targetDistanceMetres} is not null and ${table.targetDurationSeconds} is not null and ${table.targetPaceSecondsPerKilometre} is null) or (${table.targetType} = 'DISTANCE_PACE' and ${table.targetDistanceMetres} is not null and ${table.targetDurationSeconds} is null and ${table.targetPaceSecondsPerKilometre} is not null) or (${table.targetType} = 'DURATION_PACE' and ${table.targetDistanceMetres} is null and ${table.targetDurationSeconds} is not null and ${table.targetPaceSecondsPerKilometre} is not null)`,
    ),
  ],
);

export const strengthDetails = pgTable(
  "strength_details",
  {
    trainingSessionId: uuid("training_session_id")
      .notNull()
      .references(() => trainingSessions.id, { onDelete: "cascade" }),
    targetDurationSeconds: integer("target_duration_seconds"),
    actualDurationSeconds: integer("actual_duration_seconds"),
  },
  (table) => [
    primaryKey({ columns: [table.trainingSessionId] }),
    check(
      "strength_details_target_duration_positive",
      sql`${table.targetDurationSeconds} is null or ${table.targetDurationSeconds} > 0`,
    ),
    check(
      "strength_details_actual_duration_positive",
      sql`${table.actualDurationSeconds} is null or ${table.actualDurationSeconds} > 0`,
    ),
  ],
);
