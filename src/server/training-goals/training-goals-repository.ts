import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { trainingGoals, users } from "@db/schema";
import type {
  CreateTrainingGoalRequest,
  TrainingGoal,
} from "@/domain/training-goals";
import type { TrainingGoalsTransformer } from "./training-goals-transformer";

type Transaction = Parameters<Parameters<NodePgDatabase["transaction"]>[0]>[0];
export type CreateTrainingGoalInput = CreateTrainingGoalRequest & {
  athleteId: string;
};

export interface TrainingGoalsStore {
  discard(actorId: string, id: string): Promise<TrainingGoal | null>;
  complete(actorId: string, id: string): Promise<TrainingGoal | null>;
  findById(id: string): Promise<TrainingGoal | null>;
  edit(
    actorId: string,
    id: string,
    fields: CreateTrainingGoalRequest,
  ): Promise<TrainingGoal | null>;
  find(athleteId: string): Promise<TrainingGoal[]>;
  findUnresolved(athleteId: string): Promise<TrainingGoal[]>;
  create(request: CreateTrainingGoalInput): Promise<TrainingGoal>;
}

export interface TrainingGoalsRepository extends TrainingGoalsStore {
  withAthleteLock<T>(
    athleteId: string,
    action: (repository: TrainingGoalsStore) => Promise<T>,
  ): Promise<T>;
}

export class DrizzleTrainingGoalsRepository implements TrainingGoalsRepository {
  constructor(
    private readonly db: NodePgDatabase | Transaction,
    private readonly transformer: TrainingGoalsTransformer,
  ) {}

  async withAthleteLock<T>(
    athleteId: string,
    action: (repository: TrainingGoalsStore) => Promise<T>,
  ): Promise<T> {
    return this.db.transaction(async (tx) => {
      await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, athleteId))
        .for("update");
      return action(new DrizzleTrainingGoalsRepository(tx, this.transformer));
    });
  }

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
    const [row] = await this.db
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
    fields: CreateTrainingGoalRequest,
  ): Promise<TrainingGoal | null> {
    const [row] = await this.db
      .update(trainingGoals)
      .set({
        title: fields.title,
        purpose: fields.purpose,
        trainingIntentions: fields.trainingIntentions,
        startDate: fields.startDate,
        targetDate: fields.targetDate,
      })
      .where(
        and(
          eq(trainingGoals.id, id),
          eq(trainingGoals.athleteId, actorId),
          isNull(trainingGoals.resolution),
        ),
      )
      .returning();
    return row ? this.transformer.transform(row) : null;
  }

  async find(athleteId: string): Promise<TrainingGoal[]> {
    const rows = await this.db
      .select()
      .from(trainingGoals)
      .where(eq(trainingGoals.athleteId, athleteId))
      .orderBy(desc(trainingGoals.createdAt), asc(trainingGoals.id));
    return rows.map((row) => this.transformer.transform(row));
  }

  async findUnresolved(athleteId: string): Promise<TrainingGoal[]> {
    const rows = await this.db
      .select()
      .from(trainingGoals)
      .where(
        and(
          eq(trainingGoals.athleteId, athleteId),
          isNull(trainingGoals.resolution),
        ),
      );
    return rows.map((row) => this.transformer.transform(row));
  }

  async create(request: CreateTrainingGoalInput): Promise<TrainingGoal> {
    const [row] = await this.db
      .insert(trainingGoals)
      .values({
        athleteId: request.athleteId,
        title: request.title,
        purpose: request.purpose,
        trainingIntentions: request.trainingIntentions,
        startDate: request.startDate,
        targetDate: request.targetDate,
      })
      .returning();
    return this.transformer.transform(row);
  }
}
