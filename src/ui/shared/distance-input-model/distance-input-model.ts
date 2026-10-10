import {
  RunningMetrics,
  type RunningMetricUnit,
} from "@/domain/running-metrics";

export function formatDistanceInput(metres: number, unit: RunningMetricUnit) {
  return String(
    Number(new RunningMetrics(unit).distanceInUnit(metres).toFixed(3)),
  );
}

export function readDistanceInput(
  distance: string,
  unit: RunningMetricUnit,
  originalMetres?: number,
) {
  if (
    originalMetres !== undefined &&
    distance === formatDistanceInput(originalMetres, unit)
  ) {
    return originalMetres;
  }
  return new RunningMetrics(unit).distanceInMetres(Number(distance));
}
