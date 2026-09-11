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
import {
  formatDistanceVariance,
  formatDurationVariance,
} from "./utils/summary-variance";

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
  const primaryActivityStatus = summary.isFutureWeek
    ? `${summary.activities.scheduled} scheduled`
    : `${summary.activities.completed} completed`;

  return (
    <section
      aria-label="Weekly summary"
      className="grid grid-cols-2 gap-5 sm:grid-cols-3"
    >
      <SummaryMetric
        completed={formatDistance(summary.completedDistanceMetres)}
        completedValue={summary.completedDistanceMetres}
        isFutureWeek={summary.isFutureWeek}
        isPastWeek={summary.isPastWeek}
        label="Running distance"
        scheduled={formatDistance(summary.scheduledDistanceMetres)}
        scheduledValue={summary.scheduledDistanceMetres}
        variance={
          summary.isPastWeek
            ? formatDistanceVariance(
                summary.completedDistanceMetres -
                  summary.scheduledDistanceMetres,
              )
            : null
        }
      />
      <SummaryMetric
        completed={formatWeeklySummaryDuration(
          summary.completedDurationSeconds,
        )}
        completedValue={summary.completedDurationSeconds}
        isFutureWeek={summary.isFutureWeek}
        isPastWeek={summary.isPastWeek}
        label="Training time"
        scheduled={formatWeeklySummaryDuration(
          summary.scheduledDurationSeconds,
        )}
        scheduledValue={summary.scheduledDurationSeconds}
        variance={
          summary.isPastWeek
            ? formatDurationVariance(
                summary.completedDurationSeconds -
                  summary.scheduledDurationSeconds,
              )
            : null
        }
      />
      <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-600 uppercase">
          Activities
        </h2>
        <div className="flex flex-wrap items-baseline gap-1 sm:block">
          <p className="text-sm font-medium text-zinc-950 sm:text-2xl sm:font-semibold">
            {primaryActivityStatus}
          </p>
          {!summary.isFutureWeek && activityStatus ? (
            <p className="text-sm text-zinc-600">
              <span aria-hidden="true" className="mr-1 sm:hidden">
                ·
              </span>
              {activityStatus}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function formatWeeklySummaryDuration(seconds: number) {
  return seconds === 0 ? "0m" : formatCompactDuration(seconds);
}
