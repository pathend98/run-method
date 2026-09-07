import { format } from "date-fns";

import type {
  TrainingSession,
  TrainingSessionDateRange,
} from "@/domain/training-sessions";
import {
  formatCompactDuration,
  formatDistance,
} from "@/ui/training-sessions/training-session-metric-formatters";
import { getWeeklySummary } from "../services/weekly-summary-service";
import { SummaryMetric } from "./summary-metric";

type WeeklySummaryProps = {
  sessions: TrainingSession[];
  today?: string;
  weekRange: TrainingSessionDateRange;
};

export function WeeklySummary({
  sessions,
  today = format(new Date(), "yyyy-MM-dd"),
  weekRange,
}: WeeklySummaryProps) {
  const summary = getWeeklySummary(sessions, weekRange, today);
  const activityStatus = summary.isFutureWeek
    ? `${summary.activities.scheduled} scheduled`
    : `${summary.activities.skipped} skipped · ${summary.activities.due} due${summary.activities.upcoming > 0 ? ` · ${summary.activities.upcoming} upcoming` : ""}`;

  return (
    <section aria-label="Weekly summary" className="grid gap-5 sm:grid-cols-3">
      <SummaryMetric
        completed={formatDistance(summary.completedDistanceMetres)}
        isFutureWeek={summary.isFutureWeek}
        label="Running distance"
        scheduled={formatDistance(summary.scheduledDistanceMetres)}
      />
      <SummaryMetric
        completed={formatCompactDuration(summary.completedDurationSeconds)}
        isFutureWeek={summary.isFutureWeek}
        label="Training time"
        scheduled={formatCompactDuration(summary.scheduledDurationSeconds)}
      />
      <div className="flex flex-col gap-1">
        <h2 className="text-xs font-semibold tracking-wide text-zinc-600 uppercase">
          Activities
        </h2>
        {!summary.isFutureWeek ? (
          <p className="text-sm text-zinc-950">
            {summary.activities.completed} completed
          </p>
        ) : null}
        <p className="text-sm text-zinc-600">{activityStatus}</p>
      </div>
    </section>
  );
}
