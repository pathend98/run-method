import type { RunTrainingSession } from "@/domain/training-sessions";
import { RunningMetrics } from "@/domain/running-metrics";
import {
  formatDistance,
  formatPace,
} from "@/ui/shared/running-metric-formatters";
import { formatDuration } from "@/ui/shared/duration-formatters";
import { useDistanceDisplayUnit } from "@/ui/users/measurement-unit-context";

type PlannedRunSummaryProps = { trainingSession: RunTrainingSession };

export function PlannedRunSummary({ trainingSession }: PlannedRunSummaryProps) {
  const measurementUnit = useDistanceDisplayUnit();
  const duration = formatDuration(trainingSession.targetDurationSeconds);
  return (
    <p className="mt-6 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
      Planned:{" "}
      {formatDistance(trainingSession.targetDistanceMetres, measurementUnit, {
        decimalPlaces: 1,
      })}{" "}
      · {duration} ·{" "}
      {formatPace(
        new RunningMetrics(measurementUnit).paceForRun(
          trainingSession.targetDistanceMetres,
          trainingSession.targetDurationSeconds,
        ),
        measurementUnit,
      )}
    </p>
  );
}
