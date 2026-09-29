import type { User } from "@/domain/user-types";
import { formatDistance } from "@/ui/training-sessions/training-session-metric-formatters";

export function formatDistanceVariance(
  metres: number,
  measurementUnit: User["measurementUnit"],
) {
  if (metres === 0) {
    return null;
  }

  return `${getVarianceSign(metres)}${formatDistance(Math.abs(metres), measurementUnit, { decimalPlaces: 1 })}`;
}

export function formatDurationVariance(seconds: number) {
  const minutes = Math.round(Math.abs(seconds) / 60);

  if (minutes === 0) {
    return null;
  }

  return `${getVarianceSign(seconds)}${minutes} min`;
}

function getVarianceSign(value: number) {
  return value > 0 ? "+" : "−";
}
