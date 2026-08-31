import type { StrengthTrainingSession } from "@/domain/training-sessions";
import { formatDuration } from "@/ui/training-sessions/training-session-metric-formatters";
import { ActivityDetailsBody } from "./activity-details-body";

type StrengthActivityDetailsProps = {
  activity: StrengthTrainingSession;
};

export function StrengthActivityDetails({
  activity,
}: StrengthActivityDetailsProps) {
  const targetDuration = formatDuration(activity.targetDurationSeconds);
  const detailMetricItems =
    activity.actualDurationSeconds !== null ? (
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Actual duration
        </dt>
        <dd className="mt-1 text-sm text-zinc-950">
          {formatDuration(activity.actualDurationSeconds)}
        </dd>
      </div>
    ) : null;

  const plannedMetrics = (
    <dl aria-label="Planned activity metrics" className="mt-6 grid gap-3">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
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
    <ActivityDetailsBody
      activity={activity}
      detailMetricItems={detailMetricItems}
      plannedMetrics={plannedMetrics}
    />
  );
}
