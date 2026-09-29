import {
  formatDistance,
  formatCompactDuration,
  formatDuration,
  formatPace,
} from "./training-session-metric-formatters";

test("formats distances in kilometres with two decimal places", () => {
  expect(formatDistance(5900, "KILOMETRES")).toBe("5.90 km");
  expect(formatDistance(6000, "KILOMETRES")).toBe("6.00 km");
  expect(formatDistance(6000, "KILOMETRES", { decimalPlaces: 1 })).toBe(
    "6.0 km",
  );
});

test("formats metres as miles at the requested precision", () => {
  expect(formatDistance(1609.344, "MILES")).toBe("1.00 mi");
  expect(formatDistance(8046.72, "MILES", { decimalPlaces: 1 })).toBe("5.0 mi");
  expect(formatDistance(0, "MILES")).toBe("0.00 mi");
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
  expect(formatDistance(null, "MILES")).toBeNull();
  expect(formatDuration(null)).toBeNull();
  expect(formatCompactDuration(null)).toBeNull();
  expect(formatPace(null)).toBeNull();
});
