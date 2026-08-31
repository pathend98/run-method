import type { ReactNode } from "react";

import type { TrainingSession } from "@/domain/training-sessions";
import {
  formatActivityType,
  formatStatus,
} from "@/ui/training-sessions/training-session-label-formatters";

type ActivityDetailsBodyProps = {
  activity: TrainingSession;
  detailMetricItems: ReactNode;
  plannedMetrics: ReactNode;
};

export function ActivityDetailsBody({
  activity,
  detailMetricItems,
  plannedMetrics,
}: ActivityDetailsBodyProps) {
  return (
    <>
      {plannedMetrics}

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

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Time of day
            </dt>
            <dd className="mt-1 text-sm text-zinc-950">
              {activity.timeOfDay ?? "Any time"}
            </dd>
          </div>
          {detailMetricItems}
        </dl>
      </section>
    </>
  );
}
