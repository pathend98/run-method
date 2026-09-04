import type { ReactNode } from "react";

import type { TrainingSession } from "@/domain/training-sessions";
type ActivityDetailsBodyProps = {
  activity: TrainingSession;
  plannedMetrics: ReactNode;
};

export function ActivityDetailsBody({
  activity,
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

      {activity.skipReason ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Skip reason
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-950">
            {activity.skipReason}
          </p>
        </div>
      ) : null}
    </>
  );
}
