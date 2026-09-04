import type { TrainingSession } from "@/domain/training-sessions";
import {
  formatDistance,
  formatPace,
} from "@/ui/training-sessions/training-session-metric-formatters";

type SkippedActivitySummaryProps = { activity: TrainingSession };

export function SkippedActivitySummary({
  activity,
}: SkippedActivitySummaryProps) {
  if (activity.activityType === "STRENGTH") {
    return activity.targetDurationSeconds === null ? null : (
      <p className="mt-3 text-sm text-zinc-600">
        {formatMinutes(activity.targetDurationSeconds)}
      </p>
    );
  }

  const pace = Math.round(
    (activity.targetDurationSeconds * 1000) / activity.targetDistanceMetres,
  );
  return (
    <p className="mt-3 text-sm text-zinc-600">
      {formatDistance(activity.targetDistanceMetres)} ·{" "}
      {formatMinutes(activity.targetDurationSeconds)} · {formatPace(pace)}
    </p>
  );
}

function formatMinutes(durationSeconds: number) {
  return `${Math.round(durationSeconds / 60)} min`;
}
