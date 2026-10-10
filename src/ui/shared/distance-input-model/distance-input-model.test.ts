import { formatDistanceInput, readDistanceInput } from "./distance-input-model";

test("reads selected units as rounded integer metres", () => {
  expect(readDistanceInput("6.25", "KILOMETRES")).toBe(6250);
  expect(readDistanceInput("1", "MILES")).toBe(1609);
  expect(readDistanceInput("1.001", "MILES")).toBe(1611);
});

test("formats input at up to three decimals without trailing zeros", () => {
  expect(formatDistanceInput(6001, "MILES")).toBe("3.729");
  expect(formatDistanceInput(6001, "KILOMETRES")).toBe("6.001");
  expect(formatDistanceInput(6000, "KILOMETRES")).toBe("6");
});

test("preserves original metres only when the displayed input is unchanged", () => {
  expect(readDistanceInput("3.729", "MILES", 6001)).toBe(6001);
  expect(readDistanceInput("5", "MILES", 6001)).toBe(8047);
  expect(readDistanceInput("6.001", "KILOMETRES", 6001)).toBe(6001);
  expect(readDistanceInput("3.729", "MILES", 6002)).toBe(6002);
  expect(readDistanceInput("3.729", "MILES")).toBe(6001);
});
