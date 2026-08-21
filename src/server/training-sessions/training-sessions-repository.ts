import { asc, between, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { trainingSessions } from "@db/schema";
import type { TrainingSession } from "@/domain/training-sessions";

export interface TrainingSessionsRepository {
  findBetweenDates(from: string, to: string): Promise<TrainingSession[]>;
}

export class DrizzleTrainingSessionsRepository implements TrainingSessionsRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async findBetweenDates(from: string, to: string): Promise<TrainingSession[]> {
    const rows = await this.db
      .select()
      .from(trainingSessions)
      .where(between(trainingSessions.date, from, to))
      .orderBy(
        asc(trainingSessions.date),
        sql`case ${trainingSessions.timeOfDay} when 'AM' then 0 when 'PM' then 2 else 1 end`,
        asc(trainingSessions.sortOrder),
        asc(trainingSessions.id),
      );

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      activityType: row.activityType,
      date: row.date,
      timeOfDay:
        row.timeOfDay === "AM" || row.timeOfDay === "PM" ? row.timeOfDay : null,
      description: row.description,
      sortOrder: row.sortOrder,
    }));
  }
}
