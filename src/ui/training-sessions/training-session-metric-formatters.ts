export function formatDistance(metres: number | null) {
  return metres === null ? null : `${(metres / 1000).toFixed(1)} km`;
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
