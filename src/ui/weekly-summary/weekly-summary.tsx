import { format } from "date-fns";

import type {
  TrainingSession,
  TrainingSessionDateRange,
} from "@/domain/training-sessions";
import {
  formatCompactDuration,
  formatDistance,
} from "@/ui/training-sessions/training-session-metric-formatters";
import { SummaryMetric } from "./components/summary-metric";
import { getWeeklySummary } from "./services/weekly-summary-service";

type WeeklySummaryProps = {
  activities: TrainingSession[];
  weekRange: TrainingSessionDateRange;
};

export function WeeklySummary({ activities, weekRange }: WeeklySummaryProps) {
  const summary = getWeeklySummary(
    activities,
    weekRange,
    format(new Date(), "yyyy-MM-dd"),
  );
  const activityStatus = summary.isFutureWeek
    ? `${summary.activities.scheduled} scheduled`
    : [
        ...(summary.activities.skipped > 0
          ? [`${summary.activities.skipped} skipped`]
          : []),
        ...(summary.activities.due > 0
          ? [`${summary.activities.due} due`]
          : []),
        ...(summary.activities.upcoming > 0
          ? [`${summary.activities.upcoming} upcoming`]
          : []),
      ].join(" · ");

  return (
    <section aria-label="Weekly summary" className="grid gap-5 sm:grid-cols-3">
      <SummaryMetric
        completed={formatDistance(summary.completedDistanceMetres)}
        completedValue={summary.completedDistanceMetres}
        isFutureWeek={summary.isFutureWeek}
        label="Running distance"
        scheduled={formatDistance(summary.scheduledDistanceMetres)}
        scheduledValue={summary.scheduledDistanceMetres}
      />
      <SummaryMetric
        completed={formatWeeklySummaryDuration(
          summary.completedDurationSeconds,
        )}
        completedValue={summary.completedDurationSeconds}
        isFutureWeek={summary.isFutureWeek}
        label="Training time"
        scheduled={formatWeeklySummaryDuration(
          summary.scheduledDurationSeconds,
        )}
        scheduledValue={summary.scheduledDurationSeconds}
      />
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-600 uppercase">
          Activities
        </h2>
        <p className="text-2xl font-semibold text-zinc-950">
          {summary.isFutureWeek
            ? `${summary.activities.scheduled} scheduled`
            : `${summary.activities.completed} completed`}
        </p>
        {!summary.isFutureWeek && activityStatus ? (
          <p className="text-sm text-zinc-600">{activityStatus}</p>
        ) : null}
      </div>
    </section>
  );
}

function formatWeeklySummaryDuration(seconds: number) {
  return seconds === 0 ? "0m" : formatCompactDuration(seconds);
}
