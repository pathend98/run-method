import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import {
  createEditActivityFormSchema,
  getEditActivityFormValues,
  toEditTrainingSessionRequest,
} from "./edit-activity-form";

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

function strength(
  override: Partial<StrengthTrainingSession> = {},
): StrengthTrainingSession {
  return {
    ...base,
    activityType: "STRENGTH",
    targetDurationSeconds: 2400,
    actualDurationSeconds: null,
    ...override,
  } as StrengthTrainingSession;
}

test("initializes common, run, null, and pace values", () => {
  expect(getEditActivityFormValues(run())).toEqual({
    title: "Tempo run",
    timeOfDay: "AM",
    description: "Controlled effort",
    distanceKilometres: "8",
    durationMinutes: "45",
    pacePerKilometre: "",
  });
  expect(
    getEditActivityFormValues(
      run({
        timeOfDay: null,
        description: null,
        targetType: "DURATION_PACE",
        targetDistanceMetres: null,
        targetPaceSecondsPerKilometre: 255,
      }),
    ),
  ).toMatchObject({
    timeOfDay: "ANY",
    description: "",
    distanceKilometres: "",
    durationMinutes: "45",
    pacePerKilometre: "4:15",
  });
  expect(
    getEditActivityFormValues(
      run({
        targetType: "DISTANCE_PACE",
        targetDurationSeconds: null,
        targetPaceSecondsPerKilometre: 255,
      }),
    ).durationMinutes,
  ).toBe("");
  expect(getEditActivityFormValues(strength())).toMatchObject({
    distanceKilometres: "",
    durationMinutes: "",
    pacePerKilometre: "",
  });
});

test.each([
  [
    "DISTANCE_DURATION",
    run(),
    { distanceKilometres: "10.125", durationMinutes: "50" },
    { targetDistanceMetres: 10125, targetDurationSeconds: 3000 },
  ],
  [
    "DISTANCE_PACE",
    run({
      targetType: "DISTANCE_PACE",
      targetDurationSeconds: null,
      targetPaceSecondsPerKilometre: 300,
    }),
    { distanceKilometres: "5", pacePerKilometre: "4:20" },
    { targetDistanceMetres: 5000, targetPaceSecondsPerKilometre: 260 },
  ],
  [
    "DURATION_PACE",
    run({
      targetType: "DURATION_PACE",
      targetDistanceMetres: null,
      targetPaceSecondsPerKilometre: 300,
    }),
    { durationMinutes: "60", pacePerKilometre: "5:10" },
    { targetDurationSeconds: 3600, targetPaceSecondsPerKilometre: 310 },
  ],
] as const)(
  "converts scheduled %s run edits",
  (_name, activity, fields, expected) => {
    const request = toEditTrainingSessionRequest(
      {
        ...getEditActivityFormValues(activity),
        title: " Updated run ",
        description: " ",
        timeOfDay: "ANY",
        ...fields,
      },
      activity,
    );

    expect(request).toMatchObject({
      title: "Updated run",
      description: null,
      timeOfDay: null,
      activityType: "RUN",
      targetType: activity.targetType,
      ...expected,
    });
  },
);

test("converts strength edits without its immutable target", () => {
  const activity = strength();
  const request = toEditTrainingSessionRequest(
    {
      ...getEditActivityFormValues(activity),
      title: "Gym",
      timeOfDay: "PM",
    },
    activity,
  );

  expect(request).toEqual({
    title: "Gym",
    description: "Controlled effort",
    timeOfDay: "PM",
    activityType: "STRENGTH",
  });
  expect(request).not.toHaveProperty("targetDurationSeconds");
});

test.each([
  run({ status: "COMPLETED" }),
  run({
    status: "SKIPPED",
    skipReason: "Tired",
    targetType: "DISTANCE_PACE",
    targetDurationSeconds: null,
    targetPaceSecondsPerKilometre: 300,
  }),
  run({
    status: "COMPLETED",
    targetType: "DURATION_PACE",
    targetDistanceMetres: null,
    targetPaceSecondsPerKilometre: 300,
  }),
])("preserves locked terminal run values", (activity) => {
  const request = toEditTrainingSessionRequest(
    {
      ...getEditActivityFormValues(activity),
      title: "Renamed",
      timeOfDay: "PM",
      distanceKilometres: "999",
      durationMinutes: "999",
      pacePerKilometre: "9:59",
    },
    activity,
  );

  expect(request.timeOfDay).toBe(activity.timeOfDay);
  if (request.activityType === "RUN") {
    expect(request.targetType).toBe(activity.targetType);
  }
});

test("does not validate hidden run fields for terminal or strength activities", () => {
  const invalidValues = {
    ...getEditActivityFormValues(strength()),
    distanceKilometres: "bad",
    durationMinutes: "bad",
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
  [run(), "distanceKilometres", "", "Enter a distance"],
  [run(), "distanceKilometres", "0", "greater than zero"],
  [run(), "durationMinutes", "1.5", "Enter whole minutes"],
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

test("validates the title independently", () => {
  expect(
    createEditActivityFormSchema(strength()).safeParse({
      ...getEditActivityFormValues(strength()),
      title: "",
    }).success,
  ).toBe(false);
});
