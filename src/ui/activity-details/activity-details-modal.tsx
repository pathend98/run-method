import { useEffect, useState } from "react";

import type { TrainingSession } from "@/domain/training-sessions";
import { formatActivityType } from "@/ui/training-sessions/training-session-label-formatters";
import { RunActivityDetails } from "./components/run-activity-details";
import { StrengthActivityDetails } from "./components/strength-activity-details";

type ActivityDetailsModalProps = {
  activity: TrainingSession;
  isDeleting: boolean;
  onClose: () => void;
  onDelete: () => Promise<unknown>;
  onEdit: () => void;
};

export function ActivityDetailsModal({
  activity,
  isDeleting,
  onClose,
  onDelete,
  onEdit,
}: ActivityDetailsModalProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isDeleting, onClose]);

  async function confirmDelete() {
    setDeleteError(null);

    try {
      await onDelete();
      onClose();
    } catch {
      setDeleteError("Unable to delete activity. Please try again.");
    }
  }

  function cancelDelete() {
    setDeleteError(null);
    setIsConfirmingDelete(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Dismiss activity details"
        className="absolute inset-0 cursor-default bg-zinc-950/30"
        disabled={isDeleting}
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby="activity-details-title"
        aria-modal="true"
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:p-6"
        role="dialog"
      >
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
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
          {isConfirmingDelete ? (
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-md border border-zinc-200 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDeleting}
                onClick={cancelDelete}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-red-700 px-3 py-1 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isDeleting}
                onClick={() => void confirmDelete()}
                type="button"
              >
                {isDeleting ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-md bg-teal-700 px-3 py-1 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                onClick={onEdit}
                type="button"
              >
                Edit activity
              </button>
              <button
                className="rounded-md border border-red-300 px-3 py-1 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                onClick={() => setIsConfirmingDelete(true)}
                type="button"
              >
                Delete activity
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
          )}
        </div>

        {isConfirmingDelete ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            <p className="font-semibold">Delete “{activity.title}”?</p>
            <p>This action cannot be undone.</p>
            {deleteError ? (
              <p className="mt-2 font-medium text-red-700" role="alert">
                {deleteError}
              </p>
            ) : null}
          </div>
        ) : null}

        {activity.activityType === "RUN" ? (
          <RunActivityDetails activity={activity} />
        ) : (
          <StrengthActivityDetails activity={activity} />
        )}
      </section>
    </div>
  );
}
