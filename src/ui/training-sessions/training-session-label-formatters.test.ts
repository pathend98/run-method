import {
  formatActivityType,
  formatStatus,
  formatTargetType,
} from "./training-session-label-formatters";

test.each([
  ["RUN", "Run"],
  ["STRENGTH", "Strength"],
] as const)("formats the %s activity type", (activityType, expected) => {
  expect(formatActivityType(activityType)).toBe(expected);
});

test.each([
  ["SCHEDULED", "Scheduled"],
  ["COMPLETED", "Completed"],
  ["SKIPPED", "Skipped"],
] as const)("formats the %s status", (status, expected) => {
  expect(formatStatus(status)).toBe(expected);
});

test.each([
  ["DISTANCE_DURATION", "Distance + Duration"],
  ["DISTANCE_PACE", "Distance + Pace"],
  ["DURATION_PACE", "Duration + Pace"],
] as const)("formats the %s target type", (targetType, expected) => {
  expect(formatTargetType(targetType)).toBe(expected);
});
