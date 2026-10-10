import { format } from "date-fns";

import type {
  TrainingSession,
  TrainingSessionDateRange,
} from "@/domain/training-sessions";
import { formatDistance } from "@/ui/shared/running-metric-formatters";
import { formatCompactDuration } from "@/ui/shared/duration-formatters";
import { SummaryMetric } from "./presentation/summary-metric";
import { getWeeklySummary } from "./calculation/weekly-summary";
import {
  formatDistanceVariance,
  formatDurationVariance,
} from "./formatters/summary-variance";
import { useDistanceDisplayUnit } from "@/ui/users/measurement-unit-context";

type WeeklySummaryProps = {
  trainingSessions: TrainingSession[];
  className?: string;
  weekRange: TrainingSessionDateRange;
};

export function WeeklySummary({
  trainingSessions,
  className,
  weekRange,
}: WeeklySummaryProps) {
  const measurementUnit = useDistanceDisplayUnit();
  const summary = getWeeklySummary(
    trainingSessions,
    weekRange,
    format(new Date(), "yyyy-MM-dd"),
  );
  const trainingSessionStatus = summary.isFutureWeek
    ? `${summary.trainingSessions.scheduled} scheduled`
    : [
        ...(summary.trainingSessions.skipped > 0
          ? [`${summary.trainingSessions.skipped} skipped`]
          : []),
        ...(summary.trainingSessions.due > 0
          ? [`${summary.trainingSessions.due} due`]
          : []),
        ...(summary.trainingSessions.upcoming > 0
          ? [`${summary.trainingSessions.upcoming} upcoming`]
          : []),
      ].join(" · ");
  const primaryTrainingSessionStatus = summary.isFutureWeek
    ? `${summary.trainingSessions.scheduled} scheduled`
    : `${summary.trainingSessions.completed} completed`;

  return (
    <section
      aria-label="Weekly summary"
      className={`grid grid-cols-2 gap-5 sm:grid-cols-3${className ? ` ${className}` : ""}`}
    >
      <SummaryMetric
        completed={formatDistance(
          summary.completedDistanceMetres,
          measurementUnit,
        )}
        completedValue={summary.completedDistanceMetres}
        isFutureWeek={summary.isFutureWeek}
        isPastWeek={summary.isPastWeek}
        label="Running distance"
        scheduled={formatDistance(
          summary.scheduledDistanceMetres,
          measurementUnit,
        )}
        scheduledValue={summary.scheduledDistanceMetres}
        variance={
          summary.isPastWeek
            ? formatDistanceVariance(
                summary.completedDistanceMetres -
                  summary.scheduledDistanceMetres,
                measurementUnit,
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
          Training sessions
        </h2>
        <div className="flex flex-wrap items-baseline gap-1 sm:block">
          <p className="text-sm font-medium text-zinc-950 sm:text-2xl sm:font-semibold">
            {primaryTrainingSessionStatus}
          </p>
          {!summary.isFutureWeek && trainingSessionStatus ? (
            <p className="text-sm text-zinc-600">
              <span aria-hidden="true" className="mr-1 sm:hidden">
                ·
              </span>
              {trainingSessionStatus}
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
