import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import { createEditActivityFormSchema } from "./edit-activity-form-schema";
import { getEditActivityFormValues } from "./edit-activity-form-values";

const base = {
  id: "11111111-1111-4111-8111-111111111111",
  athleteId: "33333333-3333-4333-8333-333333333333",
  title: "Tempo run",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: "Controlled effort",
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
} as const;

function run(override: Partial<RunTrainingSession> = {}): RunTrainingSession {
  return {
    ...base,
    activityType: "RUN",
    targetDistanceMetres: 8000,
    targetDurationSeconds: 2700,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
    ...override,
  } as RunTrainingSession;
}

function strength(): StrengthTrainingSession {
  return {
    ...base,
    activityType: "STRENGTH",
    targetDurationSeconds: 2400,
    actualDurationSeconds: null,
  };
}

test("does not validate hidden skipped metric fields", () => {
  const invalidValues = {
    ...getEditActivityFormValues(strength()),
    distanceKilometres: "bad",
    pacePerKilometre: "bad",
  };
  expect(
    createEditActivityFormSchema(strength()).safeParse(invalidValues).success,
  ).toBe(true);
  expect(
    createEditActivityFormSchema(
      run({ status: "SKIPPED", skipReason: "Rest" }),
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
    const result = createEditActivityFormSchema(strength()).safeParse({
      ...getEditActivityFormValues(strength()),
      durationMinutes,
    });

    expect(result.success).toBe(success);
    if (!result.success) expect(result.error.message).toContain(message);
  },
);

test("validates completed strength actual duration", () => {
  const activity = {
    ...strength(),
    status: "COMPLETED" as const,
    actualDurationSeconds: 2400,
  };
  expect(
    createEditActivityFormSchema(activity).safeParse({
      ...getEditActivityFormValues(activity),
      durationMinutes: "bad",
    }).success,
  ).toBe(false);
  expect(
    createEditActivityFormSchema(activity).safeParse({
      ...getEditActivityFormValues(activity),
      durationMinutes: "00",
    }).success,
  ).toBe(false);
});

test.each([
  [run(), "distanceKilometres", "", "Enter a distance"],
  [run(), "distanceKilometres", "0", "greater than zero"],
  [run(), "durationMinutes", "1.5", "Enter a whole number"],
  [run(), "durationMinutes", "0", "greater than zero"],
  [run(), "pacePerKilometre", "5:99", "Enter pace"],
  [run(), "pacePerKilometre", "0:00", "greater than zero"],
] as const)(
  "validates scheduled target field %s",
  (activity, field, value, message) => {
    const result = createEditActivityFormSchema(activity).safeParse({
      ...getEditActivityFormValues(activity),
      [field]: value,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.message).toContain(message);
  },
);

test("accepts a valid scheduled run target", () => {
  expect(
    createEditActivityFormSchema(run()).safeParse({
      ...getEditActivityFormValues(run()),
      distanceKilometres: "10.125",
      durationMinutes: "50",
    }).success,
  ).toBe(true);
});

test("validates completed run actual metrics", () => {
  const activity = run({
    status: "COMPLETED",
    actualDistanceMetres: 8000,
    actualDurationSeconds: 2700,
  });
  expect(
    createEditActivityFormSchema(activity).safeParse({
      ...getEditActivityFormValues(activity),
      distanceKilometres: "0",
    }).success,
  ).toBe(false);
});

test("validates the title independently", () => {
  expect(
    createEditActivityFormSchema(strength()).safeParse({
      ...getEditActivityFormValues(strength()),
      title: "",
    }).success,
  ).toBe(false);
});
