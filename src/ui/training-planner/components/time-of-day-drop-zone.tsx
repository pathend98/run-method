import { useDroppable } from "@dnd-kit/react";
import { DraggableActivityCard } from "./draggable-activity-card";
import type {
  TimeOfDay,
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

type TimeOfDayDropZoneProps = {
  activities: TrainingActivity[];
  day: TrainingDay;
  isDragActive: boolean;
  label: string;
  onSelectActivity: (activity: TrainingActivity) => void;
  timeOfDay: TimeOfDay;
};

function createDropZoneId(day: TrainingDay, timeOfDay: TimeOfDay) {
  const bucket = timeOfDay ?? "ANY";
  return `training-drop-zone:${day.date ?? day.day}:${bucket}`;
}

export function TimeOfDayDropZone({
  activities,
  day,
  isDragActive,
  label,
  onSelectActivity,
  timeOfDay,
}: TimeOfDayDropZoneProps) {
  const headingId = `${day.day.toLowerCase()}-${label.toLowerCase()}`;
  const { isDropTarget, ref } = useDroppable({
    data: { day: day.day, timeOfDay },
    disabled: !isDragActive,
    id: createDropZoneId(day, timeOfDay),
    accept: "training-activity",
  });

  if (!isDragActive && activities.length === 0) return null;

  const zoneClassName = isDragActive
    ? `flex min-h-28 flex-1 flex-col gap-2 border border-dashed p-3 ${
        isDropTarget
          ? "border-teal-500 bg-teal-50"
          : "border-zinc-300 bg-white/50"
      }`
    : "flex flex-col gap-2";

  return (
    <section aria-labelledby={headingId} className={zoneClassName} ref={ref}>
      <h3
        id={headingId}
        className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
      >
        {label}
      </h3>

      <ul className="flex flex-col gap-2">
        {activities.map((activity) => (
          <li key={activity.id}>
            <DraggableActivityCard
              activity={activity}
              onSelect={() => onSelectActivity(activity)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
