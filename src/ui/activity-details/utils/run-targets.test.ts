import type { RunTrainingSession } from "@/domain/training-sessions";
import { resolveRunTargets } from "./run-targets";

function runTargets(
  targets: Pick<
    RunTrainingSession,
    | "targetDistanceMetres"
    | "targetDurationSeconds"
    | "targetPaceSecondsPerKilometre"
    | "targetType"
  >,
) {
  return resolveRunTargets(targets as RunTrainingSession);
}

test("derives pace from distance and duration", () => {
  expect(
    runTargets({
      targetType: "DISTANCE_DURATION",
      targetDistanceMetres: 6000,
      targetDurationSeconds: 2400,
      targetPaceSecondsPerKilometre: null,
    }),
  ).toEqual({
    distanceMetres: 6000,
    durationSeconds: 2400,
    paceSecondsPerKilometre: 400,
  });
});

test("derives duration from distance and pace", () => {
  expect(
    runTargets({
      targetType: "DISTANCE_PACE",
      targetDistanceMetres: 6000,
      targetDurationSeconds: null,
      targetPaceSecondsPerKilometre: 255,
    }),
  ).toEqual({
    distanceMetres: 6000,
    durationSeconds: 1530,
    paceSecondsPerKilometre: 255,
  });
});

test("derives distance from duration and pace", () => {
  expect(
    runTargets({
      targetType: "DURATION_PACE",
      targetDistanceMetres: null,
      targetDurationSeconds: 1800,
      targetPaceSecondsPerKilometre: 255,
    }),
  ).toEqual({
    distanceMetres: 7059,
    durationSeconds: 1800,
    paceSecondsPerKilometre: 255,
  });
});

test("preserves incomplete targets when a value cannot be derived", () => {
  expect(
    runTargets({
      targetType: "DURATION_PACE",
      targetDistanceMetres: null,
      targetDurationSeconds: null,
      targetPaceSecondsPerKilometre: null,
    }),
  ).toEqual({
    distanceMetres: null,
    durationSeconds: null,
    paceSecondsPerKilometre: null,
  });
});
