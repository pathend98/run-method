import type { User } from "@/domain/user-types";
import { RunningMetrics } from "@/domain/running-metrics";

export function formatDistance(
  metres: number | null,
  measurementUnit: User["measurementUnit"],
  options: { decimalPlaces?: 1 | 2 } = {},
) {
  if (metres === null) {
    return null;
  }

  const distance = new RunningMetrics(measurementUnit).distanceInUnit(metres);
  const unitLabel = measurementUnit === "MILES" ? "mi" : "km";
  return `${distance.toFixed(options.decimalPlaces ?? 2)} ${unitLabel}`;
}

export function formatPace(
  secondsPerKilometre: number,
  measurementUnit: User["measurementUnit"],
  options?: { includeUnit?: boolean },
): string;
export function formatPace(
  secondsPerKilometre: number | null,
  measurementUnit: User["measurementUnit"],
  options?: { includeUnit?: boolean },
): string | null;
export function formatPace(
  secondsPerKilometre: number | null,
  measurementUnit: User["measurementUnit"],
  options: { includeUnit?: boolean } = {},
) {
  if (secondsPerKilometre === null) {
    return null;
  }

  const paceSeconds = new RunningMetrics(measurementUnit).paceInUnit(
    secondsPerKilometre,
  );
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = String(paceSeconds % 60).padStart(2, "0");
  const pace = `${minutes}:${seconds}`;

  return options.includeUnit === false
    ? pace
    : `${pace} / ${measurementUnit === "MILES" ? "mi" : "km"}`;
}
