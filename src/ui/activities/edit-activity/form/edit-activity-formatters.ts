import type { TrainingSession } from "@/domain/training-sessions";
import type { User } from "@/domain/user-types";
import {
  formatDistance,
  formatDuration,
} from "@/ui/activities/formatters/training-session-metric-formatters";

export function formatLockedTargets(
  activity: TrainingSession,
  measurementUnit: User["measurementUnit"],
) {
  if (activity.activityType === "STRENGTH") {
    return (
      formatDuration(activity.targetDurationSeconds) ?? "No target duration"
    );
  }

  return [
    formatDistance(activity.targetDistanceMetres, measurementUnit),
    formatDuration(activity.targetDurationSeconds),
  ]
    .filter((value): value is string => value !== null)
    .join(" · ");
}
