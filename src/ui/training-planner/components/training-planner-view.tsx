"use client";

import { useState } from "react";

import type { CreateTrainingSessionRequest } from "@/domain/training-sessions";
import { ActivityDetailsModal } from "@/ui/activity-details/activity-details-modal";
import { AddActivityModal } from "@/ui/add-activity/add-activity-modal";
import { WeekGrid } from "./week-grid";
import type {
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

type TrainingPlannerViewProps = {
  isCreatingActivity?: boolean;
  onCreateActivity?: (
    request: CreateTrainingSessionRequest,
  ) => Promise<unknown>;
  week: TrainingDay[];
};

export function TrainingPlannerView({
  isCreatingActivity = false,
  onCreateActivity = async () => undefined,
  week,
}: TrainingPlannerViewProps) {
  const [selectedActivity, setSelectedActivity] =
    useState<TrainingActivity | null>(null);
  const [selectedDay, setSelectedDay] = useState<TrainingDay | null>(null);

  return (
    <section
      aria-labelledby="training-planner-heading"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          Weekly schedule
        </p>
        <h1
          id="training-planner-heading"
          className="text-3xl font-semibold text-zinc-950 sm:text-4xl"
        >
          Training planner
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-zinc-600">
          A simple week view for arranging runs, workouts, recovery, and rest
          across morning, flexible, and evening slots.
        </p>
      </div>

      <div>
        <WeekGrid
          onAddActivity={setSelectedDay}
          onSelectActivity={setSelectedActivity}
          week={week}
        />
        {selectedActivity ? (
          <ActivityDetailsModal
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
          />
        ) : null}
        {selectedDay?.date ? (
          <AddActivityModal
            day={{ ...selectedDay, date: selectedDay.date }}
            isSubmitting={isCreatingActivity}
            onClose={() => setSelectedDay(null)}
            onCreate={onCreateActivity}
          />
        ) : null}
      </div>
    </section>
  );
}
