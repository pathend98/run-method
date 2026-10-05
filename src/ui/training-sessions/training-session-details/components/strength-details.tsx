import type { StrengthTrainingSession } from "@/domain/training-sessions";
import { formatDuration } from "@/ui/training-sessions/formatters";
import { TrainingSessionDetailsBody } from "./training-session-details-body";

type StrengthDetailsProps = {
  trainingSession: StrengthTrainingSession;
};

export function StrengthDetails({ trainingSession }: StrengthDetailsProps) {
  const targetDuration = formatDuration(trainingSession.targetDurationSeconds);
  const actualDuration = trainingSession.actualDurationSeconds;
  const completedMetrics =
    trainingSession.status === "COMPLETED" && actualDuration !== null ? (
      <dl
        aria-label="Completed training session metrics"
        className="mt-6 grid gap-8"
      >
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Actual duration
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-zinc-950">
            {formatDuration(actualDuration)}
          </dd>
          <p className="mt-2 text-sm text-zinc-600">
            Target: {targetDuration ?? "No target duration"}
          </p>
        </div>
      </dl>
    ) : null;
  const plannedMetrics = (
    <dl
      aria-label="Planned training session metrics"
      className="mt-6 grid gap-8"
    >
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Duration
        </dt>
        <dd className="mt-1 text-lg font-semibold text-zinc-950">
          {targetDuration ?? "No target duration"}
        </dd>
      </div>
    </dl>
  );

  return (
    <TrainingSessionDetailsBody
      trainingSession={trainingSession}
      plannedMetrics={completedMetrics ?? plannedMetrics}
    />
  );
}
