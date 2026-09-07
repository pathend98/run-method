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
  activities: {
    completed: number;
    due: number;
    scheduled: number;
    skipped: number;
    upcoming: number;
  };
};

export function getWeeklySummary(
  activities: TrainingSession[],
  weekRange: TrainingSessionDateRange,
  today: string,
): WeeklySummary {
  const isFutureWeek = weekRange.from > today;
  const isPastWeek = weekRange.to < today;
  const summaryActivities = {
    completed: 0,
    due: 0,
    scheduled: activities.length,
    skipped: 0,
    upcoming: 0,
  };
  let completedDistanceMetres = 0;
  let completedDurationSeconds = 0;
  let scheduledDistanceMetres = 0;
  let scheduledDurationSeconds = 0;

  for (const activity of activities) {
    scheduledDurationSeconds += activity.targetDurationSeconds ?? 0;

    if (activity.activityType === "RUN") {
      scheduledDistanceMetres += activity.targetDistanceMetres;
    }

    if (activity.status === "COMPLETED") {
      summaryActivities.completed += 1;
      completedDurationSeconds += activity.actualDurationSeconds ?? 0;

      if (activity.activityType === "RUN") {
        completedDistanceMetres += activity.actualDistanceMetres ?? 0;
      }
    } else if (activity.status === "SKIPPED") {
      summaryActivities.skipped += 1;
    } else if (!isFutureWeek) {
      if (isPastWeek || activity.date <= today) {
        summaryActivities.due += 1;
      } else {
        summaryActivities.upcoming += 1;
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
    activities: summaryActivities,
  };
}
