import type { RunTrainingSession } from "@/domain/training-sessions";

function calculatePaceSecondsPerKilometre(
  distanceMetres: number,
  durationSeconds: number,
) {
  return Math.round((durationSeconds * 1000) / distanceMetres);
}

export function resolveRunTargets(activity: RunTrainingSession) {
  return {
    distanceMetres: activity.targetDistanceMetres,
    durationSeconds: activity.targetDurationSeconds,
    paceSecondsPerKilometre: calculatePaceSecondsPerKilometre(
      activity.targetDistanceMetres,
      activity.targetDurationSeconds,
    ),
  };
}
