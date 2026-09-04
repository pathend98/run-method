"use client";

import type { TrainingSessionDateRange } from "@/domain/training-sessions";
import { WeekGrid } from "./week-grid";
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
        <p aria-live="polite" className="text-lg font-semibold text-zinc-900">
          {formatWeekRange(weekRange)}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav
            aria-label="Week navigation"
            className="flex flex-wrap items-center gap-2"
          >
            <button
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              onClick={onPreviousWeek}
              type="button"
            >
              Previous week
            </button>
            {!isCurrentWeek ? (
              <button
                className="rounded-md border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                onClick={onCurrentWeek}
                type="button"
              >
                Current week
              </button>
            ) : null}
            <button
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              onClick={onNextWeek}
              type="button"
            >
              Next week
            </button>
          </nav>
        </div>
        <WeekGrid
          onAddActivity={onAddActivity}
          onSelectActivity={onSelectActivity}
          week={week}
        />
      </div>
    </section>
  );
}
