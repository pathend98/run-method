import type { TimeOfDay, TrainingActivity, TrainingDay } from "./types";

const timeSections: { label: string; value: TimeOfDay }[] = [
  { label: "AM", value: "AM" },
  { label: "Any time", value: null },
  { label: "PM", value: "PM" },
];

type TrainingPlannerProps = {
  week: TrainingDay[];
};

export function TrainingPlanner({ week }: TrainingPlannerProps) {
  return (
    <section
      aria-labelledby="training-planner-heading"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          Weekly schedule
        </p>
        <h1
          id="training-planner-heading"
          className="text-3xl font-semibold text-zinc-950 sm:text-4xl"
        >
          Training planner
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-zinc-600">
          A simple week view for arranging runs, workouts, recovery, and rest
          across morning, flexible, and evening slots.
        </p>
      </div>

      <WeekGrid week={week} />
    </section>
  );
}

type WeekGridProps = {
  week: TrainingDay[];
};

export function WeekGrid({ week }: WeekGridProps) {
  return (
    <div
      aria-label="Weekly training planner"
      className="grid gap-3 lg:grid-cols-7"
      role="list"
    >
      {week.map((day) => (
        <DayColumn key={day.day} day={day} />
      ))}
    </div>
  );
}

type DayColumnProps = {
  day: TrainingDay;
};

export function DayColumn({ day }: DayColumnProps) {
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
            />
          ))
        ) : (
          <p className="text-sm text-zinc-500">No activity scheduled</p>
        )}
      </div>
    </article>
  );
}

type TimeOfDaySectionProps = {
  activities: TrainingActivity[];
  day: TrainingDay["day"];
  label: string;
};

export function TimeOfDaySection({
  activities,
  day,
  label,
}: TimeOfDaySectionProps) {
  const headingId = `${day.toLowerCase()}-${label.toLowerCase().replace(" ", "-")}`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h3
        id={headingId}
        className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
      >
        {label}
      </h3>

      <ul className="flex flex-col gap-2">
        {activities.map((activity) => (
          <li key={activity.id}>
            <TrainingActivityCard activity={activity} />
          </li>
        ))}
      </ul>
    </section>
  );
}

type TrainingActivityCardProps = {
  activity: TrainingActivity;
};

export function TrainingActivityCard({ activity }: TrainingActivityCardProps) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-zinc-950">{activity.title}</p>
        <p className="text-xs font-medium text-teal-700">
          {activity.activityType}
        </p>
        {activity.description ? (
          <p className="text-xs leading-5 text-zinc-600">
            {activity.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
