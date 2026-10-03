import { asc, desc, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { trainingGoals } from "@db/schema";
import type {
  CreateTrainingGoalRequest,
  TrainingGoal,
} from "@/domain/training-goals";

import { ActiveTrainingGoalAlreadyExistsError } from "./training-goals-errors";
import type { TrainingGoalsTransformer } from "./training-goals-transformer";

export type CreateTrainingGoalInput = CreateTrainingGoalRequest & {
  athleteId: string;
};

export interface TrainingGoalsRepository {
  find(athleteId: string): Promise<TrainingGoal[]>;
  create(request: CreateTrainingGoalInput): Promise<TrainingGoal>;
}

export class DrizzleTrainingGoalsRepository implements TrainingGoalsRepository {
  constructor(
    private readonly db: NodePgDatabase,
    private readonly transformer: TrainingGoalsTransformer,
  ) {}

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
