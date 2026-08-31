import type { RunTrainingSession } from "@/domain/training-sessions";

type RunTargetMetrics = Readonly<{
  distance: boolean;
  duration: boolean;
  pace: boolean;
}>;

const runTargetMetricsByType = {
  DISTANCE_DURATION: { distance: true, duration: true, pace: false },
  DISTANCE_PACE: { distance: true, duration: false, pace: true },
  DURATION_PACE: { distance: false, duration: true, pace: true },
} satisfies Record<RunTrainingSession["targetType"], RunTargetMetrics>;

export function getRunTargetMetrics(
  targetType: RunTrainingSession["targetType"],
): RunTargetMetrics {
  return runTargetMetricsByType[targetType];
}
