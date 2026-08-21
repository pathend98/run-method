import type { TrainingActivity } from "./types";

export function formatActivityType(
  activityType: TrainingActivity["activityType"],
) {
  return activityType === "RUN" ? "Run" : "Strength";
}

export function formatStatus(status: TrainingActivity["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function formatTargetType(targetType: string) {
  return targetType
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" + ");
}

export function formatDistance(metres: number | null) {
  return metres === null ? "None" : `${(metres / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return "None";
  }

  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

export function formatPace(secondsPerKilometre: number | null) {
  if (secondsPerKilometre === null) {
    return "None";
  }

  const minutes = Math.floor(secondsPerKilometre / 60);
  const seconds = String(secondsPerKilometre % 60).padStart(2, "0");
  return `${minutes}:${seconds} / km`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}
