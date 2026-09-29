import type { User } from "@/domain/user-types";

export function formatDistance(
  metres: number | null,
  measurementUnit: User["measurementUnit"],
  options: { decimalPlaces?: 1 | 2 } = {},
) {
  if (metres === null) {
    return null;
  }

  const metresPerUnit = measurementUnit === "MILES" ? 1609.344 : 1000;
  const unitLabel = measurementUnit === "MILES" ? "mi" : "km";
  return `${(metres / metresPerUnit).toFixed(options.decimalPlaces ?? 2)} ${unitLabel}`;
}

export function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return null;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return (
    [
      hours > 0 ? `${hours}h` : null,
      minutes > 0 ? `${minutes}m` : null,
      remainingSeconds > 0 ? `${remainingSeconds}s` : null,
    ]
      .filter((part): part is string => part !== null)
      .join(" ") || "0s"
  );
}

export function formatCompactDuration(seconds: number | null) {
  if (seconds === null) {
    return null;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return (
    [
      hours > 0 ? `${hours}h` : null,
      minutes > 0 ? `${minutes}m` : null,
      hours === 0 && remainingSeconds > 0 ? `${remainingSeconds}s` : null,
    ]
      .filter((part): part is string => part !== null)
      .join(" ") || "0s"
  );
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

  const paceSeconds =
    measurementUnit === "MILES"
      ? Math.round(secondsPerKilometre * 1.609344)
      : secondsPerKilometre;
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = String(paceSeconds % 60).padStart(2, "0");
  const pace = `${minutes}:${seconds}`;

  return options.includeUnit === false
    ? pace
    : `${pace} / ${measurementUnit === "MILES" ? "mi" : "km"}`;
}
