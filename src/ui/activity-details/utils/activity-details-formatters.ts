import type { TrainingSession } from "@/domain/training-sessions";

export function formatActivityType(
  activityType: TrainingSession["activityType"],
) {
  return activityType === "RUN" ? "Run" : "Strength";
}

export function formatStatus(status: TrainingSession["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function formatTargetType(targetType: string) {
  return targetType
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" + ");
}

export function formatDistance(metres: number | null) {
  return metres === null ? null : `${(metres / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return null;
  }

  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

export function formatPace(secondsPerKilometre: number | null) {
  if (secondsPerKilometre === null) {
    return null;
  }

  const minutes = Math.floor(secondsPerKilometre / 60);
  const seconds = String(secondsPerKilometre % 60).padStart(2, "0");
  return `${minutes}:${seconds} / km`;
}
