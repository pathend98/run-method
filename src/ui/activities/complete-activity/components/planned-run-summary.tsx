import type { RunTrainingSession } from "@/domain/training-sessions";
import { RunningMetrics } from "@/ui/runs/run-metrics";
import {
  formatDistance,
  formatDuration,
  formatPace,
} from "@/ui/activities/formatters/training-session-metric-formatters";
import { useDistanceDisplayUnit } from "@/ui/users/measurement-unit-context";

type PlannedRunSummaryProps = { activity: RunTrainingSession };

export function PlannedRunSummary({ activity }: PlannedRunSummaryProps) {
  const measurementUnit = useDistanceDisplayUnit();
  const duration = formatDuration(activity.targetDurationSeconds);
  return (
    <p className="mt-6 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
      Planned:{" "}
      {formatDistance(activity.targetDistanceMetres, measurementUnit, {
        decimalPlaces: 1,
      })}{" "}
      · {duration} ·{" "}
      {formatPace(
        new RunningMetrics(measurementUnit).paceForRun(
          activity.targetDistanceMetres,
          activity.targetDurationSeconds,
        ),
        measurementUnit,
      )}
    </p>
  );
}
