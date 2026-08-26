import { TimeOfDaySection } from "./time-of-day-section";
import type {
  TimeOfDay,
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

type DayColumnProps = {
  day: TrainingDay;
  onAddActivity?: (day: TrainingDay) => void;
  onSelectActivity: (activity: TrainingActivity) => void;
};

const timeSections: { label: string; value: TimeOfDay }[] = [
  { label: "AM", value: "AM" },
  { label: "Any time", value: null },
  { label: "PM", value: "PM" },
];

export function DayColumn({
  day,
  onAddActivity,
  onSelectActivity,
}: DayColumnProps) {
  const populatedTimeSections = timeSections
    .map((section) => ({
      ...section,
      activities: day.activities.filter(
        (activity) => activity.timeOfDay === section.value,
      ),
    }))
    .filter((section) => section.activities.length > 0);

  return (
    <article
      aria-label={day.day}
      aria-labelledby={`${day.day.toLowerCase()}-heading`}
      className="flex min-h-64 flex-col rounded-lg border border-zinc-200 bg-zinc-50"
      role="listitem"
    >
      <header className="border-b border-zinc-200 px-3 py-3">
        <h2
          id={`${day.day.toLowerCase()}-heading`}
          className="text-base font-semibold text-zinc-950"
        >
          {day.day}
        </h2>
      </header>

      <div className="flex flex-1 flex-col gap-3 p-3">
        {populatedTimeSections.length > 0 ? (
          populatedTimeSections.map((section) => (
            <TimeOfDaySection
              key={section.label}
              activities={section.activities}
              day={day.day}
              label={section.label}
              onSelectActivity={onSelectActivity}
            />
          ))
        ) : (
          <p className="text-sm text-zinc-500">No activity scheduled</p>
        )}
      </div>
      <footer className="border-t border-zinc-200 p-3">
        <button
          className="w-full rounded-md border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          onClick={() => onAddActivity?.(day)}
          type="button"
        >
          Add activity
        </button>
      </footer>
    </article>
  );
}
