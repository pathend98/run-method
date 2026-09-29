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
  expect(getEditActivityFormValues(run(), "KILOMETRES")).toEqual({
    title: "Tempo run",
    date: "2026-08-17",
    timeOfDay: "AM",
    description: "Controlled effort",
    derivedMetric: "pace",
    distance: "8",
    durationHours: "00",
    durationMinutes: "45",
    durationSeconds: "00",
    pace: "5:38",
  });
});

test("maps nullable common values and derives pace", () => {
  expect(
    getEditActivityFormValues(
      run({
        timeOfDay: null,
        description: null,
      }),
      "KILOMETRES",
    ),
  ).toEqual({
    title: "Tempo run",
    date: "2026-08-17",
    timeOfDay: "ANY",
    description: "",
    derivedMetric: "pace",
    distance: "8",
    durationHours: "00",
    durationMinutes: "45",
    durationSeconds: "00",
    pace: "5:38",
  });
});

test("initializes the optional duration for strength activities", () => {
  expect(getEditActivityFormValues(strength(), "KILOMETRES")).toMatchObject({
    distance: "",
    durationMinutes: "40",
    pace: "",
  });

  expect(
    getEditActivityFormValues(
      {
        ...strength(),
        targetDurationSeconds: null,
      },
      "KILOMETRES",
    ).durationMinutes,
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
      "KILOMETRES",
    ),
  ).toMatchObject({
    distance: "7.5",
    durationMinutes: "40",
    pace: "5:20",
  });
  expect(
    getEditActivityFormValues(
      strength({ status: "COMPLETED", actualDurationSeconds: 2100 }),
      "KILOMETRES",
    ),
  ).toMatchObject({ durationMinutes: "35" });
});
