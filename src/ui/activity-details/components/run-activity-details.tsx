import type { RunTrainingSession } from "@/domain/training-sessions";
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatTargetType,
} from "../utils/activity-details-formatters";
import { resolveRunTargets } from "../utils/run-targets";
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

  const plannedMetrics = (
    <dl
      aria-label="Planned activity metrics"
      className="mt-6 grid grid-cols-2 gap-3"
    >
      <div className="col-span-2 rounded-lg border border-teal-200 bg-teal-50 p-4">
        <dt className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          Distance
        </dt>
        <dd className="mt-2 text-3xl font-semibold text-zinc-950">
          {targetDistance ?? "No target distance"}
        </dd>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Time
        </dt>
        <dd className="mt-1 text-lg font-semibold text-zinc-950">
          {activity.timeOfDay ?? "Any time"}
        </dd>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Duration
        </dt>
        <dd className="mt-1 text-lg font-semibold text-zinc-950">
          {targetDuration ?? "No target duration"}
        </dd>
      </div>
      <div className="col-span-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Target pace
        </dt>
        <dd className="mt-1 text-lg font-semibold text-zinc-950">
          {targetPace ?? "No target pace"}
        </dd>
      </div>
    </dl>
  );

  const detailMetrics = (
    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
      <div className="col-span-2">
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Target type
        </dt>
        <dd className="mt-1 text-sm text-zinc-950">
          {formatTargetType(activity.targetType)}
        </dd>
      </div>
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
    </dl>
  );

  return (
    <ActivityDetailsBody
      activity={activity}
      detailMetrics={detailMetrics}
      plannedMetrics={plannedMetrics}
    />
  );
}
