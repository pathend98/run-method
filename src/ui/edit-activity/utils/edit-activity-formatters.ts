import type { TrainingSession } from "@/domain/training-sessions";
import {
  formatDistance,
  formatDuration,
} from "@/ui/training-sessions/training-session-metric-formatters";

export function formatLockedTargets(activity: TrainingSession) {
  if (activity.activityType === "STRENGTH") {
    return (
      formatDuration(activity.targetDurationSeconds) ?? "No target duration"
    );
  }

  return [
    formatDistance(activity.targetDistanceMetres),
    formatDuration(activity.targetDurationSeconds),
  ]
    .filter((value): value is string => value !== null)
    .join(" · ");
}
