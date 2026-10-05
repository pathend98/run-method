"use client";

import type { TrainingSessionDateRange } from "@/domain/training-sessions";
import { Button } from "@/ui/shared/button/button";
import { PastTrainingSessionsAttentionPanel } from "@/ui/training-sessions/past-training-sessions-attention/past-training-sessions-attention-panel";
import type { TrainingSession } from "@/domain/training-sessions";
import { WeekGrid } from "./week-grid";
import { WeeklySummary } from "@/ui/weekly-summary/weekly-summary";
import { formatWeekRange } from "../services/training-planner-service";
import type {
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";
import type { TrainingSessionMoveDestination } from "@/ui/training-sessions/move-training-session/create-move-training-session-request";

type TrainingPlannerViewProps = {
  isCurrentWeek: boolean;
  onAddActivity?: (day: TrainingDay) => void;
  onCurrentWeek: () => void;
  onMoveActivity: (
    activity: TrainingActivity,
    destination: TrainingSessionMoveDestination,
  ) => Promise<void>;
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
  onMoveActivity,
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
      <h1
        id="training-planner-heading"
        className="text-2xl font-semibold text-zinc-950 sm:text-4xl"
      >
        Training Plan
      </h1>

      <div className="flex flex-col">
        <nav
          aria-label="Week navigation"
          className="mb-6 grid w-full grid-cols-[2.25rem_minmax(0,1fr)_2.25rem_auto] items-center gap-2 sm:flex sm:flex-wrap sm:gap-3"
        >
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
            className="px-1 py-2 text-center text-sm font-medium text-zinc-800 sm:px-3"
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
          <Button
            className={isCurrentWeek ? "sm:hidden" : undefined}
            disabled={isCurrentWeek}
            onClick={onCurrentWeek}
            type="button"
            variant="tertiary"
          >
            Today
          </Button>
        </nav>
        <WeeklySummary
          activities={sessions}
          className="mb-8"
          weekRange={weekRange}
        />
        <PastTrainingSessionsAttentionPanel className="mb-8" />
        <WeekGrid
          onAddActivity={onAddActivity}
          onMoveActivity={onMoveActivity}
          onSelectActivity={onSelectActivity}
          week={week}
        />
      </div>
    </section>
  );
}
