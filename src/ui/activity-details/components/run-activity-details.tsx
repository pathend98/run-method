import type { RunTrainingSession } from "@/domain/training-sessions";
import {
  formatDistance,
  formatDuration,
  formatPace,
} from "@/ui/training-sessions/training-session-metric-formatters";
import {
  calculatePaceSecondsPerKilometre,
  resolveRunTargets,
} from "../utils/run-targets";
import { ActivityDetailsBody } from "./activity-details-body";

type RunActivityDetailsProps = {
  activity: RunTrainingSession;
};

export function RunActivityDetails({ activity }: RunActivityDetailsProps) {
  const { distanceMetres, durationSeconds, paceSecondsPerKilometre } =
    resolveRunTargets(activity);
  const targetDistance = formatDistance(distanceMetres);
  const targetDuration = formatDuration(durationSeconds);
  const targetPace = formatPace(paceSecondsPerKilometre);
  const isCompleted = activity.status === "COMPLETED";
  const actualDistance = activity.actualDistanceMetres;
  const actualDuration = activity.actualDurationSeconds;
  const hasCompletedActuals =
    isCompleted && actualDistance !== null && actualDuration !== null;

  const completedMetrics =
    isCompleted && actualDistance !== null && actualDuration !== null ? (
    <dl
      aria-label="Completed activity metrics"
      className="mt-6 grid gap-3 sm:grid-cols-3"
    >
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          Actual distance
        </dt>
        <dd className="mt-1 text-2xl font-semibold text-zinc-950">
          {formatDistance(actualDistance)}
        </dd>
        <p className="mt-2 text-sm text-zinc-600">
          Target: {targetDistance}
        </p>
      </div>
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          Actual pace
        </dt>
        <dd className="mt-1 text-2xl font-semibold text-zinc-950">
          {formatPace(
            calculatePaceSecondsPerKilometre(
              actualDistance,
              actualDuration,
            ),
          )}
        </dd>
        <p className="mt-2 text-sm text-zinc-600">Target: {targetPace}</p>
      </div>
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          Actual duration
        </dt>
        <dd className="mt-1 text-2xl font-semibold text-zinc-950">
          {formatDuration(actualDuration)}
        </dd>
        <p className="mt-2 text-sm text-zinc-600">
          Target: {targetDuration}
        </p>
      </div>
    </dl>
  ) : null;

  const plannedMetrics = (
    <dl
      aria-label="Planned activity metrics"
      className="mt-6 grid gap-3 sm:grid-cols-3"
    >
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Distance
        </dt>
        <dd className="mt-1 text-lg font-semibold text-zinc-950">
          {targetDistance}
        </dd>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Target pace
        </dt>
        <dd className="mt-1 text-lg font-semibold text-zinc-950">
          {targetPace}
        </dd>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Duration
        </dt>
        <dd className="mt-1 text-lg font-semibold text-zinc-950">
          {targetDuration}
        </dd>
      </div>
    </dl>
  );

  const detailMetricItems = hasCompletedActuals ? null : (
    <>
      {activity.actualDistanceMetres !== null ? (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Actual distance
          </dt>
          <dd className="mt-1 text-sm text-zinc-950">
            {formatDistance(activity.actualDistanceMetres)}
          </dd>
        </div>
      ) : null}
      {activity.actualDurationSeconds !== null ? (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Actual duration
          </dt>
          <dd className="mt-1 text-sm text-zinc-950">
            {formatDuration(activity.actualDurationSeconds)}
          </dd>
        </div>
      ) : null}
    </>
  );

  return (
    <ActivityDetailsBody
      activity={activity}
      detailMetricItems={detailMetricItems}
      plannedMetrics={completedMetrics ?? plannedMetrics}
    />
  );
}
