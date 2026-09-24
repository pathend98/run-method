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
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
});

export const userIdentities = pgTable(
  "user_identity",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    issuer: text("issuer").notNull(),
    subject: text("subject").notNull(),
    email: text("email").notNull(),
  },
  (table) => [
    uniqueIndex("user_identity_issuer_subject_idx").on(
      table.issuer,
      table.subject,
    ),
  ],
);

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
    targetDistanceMetres: integer("target_distance_metres").notNull(),
    targetDurationSeconds: integer("target_duration_seconds").notNull(),
    actualDistanceMetres: integer("actual_distance_metres"),
    actualDurationSeconds: integer("actual_duration_seconds"),
  },
  (table) => [
    primaryKey({ columns: [table.trainingSessionId] }),
    check(
      "run_details_target_distance_positive",
      sql`${table.targetDistanceMetres} > 0`,
    ),
    check(
      "run_details_target_duration_positive",
      sql`${table.targetDurationSeconds} > 0`,
    ),
    check(
      "run_details_actual_distance_positive",
      sql`${table.actualDistanceMetres} is null or ${table.actualDistanceMetres} > 0`,
    ),
    check(
      "run_details_actual_duration_positive",
      sql`${table.actualDurationSeconds} is null or ${table.actualDurationSeconds} > 0`,
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
