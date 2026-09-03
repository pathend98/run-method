import type { TrainingSession } from "@/domain/training-sessions";

export function formatActivityType(
  activityType: TrainingSession["activityType"],
) {
  return activityType === "RUN" ? "Run" : "Strength";
}

export function formatStatus(status: TrainingSession["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
