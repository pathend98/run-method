import type { RunTrainingSession } from "@/domain/training-sessions";

export function resolveRunTargets(activity: RunTrainingSession) {
  let distanceMetres = activity.targetDistanceMetres;
  let durationSeconds = activity.targetDurationSeconds;
  let paceSecondsPerKilometre = activity.targetPaceSecondsPerKilometre;

  if (
    paceSecondsPerKilometre === null &&
    distanceMetres !== null &&
    distanceMetres > 0 &&
    durationSeconds !== null
  ) {
    paceSecondsPerKilometre = Math.round(
      (durationSeconds * 1000) / distanceMetres,
    );
  } else if (
    durationSeconds === null &&
    distanceMetres !== null &&
    paceSecondsPerKilometre !== null
  ) {
    durationSeconds = Math.round(
      (distanceMetres * paceSecondsPerKilometre) / 1000,
    );
  } else if (
    distanceMetres === null &&
    durationSeconds !== null &&
    paceSecondsPerKilometre !== null &&
    paceSecondsPerKilometre > 0
  ) {
    distanceMetres = Math.round(
      (durationSeconds * 1000) / paceSecondsPerKilometre,
    );
  }

  return {
    distanceMetres,
    durationSeconds,
    paceSecondsPerKilometre,
  };
}
