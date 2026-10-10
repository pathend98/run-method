import type { RunTrainingSession } from "@/domain/training-sessions";
import { RunningMetrics } from "@/domain/running-metrics";
import {
  formatDistance,
  formatPace,
} from "@/ui/shared/running-metric-formatters";
import { formatDuration } from "@/ui/shared/duration-formatters";
import { TrainingSessionDetailsBody } from "./training-session-details-body";
import { useDistanceDisplayUnit } from "@/ui/users/measurement-unit-context";

type RunDetailsProps = {
  trainingSession: RunTrainingSession;
};

export function RunDetails({ trainingSession }: RunDetailsProps) {
  const measurementUnit = useDistanceDisplayUnit();
  const runningMetrics = new RunningMetrics(measurementUnit);
  const distanceMetres = trainingSession.targetDistanceMetres;
  const durationSeconds = trainingSession.targetDurationSeconds;
  const paceSecondsPerKilometre = runningMetrics.paceForRun(
    distanceMetres,
    durationSeconds,
  );
  const targetDistance = formatDistance(distanceMetres, measurementUnit);
  const targetDuration = formatDuration(durationSeconds);
  const targetPace = formatPace(paceSecondsPerKilometre, measurementUnit);
  const isCompleted = trainingSession.status === "COMPLETED";
  const actualDistance = trainingSession.actualDistanceMetres;
  const actualDuration = trainingSession.actualDurationSeconds;
  const completedMetrics =
    isCompleted && actualDistance !== null && actualDuration !== null ? (
      <dl
        aria-label="Completed training session metrics"
        className="mt-6 grid gap-8 sm:grid-cols-3"
      >
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Actual distance
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-zinc-950">
            {formatDistance(actualDistance, measurementUnit)}
          </dd>
          <p className="mt-2 text-sm text-zinc-600">Target: {targetDistance}</p>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Actual pace
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-zinc-950">
            {formatPace(
              runningMetrics.paceForRun(actualDistance, actualDuration),
              measurementUnit,
            )}
          </dd>
          <p className="mt-2 text-sm text-zinc-600">Target: {targetPace}</p>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Actual duration
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-zinc-950">
            {formatDuration(actualDuration)}
          </dd>
          <p className="mt-2 text-sm text-zinc-600">Target: {targetDuration}</p>
        </div>
      </dl>
    ) : null;

  const plannedMetrics = (
    <dl
      aria-label="Planned training session metrics"
      className="mt-6 grid gap-8 sm:grid-cols-3"
    >
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Distance
        </dt>
        <dd className="mt-1 text-lg font-semibold text-zinc-950">
          {targetDistance}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Target pace
        </dt>
        <dd className="mt-1 text-lg font-semibold text-zinc-950">
          {targetPace}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Duration
        </dt>
        <dd className="mt-1 text-lg font-semibold text-zinc-950">
          {targetDuration}
        </dd>
      </div>
    </dl>
  );

  return (
    <TrainingSessionDetailsBody
      trainingSession={trainingSession}
      plannedMetrics={completedMetrics ?? plannedMetrics}
    />
  );
}
