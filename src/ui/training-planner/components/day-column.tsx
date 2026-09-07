import { TimeOfDaySection } from "./time-of-day-section";
import { Button } from "@/ui/components/button";
import { formatDayDate } from "../services/training-planner-service";
import type {
  TimeOfDay,
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

type DayColumnProps = {
  day: TrainingDay;
  isToday?: boolean;
  onAddActivity?: (day: TrainingDay) => void;
  onSelectActivity: (activity: TrainingActivity) => void;
};

const timeSections: { label: string; value: TimeOfDay }[] = [
  { label: "Morning", value: "AM" },
  { label: "Anytime", value: null },
  { label: "Evening", value: "PM" },
];

export function DayColumn({
  day,
  isToday = false,
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
      className={`group flex min-h-64 min-w-0 flex-col px-3 py-4 ${isToday ? "bg-teal-100/40" : ""}`}
      role="listitem"
    >
      <header className="flex items-baseline gap-1.5">
        <h2
          aria-label={day.day}
          id={`${day.day.toLowerCase()}-heading`}
          className="text-sm font-semibold text-zinc-950"
        >
          {day.day}
        </h2>
        {day.date ? (
          <time
            aria-current={isToday ? "date" : undefined}
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
          <p className="text-sm text-zinc-500">Rest day</p>
        )}
      </div>
      <footer className="pt-4">
        <Button
          aria-label={`Add activity to ${day.day}`}
          className="px-1 py-1 text-xs hover:text-teal-700 hover:underline [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
          onClick={() => onAddActivity?.(day)}
          type="button"
          variant="tertiary"
        >
          + Add
        </Button>
      </footer>
    </article>
  );
}
