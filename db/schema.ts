import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
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
    date: date("date").notNull(),
    timeOfDay: text("time_of_day"),
    description: text("description"),
    sortOrder: integer("sort_order").notNull(),
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
      "training_sessions_activity_type_not_empty",
      sql`length(trim(${table.activityType})) > 0`,
    ),
    check(
      "training_sessions_time_of_day_valid",
      sql`${table.timeOfDay} is null or ${table.timeOfDay} in ('AM', 'PM')`,
    ),
    check(
      "training_sessions_sort_order_non_negative",
      sql`${table.sortOrder} >= 0`,
    ),
    index("training_sessions_date_time_sort_idx").on(
      table.date,
      table.timeOfDay,
      table.sortOrder,
    ),
  ],
);
