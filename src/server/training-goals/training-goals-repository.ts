import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { trainingGoals } from "@db/schema";
import type {
  CreateTrainingGoalRequest,
  EditTrainingGoalRequest,
  TrainingGoal,
} from "@/domain/training-goals";

import { ActiveTrainingGoalAlreadyExistsError } from "./training-goals-errors";
import type { TrainingGoalsTransformer } from "./training-goals-transformer";

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

  async discard(actorId: string, id: string): Promise<TrainingGoal | null> {
    const [row] = await this.db
      .update(trainingGoals)
      .set({ status: "DISCARDED" })
      .where(
        and(
          eq(trainingGoals.id, id),
          eq(trainingGoals.athleteId, actorId),
          eq(trainingGoals.status, "ACTIVE"),
        ),
      )
      .returning();
    return row ? this.transformer.transform(row) : null;
  }

  async complete(actorId: string, id: string): Promise<TrainingGoal | null> {
    const [row] = await this.db
      .update(trainingGoals)
      .set({ status: "COMPLETED" })
      .where(
        and(
          eq(trainingGoals.id, id),
          eq(trainingGoals.athleteId, actorId),
          eq(trainingGoals.status, "ACTIVE"),
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
    request: EditTrainingGoalRequest,
  ): Promise<TrainingGoal | null> {
    const [row] = await this.db
      .update(trainingGoals)
      .set({
        title: request.title,
        description: request.description,
        type: request.type,
        targetDistanceMetres: request.targetDistanceMetres,
        targetTimeSeconds: request.targetTimeSeconds,
        targetDate: request.targetDate,
      })
      .where(
        and(
          eq(trainingGoals.id, id),
          eq(trainingGoals.athleteId, actorId),
          eq(trainingGoals.status, "ACTIVE"),
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

  async create(request: CreateTrainingGoalInput): Promise<TrainingGoal> {
    const [row] = await this.db
      .insert(trainingGoals)
      .values(request)
      .onConflictDoNothing({
        target: trainingGoals.athleteId,
        where: sql`${trainingGoals.status} = 'ACTIVE'`,
      })
      .returning();
    if (!row) throw new ActiveTrainingGoalAlreadyExistsError();
    return this.transformer.transform(row);
  }
}
