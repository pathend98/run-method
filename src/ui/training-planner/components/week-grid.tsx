import { DayColumn } from "./day-column";
import type {
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

type WeekGridProps = {
  onAddActivity?: (day: TrainingDay) => void;
  onSelectActivity: (activity: TrainingActivity) => void;
  week: TrainingDay[];
};

export function WeekGrid({
  onAddActivity,
  onSelectActivity,
  week,
}: WeekGridProps) {
  return (
    <div
      aria-label="Weekly training planner"
      className="grid gap-3 lg:grid-cols-7"
      role="list"
    >
      {week.map((day) => (
        <DayColumn
          key={day.day}
          day={day}
          onAddActivity={onAddActivity}
          onSelectActivity={onSelectActivity}
        />
      ))}
    </div>
  );
}
