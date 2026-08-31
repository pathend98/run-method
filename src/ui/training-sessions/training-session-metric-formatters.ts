export function formatDistance(metres: number | null) {
  return metres === null ? null : `${(metres / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return null;
  }

  return `${Math.round(seconds / 60)} min`;
}

export function formatPace(
  secondsPerKilometre: number,
  options?: { includeUnit?: boolean },
): string;
export function formatPace(
  secondsPerKilometre: number | null,
  options?: { includeUnit?: boolean },
): string | null;
export function formatPace(
  secondsPerKilometre: number | null,
  options: { includeUnit?: boolean } = {},
) {
  if (secondsPerKilometre === null) {
    return null;
  }

  const minutes = Math.floor(secondsPerKilometre / 60);
  const seconds = String(secondsPerKilometre % 60).padStart(2, "0");
  const pace = `${minutes}:${seconds}`;

  return options.includeUnit === false ? pace : `${pace} / km`;
}
