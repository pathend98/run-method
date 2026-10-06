import { useDraggable } from "@dnd-kit/react";
import { TrainingSessionCard } from "./training-session-card";
import type { TrainingSession } from "@/domain/training-sessions";

type DraggableTrainingSessionCardProps = {
  trainingSession: TrainingSession;
  onSelect: () => void;
};

export function DraggableTrainingSessionCard({
  trainingSession,
  onSelect,
}: DraggableTrainingSessionCardProps) {
  const { isDragSource, ref } = useDraggable({
    data: { trainingSession },
    disabled: trainingSession.status !== "SCHEDULED",
    id: trainingSession.id,
    type: "training-session",
  });

  return (
    <div className={isDragSource ? "opacity-40" : undefined} ref={ref}>
      <TrainingSessionCard
        trainingSession={trainingSession}
        className={
          trainingSession.status === "SCHEDULED" ? "!cursor-grab" : undefined
        }
        onSelect={onSelect}
      />
    </div>
  );
}
