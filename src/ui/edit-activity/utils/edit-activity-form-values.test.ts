import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import {
  createRunActivity,
  createStrengthActivity,
} from "@/test-support/fixtures/activity";
import { getEditActivityFormValues } from "./edit-activity-form-values";

function run(override: Partial<RunTrainingSession> = {}): RunTrainingSession {
  return createRunActivity({
    description: "Controlled effort",
    ...override,
  });
}

function strength(
  override: Partial<StrengthTrainingSession> = {},
): StrengthTrainingSession {
  return createStrengthActivity({
    description: "Controlled effort",
    targetDurationSeconds: 2400,
    ...override,
  });
}

test("initializes common and run target values", () => {
  expect(getEditActivityFormValues(run())).toEqual({
    title: "Tempo run",
    date: "2026-08-17",
    timeOfDay: "AM",
    description: "Controlled effort",
    derivedMetric: "pace",
    distanceKilometres: "8",
    durationHours: "00",
    durationMinutes: "45",
    durationSeconds: "00",
    pacePerKilometre: "5:38",
  });
});

test("maps nullable common values and derives pace", () => {
  expect(
    getEditActivityFormValues(
      run({
        timeOfDay: null,
        description: null,
      }),
    ),
  ).toEqual({
    title: "Tempo run",
    date: "2026-08-17",
    timeOfDay: "ANY",
    description: "",
    derivedMetric: "pace",
    distanceKilometres: "8",
    durationHours: "00",
    durationMinutes: "45",
    durationSeconds: "00",
    pacePerKilometre: "5:38",
  });
});

test("initializes the optional duration for strength activities", () => {
  expect(getEditActivityFormValues(strength())).toMatchObject({
    distanceKilometres: "",
    durationMinutes: "40",
    pacePerKilometre: "",
  });

  expect(
    getEditActivityFormValues({
      ...strength(),
      targetDurationSeconds: null,
    }).durationMinutes,
  ).toBe("00");
});

test("initializes completed actual metrics instead of targets", () => {
  expect(
    getEditActivityFormValues(
      run({
        status: "COMPLETED",
        actualDistanceMetres: 7500,
        actualDurationSeconds: 2400,
      }),
    ),
  ).toMatchObject({
    distanceKilometres: "7.5",
    durationMinutes: "40",
    pacePerKilometre: "5:20",
  });
  expect(
    getEditActivityFormValues(
      strength({ status: "COMPLETED", actualDurationSeconds: 2100 }),
    ),
  ).toMatchObject({ durationMinutes: "35" });
});
