import { TrainingActivityCard } from "./training-activity-card";
import type {
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

type TimeOfDaySectionProps = {
  activities: TrainingActivity[];
  day: TrainingDay["day"];
  label: string;
  onSelectActivity: (activity: TrainingActivity) => void;
};

export function TimeOfDaySection({
  activities,
  day,
  label,
  onSelectActivity,
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
            <TrainingActivityCard
              activity={activity}
              onSelect={() => onSelectActivity(activity)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
