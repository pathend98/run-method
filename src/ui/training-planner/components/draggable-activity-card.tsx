import { useDraggable } from "@dnd-kit/react";
import { TrainingActivityCard } from "./training-activity-card";
import type { TrainingActivity } from "../types/training-planner-types";

type DraggableActivityCardProps = {
  activity: TrainingActivity;
  onSelect: () => void;
};

export function DraggableActivityCard({
  activity,
  onSelect,
}: DraggableActivityCardProps) {
  const { isDragSource, ref } = useDraggable({
    data: { activity },
    id: activity.id,
    type: "training-activity",
  });

  return (
    <div className={isDragSource ? "opacity-40" : undefined} ref={ref}>
      <TrainingActivityCard activity={activity} onSelect={onSelect} />
    </div>
  );
}
