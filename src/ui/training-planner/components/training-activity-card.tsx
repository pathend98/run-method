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
    card:
      "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50",
    label: "text-zinc-700",
  },
  COMPLETED: {
    card:
      "border-green-200 bg-green-50 hover:border-green-300 hover:bg-green-100",
    label: "text-green-800",
  },
  SKIPPED: {
    card:
      "border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100",
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
      className={`w-full rounded-md border px-3 py-2 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${statusStyle.card}`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex flex-col gap-1.5">
        <p className="line-clamp-2 text-sm font-semibold text-zinc-950">
          {activity.title}
        </p>
        <span
          className={`text-xs font-semibold leading-4 ${statusStyle.label}`}
        >
          {formatStatus(activity.status)}
        </span>
        <p className="text-xs font-medium text-teal-700">
          {formatActivityType(activity.activityType)}
        </p>
      </div>
    </button>
  );
}
