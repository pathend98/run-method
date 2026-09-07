import type {
  TrainingSession,
  TrainingSessionDateRange,
} from "@/domain/training-sessions";

export type WeeklySummary = {
  completedDistanceMetres: number;
  completedDurationSeconds: number;
  isFutureWeek: boolean;
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
  sessions: TrainingSession[],
  weekRange: TrainingSessionDateRange,
  today: string,
): WeeklySummary {
  const isFutureWeek = weekRange.from > today;
  const isPastWeek = weekRange.to < today;
  const activities = {
    completed: 0,
    due: 0,
    scheduled: sessions.length,
    skipped: 0,
    upcoming: 0,
  };
  let completedDistanceMetres = 0;
  let completedDurationSeconds = 0;
  let scheduledDistanceMetres = 0;
  let scheduledDurationSeconds = 0;

  for (const session of sessions) {
    scheduledDurationSeconds += session.targetDurationSeconds ?? 0;

    if (session.activityType === "RUN") {
      scheduledDistanceMetres += session.targetDistanceMetres;
    }

    if (session.status === "COMPLETED") {
      activities.completed += 1;
      completedDurationSeconds += session.actualDurationSeconds ?? 0;

      if (session.activityType === "RUN") {
        completedDistanceMetres += session.actualDistanceMetres ?? 0;
      }
    } else if (session.status === "SKIPPED") {
      activities.skipped += 1;
    } else if (!isFutureWeek) {
      if (isPastWeek || session.date <= today) {
        activities.due += 1;
      } else {
        activities.upcoming += 1;
      }
    }
  }

  return {
    completedDistanceMetres,
    completedDurationSeconds,
    isFutureWeek,
    scheduledDistanceMetres,
    scheduledDurationSeconds,
    activities,
  };
}
