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
      className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50"
      role="list"
    >
      <div className="grid min-w-[56rem] grid-cols-7 divide-x divide-zinc-200">
        {week.map((day) => (
          <DayColumn
            key={day.day}
            day={day}
            onAddActivity={onAddActivity}
            onSelectActivity={onSelectActivity}
          />
        ))}
      </div>
    </div>
  );
}
