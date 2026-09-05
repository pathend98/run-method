import {
  formatDistance,
  formatCompactDuration,
  formatDuration,
  formatPace,
} from "./training-session-metric-formatters";

test("formats distances in kilometres with one decimal place", () => {
  expect(formatDistance(5900)).toBe("5.9 km");
  expect(formatDistance(6000)).toBe("6.0 km");
});

test("formats full durations with relevant human-readable units", () => {
  expect(formatDuration(1500)).toBe("25m");
  expect(formatDuration(1530)).toBe("25m 30s");
  expect(formatDuration(3849)).toBe("1h 4m 9s");
  expect(formatDuration(3600)).toBe("1h");
  expect(formatDuration(0)).toBe("0s");
});

test("formats compact durations without seconds after one hour", () => {
  expect(formatCompactDuration(1530)).toBe("25m 30s");
  expect(formatCompactDuration(3849)).toBe("1h 4m");
  expect(formatCompactDuration(3600)).toBe("1h");
  expect(formatCompactDuration(0)).toBe("0s");
});

test("formats pace with padded seconds and an optional unit", () => {
  expect(formatPace(255)).toBe("4:15 / km");
  expect(formatPace(245)).toBe("4:05 / km");
  expect(formatPace(255, { includeUnit: false })).toBe("4:15");
});

test("preserves null metric values", () => {
  expect(formatDistance(null)).toBeNull();
  expect(formatDuration(null)).toBeNull();
  expect(formatCompactDuration(null)).toBeNull();
  expect(formatPace(null)).toBeNull();
});
