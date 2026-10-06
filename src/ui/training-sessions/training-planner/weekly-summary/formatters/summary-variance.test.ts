import {
  formatDistanceVariance,
  formatDurationVariance,
} from "./summary-variance";

test("formats positive and negative distance variances", () => {
  expect(formatDistanceVariance(1100, "KILOMETRES")).toBe("+1.1 km");
  expect(formatDistanceVariance(-1100, "KILOMETRES")).toBe("−1.1 km");
  expect(formatDistanceVariance(1609.344, "MILES")).toBe("+1.0 mi");
  expect(formatDistanceVariance(-3218.688, "MILES")).toBe("−2.0 mi");
});

test("suppresses zero distance variance", () => {
  expect(formatDistanceVariance(0, "KILOMETRES")).toBeNull();
  expect(formatDistanceVariance(0, "MILES")).toBeNull();
});

test("formats rounded positive and negative duration variances", () => {
  expect(formatDurationVariance(90)).toBe("+2 min");
  expect(formatDurationVariance(-840)).toBe("−14 min");
});

test("suppresses duration variance that rounds to zero minutes", () => {
  expect(formatDurationVariance(10)).toBeNull();
});
