import {
  formatActivityType,
  formatDistance,
  formatDuration,
  formatPace,
  formatStatus,
  formatTargetType,
} from "./activity-details-formatters";

test("formats activity types and statuses", () => {
  expect(formatActivityType("RUN")).toBe("Run");
  expect(formatActivityType("STRENGTH")).toBe("Strength");
  expect(formatStatus("SCHEDULED")).toBe("Scheduled");
});

test("formats target types and metric values", () => {
  expect(formatTargetType("DISTANCE_DURATION")).toBe("Distance + Duration");
  expect(formatDistance(5900)).toBe("5.9 km");
  expect(formatDuration(1500)).toBe("25 min");
  expect(formatPace(255)).toBe("4:15 / km");
});

test("preserves null metric values", () => {
  expect(formatDistance(null)).toBeNull();
  expect(formatDuration(null)).toBeNull();
  expect(formatPace(null)).toBeNull();
});
