import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import { createEditActivityFormSchema } from "./edit-activity-form-schema";
import { getEditActivityFormValues } from "./edit-activity-form-values";

const base = {
  id: "11111111-1111-4111-8111-111111111111",
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
    targetType: "DISTANCE_DURATION",
    targetDistanceMetres: 8000,
    targetDurationSeconds: 2700,
    targetPaceSecondsPerKilometre: null,
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

test("does not validate hidden target fields", () => {
  const invalidValues = {
    ...getEditActivityFormValues(strength()),
    distanceKilometres: "bad",
    pacePerKilometre: "bad",
  };
  expect(
    createEditActivityFormSchema(strength()).safeParse(invalidValues).success,
  ).toBe(true);
  expect(
    createEditActivityFormSchema(run({ status: "COMPLETED" })).safeParse(
      invalidValues,
    ).success,
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

test("does not validate a locked terminal strength duration", () => {
  const activity = { ...strength(), status: "COMPLETED" as const };
  expect(
    createEditActivityFormSchema(activity).safeParse({
      ...getEditActivityFormValues(activity),
      durationMinutes: "bad",
    }).success,
  ).toBe(true);
});

test.each([
  [run(), "distanceKilometres", "", "Enter a distance"],
  [run(), "distanceKilometres", "0", "greater than zero"],
  [run(), "durationMinutes", "1.5", "Enter a whole number"],
  [run(), "durationMinutes", "0", "greater than zero"],
  [
    run({
      targetType: "DISTANCE_PACE",
      targetDurationSeconds: null,
      targetPaceSecondsPerKilometre: 300,
    }),
    "pacePerKilometre",
    "5:99",
    "Enter pace",
  ],
  [
    run({
      targetType: "DURATION_PACE",
      targetDistanceMetres: null,
      targetPaceSecondsPerKilometre: 300,
    }),
    "pacePerKilometre",
    "0:00",
    "greater than zero",
  ],
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

test("accepts every valid scheduled run target combination", () => {
  expect(
    createEditActivityFormSchema(run()).safeParse({
      ...getEditActivityFormValues(run()),
      distanceKilometres: "10.125",
      durationMinutes: "50",
    }).success,
  ).toBe(true);
  const distancePace = run({
    targetType: "DISTANCE_PACE",
    targetDurationSeconds: null,
    targetPaceSecondsPerKilometre: 300,
  });
  expect(
    createEditActivityFormSchema(distancePace).safeParse({
      ...getEditActivityFormValues(distancePace),
      pacePerKilometre: "4:20",
    }).success,
  ).toBe(true);
  const durationPace = run({
    targetType: "DURATION_PACE",
    targetDistanceMetres: null,
    targetPaceSecondsPerKilometre: 300,
  });
  expect(
    createEditActivityFormSchema(durationPace).safeParse({
      ...getEditActivityFormValues(durationPace),
      pacePerKilometre: "5:10",
    }).success,
  ).toBe(true);
});

test.each([
  [run(), { pacePerKilometre: "invalid" }],
  [
    run({
      targetType: "DISTANCE_PACE",
      targetDurationSeconds: null,
      targetPaceSecondsPerKilometre: 300,
    }),
    { durationMinutes: "invalid" },
  ],
  [
    run({
      targetType: "DURATION_PACE",
      targetDistanceMetres: null,
      targetPaceSecondsPerKilometre: 300,
    }),
    { distanceKilometres: "invalid" },
  ],
] as const)(
  "does not validate metrics excluded by %s",
  (activity, excludedMetric) => {
    expect(
      createEditActivityFormSchema(activity).safeParse({
        ...getEditActivityFormValues(activity),
        ...excludedMetric,
      }).success,
    ).toBe(true);
  },
);

test("validates the title independently", () => {
  expect(
    createEditActivityFormSchema(strength()).safeParse({
      ...getEditActivityFormValues(strength()),
      title: "",
    }).success,
  ).toBe(false);
});
