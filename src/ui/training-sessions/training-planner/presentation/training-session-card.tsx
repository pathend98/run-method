import type { TrainingSession } from "@/domain/training-sessions";
import {
  CircleCheck,
  CircleMinus,
  Clock3,
  Dumbbell,
  SportShoe,
} from "lucide-react";
import { formatDistance } from "@/ui/shared/running-metric-formatters";
import { formatCompactDuration } from "@/ui/shared/duration-formatters";
import { formatStatus } from "@/ui/training-sessions/formatters";
import { useDistanceDisplayUnit } from "@/ui/users/measurement-unit-context";

type TrainingSessionCardProps = {
  trainingSession: TrainingSession;
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

export function TrainingSessionCard({
  trainingSession,
  className,
  onSelect,
}: TrainingSessionCardProps) {
  const measurementUnit = useDistanceDisplayUnit();
  const statusStyle = statusStyles[trainingSession.status];
  const StatusIcon = statusStyle.icon;
  const TrainingSessionIcon =
    trainingSession.activityType === "RUN" ? SportShoe : Dumbbell;
  const isCompleted = trainingSession.status === "COMPLETED";
  const distance =
    trainingSession.activityType === "RUN"
      ? formatDistance(
          isCompleted
            ? trainingSession.actualDistanceMetres
            : trainingSession.targetDistanceMetres,
          measurementUnit,
        )
      : null;
  const duration = formatCompactDuration(
    isCompleted
      ? trainingSession.actualDurationSeconds
      : trainingSession.targetDurationSeconds,
  );
  const metrics = [distance, duration].filter(
    (metric): metric is string => metric !== null,
  );

  return (
    <button
      aria-label={`View ${trainingSession.title} details`}
      className={`w-full rounded-md border border-zinc-200 bg-white px-3 py-3 text-left transition hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600${className ? ` ${className}` : ""}`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex gap-3">
        <TrainingSessionIcon
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-zinc-500"
          strokeWidth={1.75}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="line-clamp-2 text-sm font-semibold text-zinc-950">
            {trainingSession.title}
          </p>
          <p className="text-xs font-medium leading-4 text-zinc-600">
            {metrics.join(" · ")}
          </p>
          <p
            className={`flex items-center gap-1 text-xs font-medium ${statusStyle.label}`}
          >
            <StatusIcon aria-hidden="true" className="size-3.5" />
            {formatStatus(trainingSession.status)}
          </p>
          <span className="sr-only">
            {trainingSession.activityType === "RUN" ? "Run" : "Strength"}
          </span>
        </div>
      </div>
    </button>
  );
}
