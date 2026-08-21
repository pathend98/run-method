import { timeSections } from "./time-sections";
import { TimeOfDaySection } from "./time-of-day-section";
import type { TrainingActivity, TrainingDay } from "./types";

type DayColumnProps = {
  day: TrainingDay;
  onSelectActivity: (activity: TrainingActivity) => void;
};

export function DayColumn({ day, onSelectActivity }: DayColumnProps) {
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
    </article>
  );
}
