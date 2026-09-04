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
      {activity.skipReason ? (
        <section className="mt-6 border-t border-zinc-200 pt-5">
          <h3 className="text-sm font-semibold text-zinc-950">
            Why it was skipped
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {activity.skipReason}
          </p>
        </section>
      ) : null}

      {plannedMetrics}

      <section className="mt-6 border-t border-zinc-200 pt-5">
        <h3 className="text-sm font-semibold text-zinc-950">Description</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          {activity.description ?? "No description"}
        </p>
      </section>
    </>
  );
}
