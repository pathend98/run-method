export type RunFieldMetric = "distance" | "duration" | "pace";

export type RunFieldInputValue = {
  distanceKilometres: string;
  durationHours: string;
  durationMinutes: string;
  durationSeconds: string;
  pacePerKilometre: string;
  derivedMetric: RunFieldMetric | null;
};

const metrics: RunFieldMetric[] = ["distance", "duration", "pace"];

export function isValidRunMetric(
  metric: RunFieldMetric,
  value: RunFieldInputValue,
) {
  return metricValueInBaseUnits(metric, value) !== null;
}

export function calculateDerivedMetric(
  value: RunFieldInputValue,
  derivedMetric: RunFieldMetric,
): RunFieldInputValue | null {
  const distanceMetres = metricValueInBaseUnits("distance", value);
  const durationSeconds = metricValueInBaseUnits("duration", value);
  const paceSeconds = metricValueInBaseUnits("pace", value);

  if (derivedMetric === "pace" && distanceMetres && durationSeconds) {
    const calculatedPace = Math.max(
      1,
      Math.round((durationSeconds * 1000) / distanceMetres),
    );
    return {
      ...value,
      pacePerKilometre: formatPace(calculatedPace),
      derivedMetric,
    };
  }

  if (derivedMetric === "duration" && distanceMetres && paceSeconds) {
    const calculatedDuration = Math.max(
      1,
      Math.round((distanceMetres * paceSeconds) / 1000),
    );
    return {
      ...value,
      ...formatDuration(calculatedDuration),
      derivedMetric,
    };
  }

  if (derivedMetric === "distance" && durationSeconds && paceSeconds) {
    const calculatedDistance = Math.max(
      1,
      Math.round((durationSeconds * 1000) / paceSeconds),
    );
    return {
      ...value,
      distanceKilometres: String(calculatedDistance / 1000),
      derivedMetric,
    };
  }

  return null;
}

export function clearMetric(
  value: RunFieldInputValue,
  metric: RunFieldMetric,
): RunFieldInputValue {
  if (metric === "distance") return { ...value, distanceKilometres: "" };
  if (metric === "pace") return { ...value, pacePerKilometre: "" };
  return {
    ...value,
    durationHours: "",
    durationMinutes: "",
    durationSeconds: "",
  };
}

export function otherMetric(
  first: RunFieldMetric,
  second: RunFieldMetric,
): RunFieldMetric {
  return metrics.find((metric) => metric !== first && metric !== second)!;
}

export function metricLabel(metric: RunFieldMetric) {
  return {
    distance: "distance",
    duration: "duration",
    pace: "pace",
  }[metric];
}

function metricValueInBaseUnits(
  metric: RunFieldMetric,
  value: RunFieldInputValue,
): number | null {
  if (metric === "distance") {
    if (!/^\d+(?:\.\d{1,3})?$/.test(value.distanceKilometres)) return null;
    const metres = Number(value.distanceKilometres) * 1000;
    return metres > 0 ? metres : null;
  }

  if (metric === "pace") {
    if (!/^\d+:[0-5]\d$/.test(value.pacePerKilometre)) return null;
    const [minutes, seconds] = value.pacePerKilometre.split(":").map(Number);
    const total = minutes * 60 + seconds;
    return total > 0 ? total : null;
  }

  const parts = [
    value.durationHours,
    value.durationMinutes,
    value.durationSeconds,
  ];
  if (!parts.every((part) => /^\d+$/.test(part))) return null;
  const [hours, minutes, seconds] = parts.map(Number);
  if (minutes > 59 || seconds > 59) return null;
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : null;
}

function formatPace(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatDuration(seconds: number) {
  return {
    durationHours: String(Math.floor(seconds / 3600)).padStart(2, "0"),
    durationMinutes: String(Math.floor((seconds % 3600) / 60)).padStart(2, "0"),
    durationSeconds: String(seconds % 60).padStart(2, "0"),
  };
}
