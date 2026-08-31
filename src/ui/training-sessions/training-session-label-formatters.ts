import type {
  RunTrainingSession,
  TrainingSession,
} from "@/domain/training-sessions";

export function formatActivityType(
  activityType: TrainingSession["activityType"],
) {
  return activityType === "RUN" ? "Run" : "Strength";
}

export function formatStatus(status: TrainingSession["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function formatTargetType(targetType: RunTrainingSession["targetType"]) {
  return targetType
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" + ");
}
