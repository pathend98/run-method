import {
  formatActivityType,
  formatStatus,
  formatTimeOfDay,
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
  ["AM", "Morning"],
  ["PM", "Evening"],
  [null, "Anytime"],
] as const)("formats %s as %s", (timeOfDay, expected) => {
  expect(formatTimeOfDay(timeOfDay)).toBe(expected);
});
