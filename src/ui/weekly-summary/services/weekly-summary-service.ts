import type {
  TrainingSession,
  TrainingSessionDateRange,
} from "@/domain/training-sessions";

export type WeeklySummary = {
  completedDistanceMetres: number;
  completedDurationSeconds: number;
  isFutureWeek: boolean;
  isPastWeek: boolean;
  scheduledDistanceMetres: number;
  scheduledDurationSeconds: number;
  trainingSessions: {
    completed: number;
    due: number;
    scheduled: number;
    skipped: number;
    upcoming: number;
  };
};

export function getWeeklySummary(
  trainingSessions: TrainingSession[],
  weekRange: TrainingSessionDateRange,
  today: string,
): WeeklySummary {
  const isFutureWeek = weekRange.from > today;
  const isPastWeek = weekRange.to < today;
  const summaryTrainingSessions = {
    completed: 0,
    due: 0,
    scheduled: trainingSessions.length,
    skipped: 0,
    upcoming: 0,
  };
  let completedDistanceMetres = 0;
  let completedDurationSeconds = 0;
  let scheduledDistanceMetres = 0;
  let scheduledDurationSeconds = 0;

  for (const trainingSession of trainingSessions) {
    scheduledDurationSeconds += trainingSession.targetDurationSeconds ?? 0;

    if (trainingSession.activityType === "RUN") {
      scheduledDistanceMetres += trainingSession.targetDistanceMetres;
    }

    if (trainingSession.status === "COMPLETED") {
      summaryTrainingSessions.completed += 1;
      completedDurationSeconds += trainingSession.actualDurationSeconds ?? 0;

      if (trainingSession.activityType === "RUN") {
        completedDistanceMetres += trainingSession.actualDistanceMetres ?? 0;
      }
    } else if (trainingSession.status === "SKIPPED") {
      summaryTrainingSessions.skipped += 1;
    } else if (!isFutureWeek) {
      if (isPastWeek || trainingSession.date <= today) {
        summaryTrainingSessions.due += 1;
      } else {
        summaryTrainingSessions.upcoming += 1;
      }
    }
  }

  return {
    completedDistanceMetres,
    completedDurationSeconds,
    isFutureWeek,
    isPastWeek,
    scheduledDistanceMetres,
    scheduledDurationSeconds,
    trainingSessions: summaryTrainingSessions,
  };
}
