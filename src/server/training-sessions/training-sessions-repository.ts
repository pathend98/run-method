import { asc, between, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { runDetails, strengthDetails, trainingSessions } from "@db/schema";
import {
  timeOfDaySchema,
  trainingSessionSchema,
  trainingSessionStatusSchema,
  type TrainingSession,
} from "@/domain/training-sessions";
import { TrainingSessionsDataIntegrityError } from "./training-sessions-errors";

export interface TrainingSessionsRepository {
  findBetweenDates(from: string, to: string): Promise<TrainingSession[]>;
}

export class DrizzleTrainingSessionsRepository implements TrainingSessionsRepository {
  constructor(private readonly db: NodePgDatabase) {}

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

    return rows.map((row) => mapTrainingSessionRow(row));
  }
}

type TrainingSessionRow = {
  session: typeof trainingSessions.$inferSelect;
  runDetails: typeof runDetails.$inferSelect | null;
  strengthDetails: typeof strengthDetails.$inferSelect | null;
};

function mapTrainingSessionRow(row: TrainingSessionRow): TrainingSession {
  const timeOfDayResult = timeOfDaySchema.safeParse(row.session.timeOfDay);
  const statusResult = trainingSessionStatusSchema.safeParse(
    row.session.status,
  );

  if (!timeOfDayResult.success) {
    throw new TrainingSessionsDataIntegrityError(
      `Training session ${row.session.id} has invalid time of day`,
    );
  }

  if (!statusResult.success) {
    throw new TrainingSessionsDataIntegrityError(
      `Training session ${row.session.id} has invalid status`,
    );
  }

  const base = {
    id: row.session.id,
    title: row.session.title,
    status: statusResult.data,
    date: row.session.date,
    timeOfDay: timeOfDayResult.data,
    description: row.session.description,
    sortOrder: row.session.sortOrder,
    skipReason: row.session.skipReason,
    createdAt: row.session.createdAt.toISOString(),
    updatedAt: row.session.updatedAt.toISOString(),
  };

  if (row.session.activityType === "RUN") {
    if (!row.runDetails) {
      throw new TrainingSessionsDataIntegrityError(
        `Run session ${row.session.id} is missing run details`,
      );
    }

    return parseTrainingSession({
      ...base,
      activityType: "RUN",
      targetType: row.runDetails.targetType,
      targetDistanceMetres: row.runDetails.targetDistanceMetres,
      targetDurationSeconds: row.runDetails.targetDurationSeconds,
      targetPaceSecondsPerKilometre:
        row.runDetails.targetPaceSecondsPerKilometre,
      actualDistanceMetres: row.runDetails.actualDistanceMetres,
      actualDurationSeconds: row.runDetails.actualDurationSeconds,
    });
  }

  if (row.session.activityType === "STRENGTH") {
    if (!row.strengthDetails) {
      throw new TrainingSessionsDataIntegrityError(
        `Strength session ${row.session.id} is missing strength details`,
      );
    }

    return parseTrainingSession({
      ...base,
      activityType: "STRENGTH",
      targetDurationSeconds: row.strengthDetails.targetDurationSeconds,
      actualDurationSeconds: row.strengthDetails.actualDurationSeconds,
    });
  }

  throw new TrainingSessionsDataIntegrityError(
    `Unsupported activity type ${row.session.activityType}`,
  );
}

function parseTrainingSession(session: unknown): TrainingSession {
  const result = trainingSessionSchema.safeParse(session);

  if (!result.success) {
    throw new TrainingSessionsDataIntegrityError(
      "Training session row does not match the domain read model",
    );
  }

  return result.data;
}
