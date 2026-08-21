import { asc, between, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { runDetails, strengthDetails, trainingSessions } from "@db/schema";
import type { TrainingSession } from "@/domain/training-sessions";
import type { TrainingSessionsTransformer } from "./training-sessions-transformer";

export interface TrainingSessionsRepository {
  findBetweenDates(from: string, to: string): Promise<TrainingSession[]>;
}

export class DrizzleTrainingSessionsRepository implements TrainingSessionsRepository {
  constructor(
    private readonly db: NodePgDatabase,
    private readonly transformer: TrainingSessionsTransformer,
  ) {}

  async findBetweenDates(from: string, to: string): Promise<TrainingSession[]> {
    const rows = await this.db
      .select({
        session: trainingSessions,
        runDetails,
        strengthDetails,
      })
      .from(trainingSessions)
      .leftJoin(
        runDetails,
        eq(runDetails.trainingSessionId, trainingSessions.id),
      )
      .leftJoin(
        strengthDetails,
        eq(strengthDetails.trainingSessionId, trainingSessions.id),
      )
      .where(between(trainingSessions.date, from, to))
      .orderBy(
        asc(trainingSessions.date),
        sql`case ${trainingSessions.timeOfDay} when 'AM' then 0 when 'PM' then 2 else 1 end`,
        asc(trainingSessions.sortOrder),
        asc(trainingSessions.id),
      );

    return rows.map((row) => this.transformer.transform(row));
  }
}
