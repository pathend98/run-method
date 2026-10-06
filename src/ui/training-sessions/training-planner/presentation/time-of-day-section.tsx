import { TrainingSessionCard } from "./training-session-card";
import type {
  PlannerTrainingSession,
  TrainingDay,
} from "../calendar/training-calendar-types";

type TimeOfDaySectionProps = {
  trainingSessions: PlannerTrainingSession[];
  day: TrainingDay["day"];
  label: string;
  onSelectTrainingSession: (trainingSession: PlannerTrainingSession) => void;
};

export function TimeOfDaySection({
  trainingSessions,
  day,
  label,
  onSelectTrainingSession,
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
        {trainingSessions.map((trainingSession) => (
          <li key={trainingSession.id}>
            <TrainingSessionCard
              trainingSession={trainingSession}
              onSelect={() => onSelectTrainingSession(trainingSession)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
