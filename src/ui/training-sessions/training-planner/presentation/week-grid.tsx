"use client";

import { DragDropProvider, DragOverlay, PointerSensor } from "@dnd-kit/react";
import { PointerActivationConstraints, type DragEndEvent } from "@dnd-kit/dom";
import { useState } from "react";
import { DayColumn } from "./day-column";
import { MobileWeekView } from "./mobile-week-view";
import { TrainingSessionCard } from "./training-session-card";
import { format } from "date-fns";
import type {
  PlannerTrainingSession,
  TrainingDay,
} from "../calendar/training-calendar-types";
import type { TrainingSessionMoveDestination } from "@/ui/training-sessions/move-training-session";

type WeekGridProps = {
  onAddTrainingSession?: (day: TrainingDay) => void;
  onMoveTrainingSession?: (
    trainingSession: PlannerTrainingSession,
    destination: TrainingSessionMoveDestination,
  ) => Promise<void>;
  onSelectTrainingSession: (trainingSession: PlannerTrainingSession) => void;
  week: TrainingDay[];
};

export function WeekGrid({
  onAddTrainingSession,
  onMoveTrainingSession,
  onSelectTrainingSession,
  week,
}: WeekGridProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [activeTrainingSessionId, setActiveTrainingSessionId] = useState<
    string | null
  >(null);
  const activeTrainingSession = week
    .flatMap((day) => day.trainingSessions)
    .find((trainingSession) => trainingSession.id === activeTrainingSessionId);
  const isDragActive = activeTrainingSession !== undefined;

  function clearActiveTrainingSession() {
    setActiveTrainingSessionId(null);
  }

  function handleDragEnd({ canceled, operation }: DragEndEvent) {
    clearActiveTrainingSession();

    const trainingSession = operation.source?.data.trainingSession as
      PlannerTrainingSession | undefined;
    const destination = operation.target?.data as
      TrainingSessionMoveDestination | undefined;

    if (
      canceled ||
      !trainingSession ||
      !destination ||
      trainingSession.status !== "SCHEDULED" ||
      (trainingSession.date === destination.date &&
        trainingSession.timeOfDay === destination.timeOfDay) ||
      !onMoveTrainingSession
    ) {
      return;
    }

    void onMoveTrainingSession(trainingSession, destination).catch(
      () => undefined,
    );
  }

  return (
    <>
      <MobileWeekView
        key={week.map((day) => day.date ?? day.day).join("|")}
        onAddTrainingSession={onAddTrainingSession}
        onSelectTrainingSession={onSelectTrainingSession}
        week={week}
      />
      <DragDropProvider
        onDragEnd={handleDragEnd}
        onDragStart={({ operation }) => {
          setActiveTrainingSessionId(String(operation.source!.id));
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
                onAddTrainingSession={onAddTrainingSession}
                onSelectTrainingSession={onSelectTrainingSession}
              />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTrainingSession ? (
            <div aria-hidden="true" className="pointer-events-none w-64" inert>
              <TrainingSessionCard trainingSession={activeTrainingSession} />
            </div>
          ) : null}
        </DragOverlay>
      </DragDropProvider>
    </>
  );
}
