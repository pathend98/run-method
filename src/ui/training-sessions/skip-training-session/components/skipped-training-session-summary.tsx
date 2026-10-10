import type { TrainingSession } from "@/domain/training-sessions";
import {
  formatDistance,
  formatPace,
} from "@/ui/shared/running-metric-formatters";
import { formatDuration } from "@/ui/shared/duration-formatters";
import { useDistanceDisplayUnit } from "@/ui/users/measurement-unit-context";

type SkippedTrainingSessionSummaryProps = { trainingSession: TrainingSession };

export function SkippedTrainingSessionSummary({
  trainingSession,
}: SkippedTrainingSessionSummaryProps) {
  const measurementUnit = useDistanceDisplayUnit();
  if (trainingSession.activityType === "STRENGTH") {
    return trainingSession.targetDurationSeconds === null ? null : (
      <p className="mt-3 text-sm text-zinc-600">
        {formatDuration(trainingSession.targetDurationSeconds)}
      </p>
    );
  }

  const pace = Math.round(
    (trainingSession.targetDurationSeconds * 1000) /
      trainingSession.targetDistanceMetres,
  );
  return (
    <p className="mt-3 text-sm text-zinc-600">
      {formatDistance(trainingSession.targetDistanceMetres, measurementUnit)} ·{" "}
      {formatDuration(trainingSession.targetDurationSeconds)} ·{" "}
      {formatPace(pace, measurementUnit)}
    </p>
  );
}
