import { and, asc, desc, eq, isNull, lte, gte, ne, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { trainingGoals, users } from "@db/schema";
import {
  createTrainingGoalRequestSchema,
  type CreateTrainingGoalRequest,
  type EditTrainingGoalRequest,
  type TrainingGoal,
} from "@/domain/training-goals";
import { RequestValidationError } from "@/server/errors/request-validation-error";
import { TrainingGoalOverlapError } from "./training-goals-errors";
import type { TrainingGoalsTransformer } from "./training-goals-transformer";

type Transaction = Parameters<Parameters<NodePgDatabase["transaction"]>[0]>[0];
export type CreateTrainingGoalInput = CreateTrainingGoalRequest & {
  athleteId: string;
};

export interface TrainingGoalsRepository {
  discard(actorId: string, id: string): Promise<TrainingGoal | null>;
  complete(actorId: string, id: string): Promise<TrainingGoal | null>;
  findById(id: string): Promise<TrainingGoal | null>;
  edit(
    actorId: string,
    id: string,
    request: EditTrainingGoalRequest,
  ): Promise<TrainingGoal | null>;
  find(athleteId: string): Promise<TrainingGoal[]>;
  create(request: CreateTrainingGoalInput): Promise<TrainingGoal>;
}

export class DrizzleTrainingGoalsRepository implements TrainingGoalsRepository {
  constructor(
    private readonly db: NodePgDatabase,
    private readonly transformer: TrainingGoalsTransformer,
  ) {}

  discard(actorId: string, id: string): Promise<TrainingGoal | null> {
    return this.resolve(actorId, id, "discarded");
  }

  complete(actorId: string, id: string): Promise<TrainingGoal | null> {
    return this.resolve(actorId, id, "completed");
  }

  private async resolve(
    actorId: string,
    id: string,
    resolution: "completed" | "discarded",
  ): Promise<TrainingGoal | null> {
    return this.db.transaction(async (tx) => {
      await this.lockAthlete(tx, actorId);
      const [row] = await tx
        .update(trainingGoals)
        .set({ resolution, resolvedAt: sql`now()` })
        .where(
          and(
            eq(trainingGoals.id, id),
            eq(trainingGoals.athleteId, actorId),
            isNull(trainingGoals.resolution),
          ),
        )
        .returning();
      return row ? this.transformer.transform(row) : null;
    });
  }

  async findById(id: string): Promise<TrainingGoal | null> {
    const [row] = await this.db
      .select()
      .from(trainingGoals)
      .where(eq(trainingGoals.id, id))
      .limit(1);
    return row ? this.transformer.transform(row) : null;
  }

  async edit(
    actorId: string,
    id: string,
    request: EditTrainingGoalRequest,
  ): Promise<TrainingGoal | null> {
    return this.db.transaction(async (tx) => {
      await this.lockAthlete(tx, actorId);
      const [current] = await tx
        .select()
        .from(trainingGoals)
        .where(
          and(
            eq(trainingGoals.id, id),
            eq(trainingGoals.athleteId, actorId),
            isNull(trainingGoals.resolution),
          ),
        )
        .limit(1);
      if (!current) return null;
      const fields = this.validate({
        title: request.title ?? current.title,
        purpose: request.purpose ?? current.purpose,
        trainingIntentions:
          request.trainingIntentions ?? current.trainingIntentions,
        startDate: request.startDate ?? current.startDate,
        targetDate: request.targetDate ?? current.targetDate,
      });
      if (
        fields.startDate !== current.startDate ||
        fields.targetDate !== current.targetDate
      ) {
        await this.checkOverlap(tx, actorId, fields, id);
      }
      const [row] = await tx
        .update(trainingGoals)
        .set(fields)
        .where(
          and(
            eq(trainingGoals.id, id),
            eq(trainingGoals.athleteId, actorId),
            isNull(trainingGoals.resolution),
          ),
        )
        .returning();
      return row ? this.transformer.transform(row) : null;
    });
  }

  async find(athleteId: string): Promise<TrainingGoal[]> {
    const rows = await this.db
      .select()
      .from(trainingGoals)
      .where(eq(trainingGoals.athleteId, athleteId))
      .orderBy(desc(trainingGoals.createdAt), asc(trainingGoals.id));
    return rows.map((row) => this.transformer.transform(row));
  }

  async create(request: CreateTrainingGoalInput): Promise<TrainingGoal> {
    const { athleteId, ...input } = request;
    const fields = this.validate(input);
    return this.db.transaction(async (tx) => {
      await this.lockAthlete(tx, athleteId);
      await this.checkOverlap(tx, athleteId, fields);
      const [row] = await tx
        .insert(trainingGoals)
        .values({ ...fields, athleteId })
        .returning();
      return this.transformer.transform(row);
    });
  }

  private validate(
    input: CreateTrainingGoalRequest,
  ): CreateTrainingGoalRequest {
    const result = createTrainingGoalRequestSchema.safeParse(input);
    if (!result.success) {
      throw new RequestValidationError(result.error.flatten().fieldErrors);
    }
    return result.data;
  }

  private async lockAthlete(tx: Transaction, athleteId: string): Promise<void> {
    // Every goal mutation takes this lock before reading or writing goal state.
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, athleteId))
      .for("update");
  }

  private async checkOverlap(
    tx: Transaction,
    athleteId: string,
    period: CreateTrainingGoalRequest,
    excludedId?: string,
  ): Promise<void> {
    const [overlap] = await tx
      .select({ id: trainingGoals.id })
      .from(trainingGoals)
      .where(
        and(
          eq(trainingGoals.athleteId, athleteId),
          isNull(trainingGoals.resolution),
          lte(trainingGoals.startDate, period.targetDate),
          gte(trainingGoals.targetDate, period.startDate),
          excludedId === undefined
            ? undefined
            : ne(trainingGoals.id, excludedId),
        ),
      )
      .limit(1);
    if (overlap) throw new TrainingGoalOverlapError();
  }
}
