import { useDroppable } from "@dnd-kit/react";
import { DraggableTrainingSessionCard } from "./draggable-training-session-card";
import type {
  TimeOfDay,
  PlannerTrainingSession,
  TrainingDay,
} from "../calendar/training-calendar-types";

type TimeOfDayDropZoneProps = {
  trainingSessions: PlannerTrainingSession[];
  day: TrainingDay;
  hasLeadingDay: boolean;
  isDragActive: boolean;
  label: string;
  onSelectTrainingSession: (trainingSession: PlannerTrainingSession) => void;
  timeOfDay: TimeOfDay;
};

function createDropZoneId(day: TrainingDay, timeOfDay: TimeOfDay) {
  const bucket = timeOfDay ?? "ANY";
  return `training-drop-zone:${day.date ?? day.day}:${bucket}`;
}

export function TimeOfDayDropZone({
  trainingSessions,
  day,
  hasLeadingDay,
  isDragActive,
  label,
  onSelectTrainingSession,
  timeOfDay,
}: TimeOfDayDropZoneProps) {
  const headingId = `${day.day.toLowerCase()}-${label.toLowerCase()}`;
  const { isDropTarget, ref } = useDroppable({
    data: { date: day.date, timeOfDay },
    disabled: !isDragActive,
    id: createDropZoneId(day, timeOfDay),
    accept: "training-session",
  });

  if (!isDragActive && trainingSessions.length === 0) return null;

  const zoneClassName = isDragActive
    ? `flex min-h-28 flex-1 flex-col gap-2 border-t border-dashed border-zinc-300 p-3 ${
        hasLeadingDay ? "border-l" : ""
      } ${
        isDropTarget
          ? "bg-teal-50 ring-1 ring-inset ring-teal-500"
          : "bg-white/50"
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
        {trainingSessions.map((trainingSession) => (
          <li key={trainingSession.id}>
            <DraggableTrainingSessionCard
              trainingSession={trainingSession}
              onSelect={() => onSelectTrainingSession(trainingSession)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
