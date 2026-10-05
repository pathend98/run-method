import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
import { createEditTrainingSessionFormSchema } from "./edit-training-session-form-schema";
import { getEditTrainingSessionFormValues } from "./edit-training-session-form-values";

function run(override: Partial<RunTrainingSession> = {}): RunTrainingSession {
  return createRunTrainingSession({
    description: "Controlled effort",
    ...override,
  });
}

function strength(): StrengthTrainingSession {
  return createStrengthTrainingSession({
    description: "Controlled effort",
    targetDurationSeconds: 2400,
  });
}

test("does not validate hidden skipped metric fields", () => {
  const invalidValues = {
    ...getEditTrainingSessionFormValues(strength(), "KILOMETRES"),
    distance: "bad",
    pace: "bad",
  };
  expect(
    createEditTrainingSessionFormSchema(strength(), "KILOMETRES").safeParse(
      invalidValues,
    ).success,
  ).toBe(true);
  expect(
    createEditTrainingSessionFormSchema(
      run({ status: "SKIPPED", skipReason: "Rest" }),
      "KILOMETRES",
    ).safeParse(invalidValues).success,
  ).toBe(true);
});

test.each([
  ["00", true, ""],
  ["45", true, ""],
  ["1.5", false, "Enter a whole number"],
  ["60", false, "00 to 59"],
] as const)(
  "validates scheduled strength duration %#",
  (durationMinutes, success, message) => {
    const result = createEditTrainingSessionFormSchema(
      strength(),
      "KILOMETRES",
    ).safeParse({
      ...getEditTrainingSessionFormValues(strength(), "KILOMETRES"),
      durationMinutes,
    });

    expect(result.success).toBe(success);
    if (!result.success) expect(result.error.message).toContain(message);
  },
);

test("validates completed strength actual duration", () => {
  const trainingSession = {
    ...strength(),
    status: "COMPLETED" as const,
    actualDurationSeconds: 2400,
  };
  expect(
    createEditTrainingSessionFormSchema(
      trainingSession,
      "KILOMETRES",
    ).safeParse({
      ...getEditTrainingSessionFormValues(trainingSession, "KILOMETRES"),
      durationMinutes: "bad",
    }).success,
  ).toBe(false);
  expect(
    createEditTrainingSessionFormSchema(
      trainingSession,
      "KILOMETRES",
    ).safeParse({
      ...getEditTrainingSessionFormValues(trainingSession, "KILOMETRES"),
      durationMinutes: "00",
    }).success,
  ).toBe(false);
});

test.each([
  [run(), "distance", "", "Enter a distance"],
  [run(), "distance", "0", "greater than zero"],
  [run(), "durationMinutes", "1.5", "Enter a whole number"],
  [run(), "durationMinutes", "0", "greater than zero"],
  [run(), "pace", "5:99", "Enter pace"],
  [run(), "pace", "0:00", "greater than zero"],
] as const)(
  "validates scheduled target field %s",
  (trainingSession, field, value, message) => {
    const result = createEditTrainingSessionFormSchema(
      trainingSession,
      "KILOMETRES",
    ).safeParse({
      ...getEditTrainingSessionFormValues(trainingSession, "KILOMETRES"),
      [field]: value,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toContain(message);
  },
);

test("accepts a valid scheduled run target", () => {
  expect(
    createEditTrainingSessionFormSchema(run(), "KILOMETRES").safeParse({
      ...getEditTrainingSessionFormValues(run(), "KILOMETRES"),
      distance: "10.125",
      durationMinutes: "50",
    }).success,
  ).toBe(true);
});

test("validates completed run actual metrics", () => {
  const trainingSession = run({
    status: "COMPLETED",
    actualDistanceMetres: 8000,
    actualDurationSeconds: 2700,
  });
  expect(
    createEditTrainingSessionFormSchema(
      trainingSession,
      "KILOMETRES",
    ).safeParse({
      ...getEditTrainingSessionFormValues(trainingSession, "KILOMETRES"),
      distance: "0",
    }).success,
  ).toBe(false);
});

test("validates the title independently", () => {
  expect(
    createEditTrainingSessionFormSchema(strength(), "KILOMETRES").safeParse({
      ...getEditTrainingSessionFormValues(strength(), "KILOMETRES"),
      title: "",
    }).success,
  ).toBe(false);
});
