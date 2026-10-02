import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { trainingGoals } from "@db/schema";
import type {
  CreateTrainingGoalRequest,
  TrainingGoal,
} from "@/domain/training-goals";

import type { TrainingGoalsTransformer } from "./training-goals-transformer";

export type CreateTrainingGoalInput = CreateTrainingGoalRequest & {
  athleteId: string;
};

export interface TrainingGoalsRepository {
  create(request: CreateTrainingGoalInput): Promise<TrainingGoal>;
}

export class DrizzleTrainingGoalsRepository implements TrainingGoalsRepository {
  constructor(
    private readonly db: NodePgDatabase,
    private readonly transformer: TrainingGoalsTransformer,
  ) {}

  async create(request: CreateTrainingGoalInput): Promise<TrainingGoal> {
    const [row] = await this.db
      .insert(trainingGoals)
      .values(request)
      .returning();
    return this.transformer.transform(row);
  }
}
