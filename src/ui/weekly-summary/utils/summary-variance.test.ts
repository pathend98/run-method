import {
  formatDistanceVariance,
  formatDurationVariance,
} from "./summary-variance";

test("formats positive and negative distance variances", () => {
  expect(formatDistanceVariance(1100)).toBe("+1.1 km");
  expect(formatDistanceVariance(-1100)).toBe("−1.1 km");
});

test("suppresses zero distance variance", () => {
  expect(formatDistanceVariance(0)).toBeNull();
});

test("formats rounded positive and negative duration variances", () => {
  expect(formatDurationVariance(90)).toBe("+2 min");
  expect(formatDurationVariance(-840)).toBe("−14 min");
});

test("suppresses duration variance that rounds to zero minutes", () => {
  expect(formatDurationVariance(10)).toBeNull();
});
