import { formatDuration, formatCompactDuration } from "./duration-formatters";

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

test("preserves null metric values", () => {
  expect(formatDuration(null)).toBeNull();
  expect(formatCompactDuration(null)).toBeNull();
});
