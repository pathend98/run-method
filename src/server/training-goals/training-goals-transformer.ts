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
      purpose: row.purpose,
      trainingIntentions: row.trainingIntentions,
      startDate: row.startDate,
      targetDate: row.targetDate,
      resolution: row.resolution,
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
