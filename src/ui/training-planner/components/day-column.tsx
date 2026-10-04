import { TimeOfDaySection } from "./time-of-day-section";
import { TimeOfDayDropZone } from "./time-of-day-drop-zone";
import { Button } from "@/ui/shared/button/button";
import { formatDayDate } from "../services/training-planner-service";
import type {
  TimeOfDay,
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

type DayColumnProps = {
  day: TrainingDay;
  hasLeadingDay?: boolean;
  isDragAndDropEnabled?: boolean;
  isDragActive?: boolean;
  isToday?: boolean;
  onAddActivity?: (day: TrainingDay) => void;
  onSelectActivity: (activity: TrainingActivity) => void;
};

const timeSections: { label: string; value: TimeOfDay }[] = [
  { label: "Morning", value: "AM" },
  { label: "Evening", value: "PM" },
  { label: "Anytime", value: null },
];

export function DayColumn({
  day,
  hasLeadingDay = false,
  isDragAndDropEnabled = false,
  isDragActive = false,
  isToday = false,
  onAddActivity,
  onSelectActivity,
}: DayColumnProps) {
  const sections = timeSections.map((section) => ({
    ...section,
    activities: day.activities.filter(
      (activity) => activity.timeOfDay === section.value,
    ),
  }));
  const populatedTimeSections = sections.filter(
    (section) => section.activities.length > 0,
  );

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

      <div
        className={`flex flex-1 flex-col pt-5 ${
          isDragActive ? "-mx-3 gap-0" : "gap-4"
        }`}
      >
        {!isDragActive && populatedTimeSections.length === 0 ? (
          <p className="text-sm text-zinc-500">Rest day</p>
        ) : isDragAndDropEnabled ? (
          sections.map((section) => (
            <TimeOfDayDropZone
              key={section.label}
              activities={section.activities}
              day={day}
              hasLeadingDay={hasLeadingDay}
              isDragActive={isDragActive}
              label={section.label}
              onSelectActivity={onSelectActivity}
              timeOfDay={section.value}
            />
          ))
        ) : (
          populatedTimeSections.map((section) => (
            <TimeOfDaySection
              key={section.label}
              activities={section.activities}
              day={day.day}
              label={section.label}
              onSelectActivity={onSelectActivity}
            />
          ))
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
