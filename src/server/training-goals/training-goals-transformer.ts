import type { trainingGoals } from "@db/schema";
import type { TrainingGoal } from "@/domain/training-goals";

export interface TrainingGoalsTransformer {
  transform(row: typeof trainingGoals.$inferSelect): TrainingGoal;
}

export class DefaultTrainingGoalsTransformer implements TrainingGoalsTransformer {
  transform(row: typeof trainingGoals.$inferSelect): TrainingGoal {
    return {
      id: row.id,
      athleteId: row.athleteId,
      title: row.title,
      type: row.type,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      ...(row.targetDistanceMetres === null
        ? {}
        : { targetDistanceMetres: row.targetDistanceMetres }),
      ...(row.targetDate === null ? {} : { targetDate: row.targetDate }),
      ...(row.targetTimeSeconds === null
        ? {}
        : { targetTimeSeconds: row.targetTimeSeconds }),
      ...(row.description === null ? {} : { description: row.description }),
    };
  }
}
