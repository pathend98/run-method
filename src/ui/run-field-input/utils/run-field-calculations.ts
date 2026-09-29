import {
  distanceToMetres,
  formatDistanceInput,
  formatPaceInput,
  metresPerUnit,
  type RunFieldUnit,
} from "../run-field-units";

export type RunFieldMetric = "distance" | "duration" | "pace";

export type RunFieldInputValue = {
  distance: string;
  durationHours: string;
  durationMinutes: string;
  durationSeconds: string;
  pace: string;
  derivedMetric: RunFieldMetric | null;
};

const metrics: RunFieldMetric[] = ["distance", "duration", "pace"];

export function isValidRunMetric(
  metric: RunFieldMetric,
  value: RunFieldInputValue,
  unit: RunFieldUnit,
) {
  return metricValueInBaseUnits(metric, value, unit) !== null;
}

export function calculateDerivedMetric(
  value: RunFieldInputValue,
  derivedMetric: RunFieldMetric,
  unit: RunFieldUnit,
): RunFieldInputValue | null {
  const distanceMetres = metricValueInBaseUnits("distance", value, unit);
  const durationSeconds = metricValueInBaseUnits("duration", value, unit);
  const paceSeconds = metricValueInBaseUnits("pace", value, unit);

  if (derivedMetric === "pace" && distanceMetres && durationSeconds) {
    const calculatedPace = Math.max(
      1,
      Math.round((durationSeconds * metresPerUnit(unit)) / distanceMetres),
    );
    return {
      ...value,
      pace: formatPaceInput(calculatedPace),
      derivedMetric,
    };
  }

  if (derivedMetric === "duration" && distanceMetres && paceSeconds) {
    const calculatedDuration = Math.max(
      1,
      Math.round((distanceMetres * paceSeconds) / metresPerUnit(unit)),
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
      Math.round((durationSeconds * metresPerUnit(unit)) / paceSeconds),
    );
    return {
      ...value,
      distance: formatDistanceInput(calculatedDistance, unit),
      derivedMetric,
    };
  }

  return null;
}

export function clearMetric(
  value: RunFieldInputValue,
  metric: RunFieldMetric,
): RunFieldInputValue {
  if (metric === "distance") return { ...value, distance: "" };
  if (metric === "pace") return { ...value, pace: "" };
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
  unit: RunFieldUnit,
): number | null {
  if (metric === "distance") {
    if (!/^\d+(?:\.\d{1,3})?$/.test(value.distance)) return null;
    const metres = distanceToMetres(value.distance, unit);
    return metres > 0 ? metres : null;
  }

  if (metric === "pace") {
    if (!/^\d+:[0-5]\d$/.test(value.pace)) return null;
    const [minutes, seconds] = value.pace.split(":").map(Number);
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

function formatDuration(seconds: number) {
  return {
    durationHours: String(Math.floor(seconds / 3600)).padStart(2, "0"),
    durationMinutes: String(Math.floor((seconds % 3600) / 60)).padStart(2, "0"),
    durationSeconds: String(seconds % 60).padStart(2, "0"),
  };
}
