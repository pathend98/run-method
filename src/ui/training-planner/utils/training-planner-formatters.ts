import type { TrainingActivity } from "../types/training-planner-types";

export function formatActivityType(
  activityType: TrainingActivity["activityType"],
) {
  return activityType === "RUN" ? "Run" : "Strength";
}
