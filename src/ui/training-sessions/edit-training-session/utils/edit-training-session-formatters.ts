import type { TrainingSession } from "@/domain/training-sessions";
import type { User } from "@/domain/user-types";
import { formatDistance } from "@/ui/shared/running-metric-formatters";
import { formatDuration } from "@/ui/shared/duration-formatters";

export function formatLockedTargets(
  trainingSession: TrainingSession,
  measurementUnit: User["measurementUnit"],
) {
  if (trainingSession.activityType === "STRENGTH") {
    return (
      formatDuration(trainingSession.targetDurationSeconds) ??
      "No target duration"
    );
  }

  return [
    formatDistance(trainingSession.targetDistanceMetres, measurementUnit),
    formatDuration(trainingSession.targetDurationSeconds),
  ]
    .filter((value): value is string => value !== null)
    .join(" · ");
}
