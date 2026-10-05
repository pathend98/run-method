import type { ReactNode } from "react";

import type { TrainingSession } from "@/domain/training-sessions";
type TrainingSessionDetailsBodyProps = {
  trainingSession: TrainingSession;
  plannedMetrics: ReactNode;
};

export function TrainingSessionDetailsBody({
  trainingSession,
  plannedMetrics,
}: TrainingSessionDetailsBodyProps) {
  return (
    <>
      {trainingSession.skipReason ? (
        <section className="mt-6 border-t border-zinc-200 pt-5">
          <h3 className="text-sm font-semibold text-zinc-950">
            Why it was skipped
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {trainingSession.skipReason}
          </p>
        </section>
      ) : null}

      {plannedMetrics}

      {trainingSession.description ? (
        <section className="mt-6 border-t border-zinc-200 pt-5">
          <h3 className="text-sm font-semibold text-zinc-950">Description</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {trainingSession.description}
          </p>
        </section>
      ) : null}
    </>
  );
}
