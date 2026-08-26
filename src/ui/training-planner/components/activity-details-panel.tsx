import { useEffect } from "react";

import { formatActivityType } from "../utils/training-planner-formatters";
import type { TrainingActivity } from "../types/training-planner-types";

type ActivityDetailsPanelProps = {
  activity: TrainingActivity;
  onClose: () => void;
};

function formatStatus(status: TrainingActivity["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatTargetType(targetType: string) {
  return targetType
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" + ");
}

function formatDistance(metres: number | null) {
  return metres === null ? null : `${(metres / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return null;
  }

  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

function formatPace(secondsPerKilometre: number | null) {
  if (secondsPerKilometre === null) {
    return null;
  }

  const minutes = Math.floor(secondsPerKilometre / 60);
  const seconds = String(secondsPerKilometre % 60).padStart(2, "0");
  return `${minutes}:${seconds} / km`;
}

function hasActualRunMetrics(activity: TrainingActivity) {
  return (
    activity.activityType === "RUN" &&
    (activity.actualDistanceMetres !== null ||
      activity.actualDurationSeconds !== null)
  );
}

function hasActualStrengthMetrics(activity: TrainingActivity) {
  return (
    activity.activityType === "STRENGTH" &&
    activity.actualDurationSeconds !== null
  );
}

export function ActivityDetailsPanel({
  activity,
  onClose,
}: ActivityDetailsPanelProps) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const targetPace =
    activity.activityType === "RUN"
      ? formatPace(activity.targetPaceSecondsPerKilometre)
      : null;
  const targetDuration = formatDuration(activity.targetDurationSeconds);
  const targetDistance =
    activity.activityType === "RUN"
      ? formatDistance(activity.targetDistanceMetres)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Dismiss activity details"
        className="absolute inset-0 cursor-default bg-zinc-950/30"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-labelledby="activity-details-title"
        aria-modal="true"
        className="relative z-10 h-full w-full overflow-y-auto bg-white p-4 shadow-xl sm:w-[min(100vw,28rem)] lg:w-[33vw] lg:max-w-[40rem]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              {formatActivityType(activity.activityType)}
            </p>
            <h2
              className="text-xl font-semibold text-zinc-950"
              id="activity-details-title"
            >
              {activity.title}
            </h2>
          </div>
          <button
            aria-label="Close activity details"
            className="rounded-md border border-zinc-200 px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <dl
          aria-label="Planned activity metrics"
          className="mt-6 grid grid-cols-2 gap-3"
        >
          {activity.activityType === "RUN" ? (
            <div className="col-span-2 rounded-lg border border-teal-200 bg-teal-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                Distance
              </dt>
              <dd className="mt-2 text-3xl font-semibold text-zinc-950">
                {targetDistance ?? "No target distance"}
              </dd>
            </div>
          ) : null}
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
          {activity.activityType === "RUN" ? (
            <div className="col-span-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Target pace
              </dt>
              <dd className="mt-1 text-lg font-semibold text-zinc-950">
                {targetPace ?? "No target pace"}
              </dd>
            </div>
          ) : null}
        </dl>

        <section className="mt-6 border-t border-zinc-200 pt-5">
          <h3 className="text-sm font-semibold text-zinc-950">Description</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {activity.description ?? "No description"}
          </p>
        </section>

        <section className="mt-6 border-t border-zinc-200 pt-5">
          <h3 className="text-sm font-semibold text-zinc-950">Details</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              {formatStatus(activity.status)}
            </span>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              {formatActivityType(activity.activityType)}
            </span>
          </div>

          {activity.skipReason ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Skip reason
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-950">
                {activity.skipReason}
              </p>
            </div>
          ) : null}

          {activity.activityType === "RUN" ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Target type
                </dt>
                <dd className="mt-1 text-sm text-zinc-950">
                  {formatTargetType(activity.targetType)}
                </dd>
              </div>
              {hasActualRunMetrics(activity) ? (
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
              ) : null}
            </dl>
          ) : hasActualStrengthMetrics(activity) ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Actual duration
                </dt>
                <dd className="mt-1 text-sm text-zinc-950">
                  {formatDuration(activity.actualDurationSeconds)}
                </dd>
              </div>
            </dl>
          ) : null}
        </section>
      </aside>
    </div>
  );
}
