import type { RunTrainingSession } from "@/domain/training-sessions";
import {
  calculatePaceSecondsPerKilometre,
  resolveRunTargets,
} from "./run-targets";

function runTargets(
  targets: Pick<
    RunTrainingSession,
    "targetDistanceMetres" | "targetDurationSeconds"
  >,
) {
  return resolveRunTargets(targets as RunTrainingSession);
}

test("derives pace from distance and duration", () => {
  expect(
    runTargets({
      targetDistanceMetres: 6000,
      targetDurationSeconds: 2400,
    }),
  ).toEqual({
    distanceMetres: 6000,
    durationSeconds: 2400,
    paceSecondsPerKilometre: 400,
  });
});

test("rounds pace from recorded distance and duration", () => {
  expect(calculatePaceSecondsPerKilometre(5900, 1500)).toBe(254);
});
