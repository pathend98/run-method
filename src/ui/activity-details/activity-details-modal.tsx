import { useEffect } from "react";

import type { TrainingSession } from "@/domain/training-sessions";
import { formatActivityType } from "@/ui/training-sessions/training-session-label-formatters";
import { RunActivityDetails } from "./components/run-activity-details";
import { StrengthActivityDetails } from "./components/strength-activity-details";

type ActivityDetailsModalProps = {
  activity: TrainingSession;
  onClose: () => void;
  onEdit: () => void;
};

export function ActivityDetailsModal({
  activity,
  onClose,
  onEdit,
}: ActivityDetailsModalProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Dismiss activity details"
        className="absolute inset-0 cursor-default bg-zinc-950/30"
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby="activity-details-title"
        aria-modal="true"
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:p-6"
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
          <div className="flex gap-2">
            <button
              className="rounded-md bg-teal-700 px-3 py-1 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              onClick={onEdit}
              type="button"
            >
              Edit activity
            </button>
            <button
              aria-label="Close activity details"
              className="rounded-md border border-zinc-200 px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        {activity.activityType === "RUN" ? (
          <RunActivityDetails activity={activity} />
        ) : (
          <StrengthActivityDetails activity={activity} />
        )}
      </section>
    </div>
  );
}
