import type { TrainingSession } from "@/domain/training-sessions";
import {
  formatActivityType,
  formatStatus,
  formatTargetType,
} from "@/ui/training-sessions/training-session-label-formatters";
import { formatLockedTargets } from "../utils/edit-activity-formatters";
import { ReadOnlyDetail } from "./read-only-detail";

type EditActivitySummaryProps = {
  activity: TrainingSession;
};

export function EditActivitySummary({ activity }: EditActivitySummaryProps) {
  const isScheduled = activity.status === "SCHEDULED";
  const showLockedTargets = !isScheduled;

  return (
    <dl className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-zinc-50 p-3 text-sm">
      <ReadOnlyDetail
        label="Activity type"
        value={formatActivityType(activity.activityType)}
      />
      <ReadOnlyDetail label="Status" value={formatStatus(activity.status)} />
      {!isScheduled ? (
        <ReadOnlyDetail
          label="Time of day"
          value={activity.timeOfDay ?? "Any time"}
        />
      ) : null}
      {activity.activityType === "RUN" ? (
        <ReadOnlyDetail
          label="Run target"
          value={formatTargetType(activity.targetType)}
        />
      ) : null}
      {showLockedTargets ? (
        <ReadOnlyDetail
          label="Target details"
          value={formatLockedTargets(activity)}
        />
      ) : null}
    </dl>
  );
}
