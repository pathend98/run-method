import type { TrainingActivity } from "../types/training-planner-types";
import {
  CircleCheck,
  CircleMinus,
  Clock3,
  Dumbbell,
  SportShoe,
} from "lucide-react";
import {
  formatCompactDuration,
  formatDistance,
} from "@/ui/activities/formatters/training-session-metric-formatters";
import { formatStatus } from "@/ui/activities/formatters/training-session-label-formatters";
import { useDistanceDisplayUnit } from "@/ui/users/measurement-unit-context";

type TrainingActivityCardProps = {
  activity: TrainingActivity;
  className?: string;
  onSelect?: () => void;
};

const statusStyles = {
  SCHEDULED: {
    icon: Clock3,
    label: "text-zinc-600",
  },
  COMPLETED: {
    icon: CircleCheck,
    label: "text-green-700",
  },
  SKIPPED: {
    icon: CircleMinus,
    label: "text-amber-700",
  },
} as const;

export function TrainingActivityCard({
  activity,
  className,
  onSelect,
}: TrainingActivityCardProps) {
  const measurementUnit = useDistanceDisplayUnit();
  const statusStyle = statusStyles[activity.status];
  const StatusIcon = statusStyle.icon;
  const ActivityIcon = activity.activityType === "RUN" ? SportShoe : Dumbbell;
  const isCompleted = activity.status === "COMPLETED";
  const distance =
    activity.activityType === "RUN"
      ? formatDistance(
          isCompleted
            ? activity.actualDistanceMetres
            : activity.targetDistanceMetres,
          measurementUnit,
        )
      : null;
  const duration = formatCompactDuration(
    isCompleted
      ? activity.actualDurationSeconds
      : activity.targetDurationSeconds,
  );
  const metrics = [distance, duration].filter(
    (metric): metric is string => metric !== null,
  );

  return (
    <button
      aria-label={`View ${activity.title} details`}
      className={`w-full rounded-md border border-zinc-200 bg-white px-3 py-3 text-left transition hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600${className ? ` ${className}` : ""}`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex gap-3">
        <ActivityIcon
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-zinc-500"
          strokeWidth={1.75}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="line-clamp-2 text-sm font-semibold text-zinc-950">
            {activity.title}
          </p>
          <p className="text-xs font-medium leading-4 text-zinc-600">
            {metrics.join(" · ")}
          </p>
          <p
            className={`flex items-center gap-1 text-xs font-medium ${statusStyle.label}`}
          >
            <StatusIcon aria-hidden="true" className="size-3.5" />
            {formatStatus(activity.status)}
          </p>
          <span className="sr-only">
            {activity.activityType === "RUN" ? "Run" : "Strength"}
          </span>
        </div>
      </div>
    </button>
  );
}
