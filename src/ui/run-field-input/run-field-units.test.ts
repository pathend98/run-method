import {
  distanceToMetres,
  formatDistanceInput,
  formatPaceInput,
  metresPerUnit,
} from "./run-field-units";

test("converts entered distances to whole metres", () => {
  expect(metresPerUnit("KILOMETRES")).toBe(1000);
  expect(metresPerUnit("MILES")).toBe(1609.344);
  expect(distanceToMetres("6.25", "KILOMETRES")).toBe(6250);
  expect(distanceToMetres("1", "MILES")).toBe(1609);
  expect(distanceToMetres("1.001", "MILES")).toBe(1611);
});

test("formats existing distances at input precision", () => {
  expect(formatDistanceInput(6250, "KILOMETRES")).toBe("6.25");
  expect(formatDistanceInput(6000, "MILES")).toBe("3.728");
  expect(formatDistanceInput(1609, "MILES")).toBe("1");
  expect(formatDistanceInput(6000, "KILOMETRES", 1)).toBe("6");
});

test("formats a pace value in the already selected unit", () => {
  expect(formatPaceInput(308)).toBe("5:08");
  expect(formatPaceInput(480)).toBe("8:00");
});
