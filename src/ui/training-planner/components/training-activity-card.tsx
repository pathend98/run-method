import type { TrainingActivity } from "../types/training-planner-types";
import {
  formatActivityType,
  formatStatus,
} from "@/ui/training-sessions/training-session-label-formatters";

type TrainingActivityCardProps = {
  activity: TrainingActivity;
  onSelect?: () => void;
};

const statusStyles = {
  SCHEDULED: {
    indicator: "bg-zinc-400",
    label: "text-zinc-700",
  },
  COMPLETED: {
    indicator: "bg-green-600",
    label: "text-green-800",
  },
  SKIPPED: {
    indicator: "bg-amber-500",
    label: "text-amber-800",
  },
} as const;

export function TrainingActivityCard({
  activity,
  onSelect,
}: TrainingActivityCardProps) {
  const statusStyle = statusStyles[activity.status];

  return (
    <button
      aria-label={`View ${activity.title} details`}
      className="w-full rounded-md px-2 py-2 text-left transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      onClick={onSelect}
      type="button"
    >
      <div className="flex gap-2">
        <span
          aria-hidden="true"
          className={`mt-1.5 size-1.5 shrink-0 rounded-full ${statusStyle.indicator}`}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="line-clamp-2 text-sm font-semibold text-zinc-950">
            {activity.title}
          </p>
          <p className="text-xs font-medium leading-4 text-zinc-600">
            <span className={statusStyle.label}>
              {formatStatus(activity.status)}
            </span>
            <span aria-hidden="true"> · </span>
            {formatActivityType(activity.activityType)}
          </p>
        </div>
      </div>
    </button>
  );
}
