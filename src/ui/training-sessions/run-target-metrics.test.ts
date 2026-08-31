import { getRunTargetMetrics } from "./run-target-metrics";

test.each([
  [
    "DISTANCE_DURATION",
    { distance: true, duration: true, pace: false },
  ],
  ["DISTANCE_PACE", { distance: true, duration: false, pace: true }],
  ["DURATION_PACE", { distance: false, duration: true, pace: true }],
] as const)("selects metrics for %s", (targetType, expected) => {
  expect(getRunTargetMetrics(targetType)).toEqual(expected);
});
