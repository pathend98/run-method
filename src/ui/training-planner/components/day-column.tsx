import { TimeOfDaySection } from "./time-of-day-section";
import { formatDayDate } from "../services/training-planner-service";
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
      className="flex min-h-64 min-w-0 flex-col px-3 py-4"
      role="listitem"
    >
      <header className="flex items-baseline gap-1.5">
        <h2
          aria-label={day.day}
          id={`${day.day.toLowerCase()}-heading`}
          className="text-sm font-semibold uppercase tracking-wide text-zinc-950"
        >
          {day.day.slice(0, 3)}
        </h2>
        {day.date ? (
          <time
            className="text-sm font-medium text-zinc-500"
            dateTime={day.date}
          >
            {formatDayDate(day.date)}
          </time>
        ) : null}
      </header>

      <div className="flex flex-1 flex-col gap-4 pt-5">
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
      <footer className="pt-4">
        <button
          className="rounded-md px-1 py-1 text-sm font-semibold text-teal-800 hover:bg-teal-50 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          onClick={() => onAddActivity?.(day)}
          type="button"
        >
          Add activity
        </button>
      </footer>
    </article>
  );
}
