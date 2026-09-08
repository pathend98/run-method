import { and, asc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { runDetails, strengthDetails, trainingSessions } from "@db/schema";
import type {
  CompleteTrainingSessionRequest,
  CreateTrainingSessionRequest,
  EditTrainingSessionRequest,
  SkipTrainingSessionRequest,
  TrainingSession,
  TrainingSessionsQuery,
} from "@/domain/training-sessions";
import type { TrainingSessionsTransformer } from "./training-sessions-transformer";

export interface TrainingSessionsRepository {
  find(query: TrainingSessionsQuery): Promise<TrainingSession[]>;
  findById(id: string): Promise<TrainingSession | null>;
  create(request: CreateTrainingSessionRequest): Promise<TrainingSession>;
  deleteById(id: string): Promise<boolean>;
  skip(
    current: TrainingSession,
    request: SkipTrainingSessionRequest,
  ): Promise<TrainingSession | null>;
  complete(
    current: TrainingSession,
    request: CompleteTrainingSessionRequest,
  ): Promise<TrainingSession | null>;
  edit(
    current: TrainingSession,
    request: EditTrainingSessionRequest,
  ): Promise<TrainingSession | null>;
}

export class DrizzleTrainingSessionsRepository implements TrainingSessionsRepository {
  constructor(
    private readonly db: NodePgDatabase,
    private readonly transformer: TrainingSessionsTransformer,
  ) {}

  async find(query: TrainingSessionsQuery): Promise<TrainingSession[]> {
    const predicates = [
      ...(query.from !== undefined
        ? [gte(trainingSessions.date, query.from)]
        : []),
      ...(query.to !== undefined
        ? [lte(trainingSessions.date, query.to)]
        : []),
      ...(query.status !== undefined
        ? [eq(trainingSessions.status, query.status)]
        : []),
    ];
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
      .where(predicates.length > 0 ? and(...predicates) : undefined)
      .orderBy(
        asc(trainingSessions.date),
        sql`case ${trainingSessions.timeOfDay} when 'AM' then 0 when 'PM' then 2 else 1 end`,
        asc(trainingSessions.sortOrder),
        asc(trainingSessions.id),
      );

    return rows.map((row) => this.transformer.transform(row));
  }

  async findById(id: string): Promise<TrainingSession | null> {
    const [row] = await this.db
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
      .where(eq(trainingSessions.id, id))
      .limit(1);

    return row ? this.transformer.transform(row) : null;
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
        [runDetailsRow] = await tx
          .insert(runDetails)
          .values({
            trainingSessionId: session.id,
            targetDistanceMetres: request.targetDistanceMetres,
            targetDurationSeconds: request.targetDurationSeconds,
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

  async deleteById(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(trainingSessions)
      .where(eq(trainingSessions.id, id))
      .returning({ id: trainingSessions.id });

    return deleted.length > 0;
  }

  async skip(
    current: TrainingSession,
    request: SkipTrainingSessionRequest,
  ): Promise<TrainingSession | null> {
    const [session] = await this.db
      .update(trainingSessions)
      .set({
        status: "SKIPPED",
        skipReason: request.skipReason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(trainingSessions.id, current.id),
          eq(trainingSessions.status, "SCHEDULED"),
        ),
      )
      .returning();

    if (!session) return null;

    return this.transformer.transform({
      session,
      runDetails:
        current.activityType === "RUN"
          ? {
              trainingSessionId: current.id,
              targetDistanceMetres: current.targetDistanceMetres,
              targetDurationSeconds: current.targetDurationSeconds,
              actualDistanceMetres: null,
              actualDurationSeconds: null,
            }
          : null,
      strengthDetails:
        current.activityType === "STRENGTH"
          ? {
              trainingSessionId: current.id,
              targetDurationSeconds: current.targetDurationSeconds,
              actualDurationSeconds: null,
            }
          : null,
    });
  }

  async complete(
    current: TrainingSession,
    request: CompleteTrainingSessionRequest,
  ): Promise<TrainingSession | null> {
    return this.db.transaction(async (tx) => {
      const [session] = await tx
        .update(trainingSessions)
        .set({
          status: "COMPLETED",
          skipReason: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(trainingSessions.id, current.id),
            eq(trainingSessions.status, "SCHEDULED"),
          ),
        )
        .returning();

      if (!session) return null;

      if (current.activityType === "RUN") {
        const [runDetailsRow] = await tx
          .update(runDetails)
          .set({
            actualDistanceMetres: request.actualDistanceMetres,
            actualDurationSeconds: request.actualDurationSeconds,
          })
          .where(eq(runDetails.trainingSessionId, current.id))
          .returning();

        return this.transformer.transform({
          session,
          runDetails: runDetailsRow,
          strengthDetails: null,
        });
      }

      const [strengthDetailsRow] = await tx
        .update(strengthDetails)
        .set({ actualDurationSeconds: request.actualDurationSeconds })
        .where(eq(strengthDetails.trainingSessionId, current.id))
        .returning();

      return this.transformer.transform({
        session,
        runDetails: null,
        strengthDetails: strengthDetailsRow,
      });
    });
  }

  async edit(
    current: TrainingSession,
    request: EditTrainingSessionRequest,
  ): Promise<TrainingSession | null> {
    return this.db.transaction(async (tx) => {
      const date = request.date ?? current.date;
      const dateChanged = date !== current.date;
      const movedBucket = dateChanged || request.timeOfDay !== current.timeOfDay;
      let sortOrder = current.sortOrder;
      if (movedBucket) {
        const bucket = [
          eq(trainingSessions.date, date),
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
        sortOrder = Number(nextOrder);
      }

      const [session] = await tx
        .update(trainingSessions)
        .set({
          title: request.title,
          ...(dateChanged ? { date } : {}),
          timeOfDay: request.timeOfDay,
          description: request.description,
          sortOrder,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(trainingSessions.id, current.id),
            ...(dateChanged
              ? [eq(trainingSessions.status, "SCHEDULED")]
              : []),
          ),
        )
        .returning();

      if (!session) return null;

      if (current.activityType === "RUN" && request.activityType === "RUN") {
        let runDetailsRow: typeof runDetails.$inferSelect;
        if (current.status === "SCHEDULED") {
          const [updatedRunDetails] = await tx
            .update(runDetails)
            .set({
              targetDistanceMetres: request.targetDistanceMetres,
              targetDurationSeconds: request.targetDurationSeconds,
            })
            .where(eq(runDetails.trainingSessionId, current.id))
            .returning();
          runDetailsRow = updatedRunDetails;
        } else {
          if (
            request.actualDistanceMetres !== undefined ||
            request.actualDurationSeconds !== undefined
          ) {
            const [updatedRunDetails] = await tx
              .update(runDetails)
              .set({
                ...(request.actualDistanceMetres !== undefined
                  ? { actualDistanceMetres: request.actualDistanceMetres }
                  : {}),
                ...(request.actualDurationSeconds !== undefined
                  ? { actualDurationSeconds: request.actualDurationSeconds }
                  : {}),
              })
              .where(eq(runDetails.trainingSessionId, current.id))
              .returning();
            runDetailsRow = updatedRunDetails;
          } else {
            runDetailsRow = {
              trainingSessionId: current.id,
              targetDistanceMetres: current.targetDistanceMetres,
              targetDurationSeconds: current.targetDurationSeconds,
              actualDistanceMetres: current.actualDistanceMetres,
              actualDurationSeconds: current.actualDurationSeconds,
            };
          }
        }

        return this.transformer.transform({
          session,
          runDetails: runDetailsRow,
          strengthDetails: null,
        });
      }

      if (
        current.activityType === "STRENGTH" &&
        request.activityType === "STRENGTH"
      ) {
        let strengthDetailsRow: typeof strengthDetails.$inferSelect;
        if (current.status === "SCHEDULED") {
          const [updatedStrengthDetails] = await tx
            .update(strengthDetails)
            .set({
              targetDurationSeconds: request.targetDurationSeconds,
            })
            .where(eq(strengthDetails.trainingSessionId, current.id))
            .returning();
          strengthDetailsRow = updatedStrengthDetails;
        } else {
          if (request.actualDurationSeconds !== undefined) {
            const [updatedStrengthDetails] = await tx
              .update(strengthDetails)
              .set({ actualDurationSeconds: request.actualDurationSeconds })
              .where(eq(strengthDetails.trainingSessionId, current.id))
              .returning();
            strengthDetailsRow = updatedStrengthDetails;
          } else {
            strengthDetailsRow = {
              trainingSessionId: current.id,
              targetDurationSeconds: current.targetDurationSeconds,
              actualDurationSeconds: current.actualDurationSeconds,
            };
          }
        }

        return this.transformer.transform({
          session,
          runDetails: null,
          strengthDetails: strengthDetailsRow,
        });
      }

      throw new Error("Training session activity type changed during edit");
    });
  }
}
