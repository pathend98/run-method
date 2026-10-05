import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
import { formatLockedTargets } from "./edit-training-session-formatters";

const run = createRunTrainingSession({
  description: "Controlled effort",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1800,
});

const strength = createStrengthTrainingSession({
  description: "Controlled effort",
});

test("formats the available locked run targets", () => {
  expect(formatLockedTargets(run, "KILOMETRES")).toBe("6.00 km · 30m");
  expect(formatLockedTargets(run, "MILES")).toBe("3.73 mi · 30m");
});

test("formats strength duration with a missing-target fallback", () => {
  expect(formatLockedTargets(strength, "MILES")).toBe("45m");
  expect(
    formatLockedTargets(
      {
        ...strength,
        targetDurationSeconds: null,
      },
      "MILES",
    ),
  ).toBe("No target duration");
});
