"use client";

import { useState } from "react";

import type {
  CreateTrainingSessionRequest,
  EditTrainingSessionRequest,
  TrainingSession,
  TrainingSessionDateRange,
} from "@/domain/training-sessions";
import { ActivityDetailsModal } from "@/ui/activity-details/activity-details-modal";
import { AddActivityModal } from "@/ui/add-activity/add-activity-modal";
import { EditActivityModal } from "@/ui/edit-activity/edit-activity-modal";
import { WeekGrid } from "./week-grid";
import { formatWeekRange } from "../services/training-planner-service";
import type {
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";

type TrainingPlannerViewProps = {
  isCurrentWeek: boolean;
  isCreatingActivity?: boolean;
  isDeletingActivity?: boolean;
  isEditingActivity?: boolean;
  onCreateActivity?: (
    request: CreateTrainingSessionRequest,
  ) => Promise<unknown>;
  onCurrentWeek: () => void;
  onDeleteActivity?: (id: string) => Promise<unknown>;
  onEditActivity?: (
    id: string,
    request: EditTrainingSessionRequest,
  ) => Promise<TrainingSession>;
  onNextWeek: () => void;
  onPreviousWeek: () => void;
  week: TrainingDay[];
  weekRange: TrainingSessionDateRange;
};

export function TrainingPlannerView({
  isCurrentWeek,
  isCreatingActivity = false,
  isDeletingActivity = false,
  isEditingActivity = false,
  onCreateActivity = async () => undefined,
  onCurrentWeek,
  onDeleteActivity = async () => undefined,
  onEditActivity,
  onNextWeek,
  onPreviousWeek,
  week,
  weekRange,
}: TrainingPlannerViewProps) {
  const [selectedActivity, setSelectedActivity] =
    useState<TrainingActivity | null>(null);
  const [selectedDay, setSelectedDay] = useState<TrainingDay | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  async function editSelectedActivity(
    activity: TrainingActivity,
    request: EditTrainingSessionRequest,
  ) {
    const editedActivity = onEditActivity
      ? await onEditActivity(activity.id, request)
      : ({ ...activity, ...request } as TrainingSession);
    setSelectedActivity({ ...editedActivity, day: activity.day });
  }

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

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-lg font-semibold text-zinc-900">
            {formatWeekRange(weekRange)}
          </p>
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
          onAddActivity={setSelectedDay}
          onSelectActivity={setSelectedActivity}
          week={week}
        />
        {selectedActivity && !isEditModalOpen ? (
          <ActivityDetailsModal
            activity={selectedActivity}
            isDeleting={isDeletingActivity}
            onClose={() => {
              setSelectedActivity(null);
              setIsEditModalOpen(false);
            }}
            onDelete={() => onDeleteActivity(selectedActivity.id)}
            onEdit={() => setIsEditModalOpen(true)}
          />
        ) : null}
        {selectedActivity && isEditModalOpen ? (
          <EditActivityModal
            activity={selectedActivity}
            isSubmitting={isEditingActivity}
            onClose={() => setIsEditModalOpen(false)}
            onEdit={(request) =>
              editSelectedActivity(selectedActivity, request)
            }
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
