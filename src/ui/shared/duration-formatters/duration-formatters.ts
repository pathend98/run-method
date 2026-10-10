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
