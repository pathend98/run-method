import type { RunTrainingSession } from "@/domain/training-sessions";
import {
  formatDuration,
  formatPace,
} from "@/ui/training-sessions/training-session-metric-formatters";
import { calculatePaceSecondsPerKilometre } from "../utils/complete-activity-form";

type PlannedRunSummaryProps = { activity: RunTrainingSession };

export function PlannedRunSummary({ activity }: PlannedRunSummaryProps) {
  const duration = formatDuration(activity.targetDurationSeconds);
  return (
    <p className="mt-6 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
      Planned: {(activity.targetDistanceMetres / 1000).toFixed(1)} km · {duration} · {formatPace(calculatePaceSecondsPerKilometre(activity.targetDistanceMetres, activity.targetDurationSeconds))}
    </p>
  );
}
