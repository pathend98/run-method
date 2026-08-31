import type { TrainingSession } from "@/domain/training-sessions";
import { formatActivityType } from "@/ui/training-sessions/training-session-label-formatters";

type EditActivityHeaderProps = {
  activity: TrainingSession;
  isSubmitting: boolean;
  onClose: () => void;
};

export function EditActivityHeader({
  activity,
  isSubmitting,
  onClose,
}: EditActivityHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          {formatActivityType(activity.activityType)} · {activity.date}
        </p>
        <h2
          className="text-xl font-semibold text-zinc-950"
          id="edit-activity-title"
        >
          Edit activity
        </h2>
      </div>
      <button
        aria-label="Close edit activity"
        className="rounded-md border border-zinc-200 px-2 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        disabled={isSubmitting}
        onClick={onClose}
        type="button"
      >
        Close
      </button>
    </div>
  );
}
