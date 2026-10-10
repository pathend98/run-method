import { formatDistance, formatPace } from "./run-metric-formatters";

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

test("formats pace with padded seconds and an optional unit", () => {
  expect(formatPace(255, "KILOMETRES")).toBe("4:15 / km");
  expect(formatPace(245, "KILOMETRES")).toBe("4:05 / km");
  expect(formatPace(255, "KILOMETRES", { includeUnit: false })).toBe("4:15");
  expect(formatPace(255, "MILES")).toBe("6:50 / mi");
  expect(formatPace(300, "MILES")).toBe("8:03 / mi");
  expect(formatPace(300, "MILES", { includeUnit: false })).toBe("8:03");
});

test("preserves null metric values", () => {
  expect(formatDistance(null, "MILES")).toBeNull();
  expect(formatPace(null, "MILES")).toBeNull();
});
