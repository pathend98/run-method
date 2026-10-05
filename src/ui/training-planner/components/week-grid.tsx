"use client";

import { DragDropProvider, DragOverlay, PointerSensor } from "@dnd-kit/react";
import { PointerActivationConstraints, type DragEndEvent } from "@dnd-kit/dom";
import { useState } from "react";
import { DayColumn } from "./day-column";
import { MobileWeekView } from "./mobile-week-view";
import { TrainingActivityCard } from "./training-activity-card";
import { format } from "date-fns";
import type {
  TrainingActivity,
  TrainingDay,
} from "../types/training-planner-types";
import type { TrainingSessionMoveDestination } from "@/ui/training-sessions/move-training-session/create-move-training-session-request";

type WeekGridProps = {
  onAddActivity?: (day: TrainingDay) => void;
  onMoveActivity?: (
    activity: TrainingActivity,
    destination: TrainingSessionMoveDestination,
  ) => Promise<void>;
  onSelectActivity: (activity: TrainingActivity) => void;
  week: TrainingDay[];
};

export function WeekGrid({
  onAddActivity,
  onMoveActivity,
  onSelectActivity,
  week,
}: WeekGridProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const activeActivity = week
    .flatMap((day) => day.activities)
    .find((activity) => activity.id === activeActivityId);
  const isDragActive = activeActivity !== undefined;

  function clearActiveActivity() {
    setActiveActivityId(null);
  }

  function handleDragEnd({ canceled, operation }: DragEndEvent) {
    clearActiveActivity();

    const activity = operation.source?.data.activity as
      TrainingActivity | undefined;
    const destination = operation.target?.data as
      TrainingSessionMoveDestination | undefined;

    if (
      canceled ||
      !activity ||
      !destination ||
      activity.status !== "SCHEDULED" ||
      (activity.date === destination.date &&
        activity.timeOfDay === destination.timeOfDay) ||
      !onMoveActivity
    ) {
      return;
    }

    void onMoveActivity(activity, destination).catch(() => undefined);
  }

  return (
    <>
      <MobileWeekView
        key={week.map((day) => day.date ?? day.day).join("|")}
        onAddActivity={onAddActivity}
        onSelectActivity={onSelectActivity}
        week={week}
      />
      <DragDropProvider
        onDragEnd={handleDragEnd}
        onDragStart={({ operation }) => {
          setActiveActivityId(String(operation.source!.id));
        }}
        sensors={[
          PointerSensor.configure({
            activationConstraints: [
              new PointerActivationConstraints.Distance({ value: 8 }),
            ],
            preventActivation: (event) => event.pointerType !== "mouse",
          }),
        ]}
      >
        <div
          aria-label="Weekly training planner"
          className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 min-[1155px]:block"
          role="list"
        >
          <div
            className={`grid min-w-[56rem] grid-cols-7 ${
              isDragActive ? "divide-x-0" : "divide-x divide-zinc-200"
            }`}
          >
            {week.map((day, index) => (
              <DayColumn
                key={day.day}
                day={day}
                hasLeadingDay={index > 0}
                isDragActive={isDragActive}
                isDragAndDropEnabled
                isToday={day.date === today}
                onAddActivity={onAddActivity}
                onSelectActivity={onSelectActivity}
              />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeActivity ? (
            <div aria-hidden="true" className="pointer-events-none w-64" inert>
              <TrainingActivityCard activity={activeActivity} />
            </div>
          ) : null}
        </DragOverlay>
      </DragDropProvider>
    </>
  );
}
