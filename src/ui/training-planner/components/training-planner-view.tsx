"use client";

import type { TrainingSessionDateRange } from "@/domain/training-sessions";
import { Button } from "@/ui/components/button";
import type { TrainingSession } from "@/domain/training-sessions";
import { WeekGrid } from "./week-grid";
import { WeeklySummary } from "@/ui/weekly-summary/weekly-summary";
import { formatWeekRange } from "../services/training-planner-service";
import type {
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

type TrainingPlannerViewProps = {
  isCurrentWeek: boolean;
  onAddActivity?: (day: TrainingDay) => void;
  onCurrentWeek: () => void;
  onNextWeek: () => void;
  onPreviousWeek: () => void;
  onSelectActivity: (activity: TrainingActivity) => void;
  sessions: TrainingSession[];
  week: TrainingDay[];
  weekRange: TrainingSessionDateRange;
};

export function TrainingPlannerView({
  isCurrentWeek,
  onAddActivity,
  onCurrentWeek,
  onNextWeek,
  onPreviousWeek,
  onSelectActivity,
  sessions,
  week,
  weekRange,
}: TrainingPlannerViewProps) {
  return (
    <section
      aria-labelledby="training-planner-heading"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <h1
          id="training-planner-heading"
          className="text-3xl font-semibold text-zinc-950 sm:text-4xl"
        >
          Training Plan
        </h1>
      </div>

      <div className="flex flex-col gap-4">
        <nav
          aria-label="Week navigation"
          className="flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center">
            <Button
              aria-label="Previous week"
              className="text-lg font-semibold"
              onClick={onPreviousWeek}
              size="icon"
              type="button"
              variant="tertiary"
            >
              ‹
            </Button>
            <p
              aria-live="polite"
              className="px-3 py-2 text-sm font-medium text-zinc-800"
            >
              {formatWeekRange(weekRange)}
            </p>
            <Button
              aria-label="Next week"
              className="text-lg font-semibold text-zinc-600"
              onClick={onNextWeek}
              size="icon"
              type="button"
              variant="tertiary"
            >
              ›
            </Button>
          </div>
          {!isCurrentWeek ? (
            <Button
              onClick={onCurrentWeek}
              type="button"
              variant="tertiary"
            >
              Today
            </Button>
          ) : null}
        </nav>
        <WeeklySummary activities={sessions} weekRange={weekRange} />
        <WeekGrid
          onAddActivity={onAddActivity}
          onSelectActivity={onSelectActivity}
          week={week}
        />
      </div>
    </section>
  );
}
