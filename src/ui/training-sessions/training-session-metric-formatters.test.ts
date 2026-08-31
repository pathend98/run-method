import {
  formatDistance,
  formatDuration,
  formatPace,
} from "./training-session-metric-formatters";

test("formats distances in kilometres with one decimal place", () => {
  expect(formatDistance(5900)).toBe("5.9 km");
  expect(formatDistance(6000)).toBe("6.0 km");
});

test("formats durations as rounded whole minutes", () => {
  expect(formatDuration(1500)).toBe("25 min");
  expect(formatDuration(1530)).toBe("26 min");
});

test("formats pace with padded seconds and an optional unit", () => {
  expect(formatPace(255)).toBe("4:15 / km");
  expect(formatPace(245)).toBe("4:05 / km");
  expect(formatPace(255, { includeUnit: false })).toBe("4:15");
});

test("preserves null metric values", () => {
  expect(formatDistance(null)).toBeNull();
  expect(formatDuration(null)).toBeNull();
  expect(formatPace(null)).toBeNull();
});
