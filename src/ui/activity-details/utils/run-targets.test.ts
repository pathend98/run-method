import type { RunTrainingSession } from "@/domain/training-sessions";
import { resolveRunTargets } from "./run-targets";

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
