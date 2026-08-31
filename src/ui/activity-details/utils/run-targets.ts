import type { RunTrainingSession } from "@/domain/training-sessions";

function calculatePaceSecondsPerKilometre(
  distanceMetres: number | null,
  durationSeconds: number | null,
) {
  if (
    distanceMetres === null ||
    distanceMetres <= 0 ||
    durationSeconds === null
  ) {
    return null;
  }

  return Math.round((durationSeconds * 1000) / distanceMetres);
}

function calculateDurationSeconds(
  distanceMetres: number | null,
  paceSecondsPerKilometre: number | null,
) {
  if (distanceMetres === null || paceSecondsPerKilometre === null) {
    return null;
  }

  return Math.round((distanceMetres * paceSecondsPerKilometre) / 1000);
}

function calculateDistanceMetres(
  durationSeconds: number | null,
  paceSecondsPerKilometre: number | null,
) {
  if (
    durationSeconds === null ||
    paceSecondsPerKilometre === null ||
    paceSecondsPerKilometre <= 0
  ) {
    return null;
  }

  return Math.round((durationSeconds * 1000) / paceSecondsPerKilometre);
}

export function resolveRunTargets(activity: RunTrainingSession) {
  const distanceMetres = activity.targetDistanceMetres;
  const durationSeconds = activity.targetDurationSeconds;
  const paceSecondsPerKilometre = activity.targetPaceSecondsPerKilometre;

  return {
    distanceMetres:
      distanceMetres ??
      calculateDistanceMetres(durationSeconds, paceSecondsPerKilometre),
    durationSeconds:
      durationSeconds ??
      calculateDurationSeconds(distanceMetres, paceSecondsPerKilometre),
    paceSecondsPerKilometre:
      paceSecondsPerKilometre ??
      calculatePaceSecondsPerKilometre(distanceMetres, durationSeconds),
  };
}
