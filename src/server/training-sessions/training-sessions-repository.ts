import { and, asc, between, eq, isNull, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { runDetails, strengthDetails, trainingSessions } from "@db/schema";
import type {
  CreateTrainingSessionRequest,
  TrainingSession,
} from "@/domain/training-sessions";
import type { TrainingSessionsTransformer } from "./training-sessions-transformer";

export interface TrainingSessionsRepository {
  findBetweenDates(from: string, to: string): Promise<TrainingSession[]>;
  create(request: CreateTrainingSessionRequest): Promise<TrainingSession>;
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

  async create(
    request: CreateTrainingSessionRequest,
  ): Promise<TrainingSession> {
    return this.db.transaction(async (tx) => {
      const bucket = [
        eq(trainingSessions.date, request.date),
        request.timeOfDay === null
          ? isNull(trainingSessions.timeOfDay)
          : eq(trainingSessions.timeOfDay, request.timeOfDay),
      ];
      const [{ nextOrder }] = await tx
        .select({
          nextOrder: sql<number>`coalesce(max(${trainingSessions.sortOrder}), -1) + 1`,
        })
        .from(trainingSessions)
        .where(and(...bucket));
      const [session] = await tx
        .insert(trainingSessions)
        .values({
          title: request.title,
          activityType: request.activityType,
          date: request.date,
          timeOfDay: request.timeOfDay,
          description: request.description,
          sortOrder: Number(nextOrder),
        })
        .returning();

      let runDetailsRow: typeof runDetails.$inferSelect | null = null;
      let strengthDetailsRow: typeof strengthDetails.$inferSelect | null = null;
      if (request.activityType === "RUN") {
        const targetDistanceMetres =
          "targetDistanceMetres" in request
            ? request.targetDistanceMetres
            : null;
        const targetDurationSeconds =
          "targetDurationSeconds" in request
            ? request.targetDurationSeconds
            : null;
        const targetPaceSecondsPerKilometre =
          "targetPaceSecondsPerKilometre" in request
            ? request.targetPaceSecondsPerKilometre
            : null;
        [runDetailsRow] = await tx
          .insert(runDetails)
          .values({
            trainingSessionId: session.id,
            targetType: request.targetType,
            targetDistanceMetres,
            targetDurationSeconds,
            targetPaceSecondsPerKilometre,
            actualDistanceMetres: null,
            actualDurationSeconds: null,
          })
          .returning();
      } else {
        [strengthDetailsRow] = await tx
          .insert(strengthDetails)
          .values({
            trainingSessionId: session.id,
            targetDurationSeconds: request.targetDurationSeconds,
            actualDurationSeconds: null,
          })
          .returning();
      }
      return this.transformer.transform({
        session,
        runDetails: runDetailsRow,
        strengthDetails: strengthDetailsRow,
      });
    });
  }
}
