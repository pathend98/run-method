import type { TrainingSession } from "@/domain/training-sessions";
import {
  formatActivityType,
  formatStatus,
  formatTimeOfDay,
} from "@/ui/training-sessions/formatters";
import { formatLockedTargets } from "../utils/edit-training-session-formatters";
import { ReadOnlyDetail } from "./read-only-detail";
import { useDistanceDisplayUnit } from "@/ui/users/measurement-unit-context";

type EditTrainingSessionSummaryProps = {
  trainingSession: TrainingSession;
};

export function EditTrainingSessionSummary({
  trainingSession,
}: EditTrainingSessionSummaryProps) {
  const measurementUnit = useDistanceDisplayUnit();
  const isScheduled = trainingSession.status === "SCHEDULED";
  const showLockedTargets = !isScheduled;

  return (
    <dl className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-zinc-50 p-3 text-sm">
      <ReadOnlyDetail
        label="Training session type"
        value={formatActivityType(trainingSession.activityType)}
      />
      <ReadOnlyDetail
        label="Status"
        value={formatStatus(trainingSession.status)}
      />
      {!isScheduled ? (
        <ReadOnlyDetail
          label="Time of day"
          value={formatTimeOfDay(trainingSession.timeOfDay)}
        />
      ) : null}
      {showLockedTargets ? (
        <ReadOnlyDetail
          label="Target details"
          value={formatLockedTargets(trainingSession, measurementUnit)}
        />
      ) : null}
    </dl>
  );
}
