import {
  addActivityFormSchema,
  defaultAddActivityFormValues,
  toCreateTrainingSessionRequest,
} from "./add-activity-form";

test("converts friendly run values into the create request", () => {
  expect(
    toCreateTrainingSessionRequest(
      {
        ...defaultAddActivityFormValues,
        title: "  Tempo run  ",
        timeOfDay: "AM",
        description: "  Controlled  ",
        distanceKilometres: "6.25",
        durationMinutes: "40",
      },
      "2026-08-17",
    ),
  ).toEqual({
    title: "Tempo run",
    activityType: "RUN",
    targetType: "DISTANCE_DURATION",
    date: "2026-08-17",
    timeOfDay: "AM",
    description: "Controlled",
    targetDistanceMetres: 6250,
    targetDurationSeconds: 2400,
  });
});

test("supports pace runs and optional strength duration", () => {
  expect(
    toCreateTrainingSessionRequest(
      {
        ...defaultAddActivityFormValues,
        title: "Progression",
        targetType: "DURATION_PACE",
        durationMinutes: "30",
        pacePerKilometre: "4:30",
      },
      "2026-08-17",
    ),
  ).toMatchObject({
    targetDurationSeconds: 1800,
    targetPaceSecondsPerKilometre: 270,
  });

  expect(
    toCreateTrainingSessionRequest(
      {
        ...defaultAddActivityFormValues,
        title: "Lift",
        activityType: "STRENGTH",
      },
      "2026-08-17",
    ),
  ).toMatchObject({ activityType: "STRENGTH", targetDurationSeconds: null });
});

test("converts distance and pace runs", () => {
  expect(
    toCreateTrainingSessionRequest(
      {
        ...defaultAddActivityFormValues,
        title: "Intervals",
        targetType: "DISTANCE_PACE",
        timeOfDay: "PM",
        distanceKilometres: "5",
        pacePerKilometre: "4:05",
      },
      "2026-08-17",
    ),
  ).toEqual({
    title: "Intervals",
    activityType: "RUN",
    targetType: "DISTANCE_PACE",
    date: "2026-08-17",
    timeOfDay: "PM",
    description: null,
    targetDistanceMetres: 5000,
    targetPaceSecondsPerKilometre: 245,
  });
});

test("converts a specified strength duration", () => {
  expect(
    toCreateTrainingSessionRequest(
      {
        ...defaultAddActivityFormValues,
        title: "Lift",
        activityType: "STRENGTH",
        durationMinutes: "35",
      },
      "2026-08-17",
    ),
  ).toMatchObject({
    activityType: "STRENGTH",
    targetDurationSeconds: 2100,
  });
});

test("rejects incomplete required targets", () => {
  expect(
    addActivityFormSchema.safeParse({
      ...defaultAddActivityFormValues,
      title: "Run",
      distanceKilometres: "5",
    }).success,
  ).toBe(false);
});

test.each([
  { distanceKilometres: "0", durationMinutes: "30" },
  { distanceKilometres: "5", durationMinutes: "0" },
  {
    targetType: "DISTANCE_PACE" as const,
    distanceKilometres: "5",
    pacePerKilometre: "0:00",
  },
  {
    targetType: "DURATION_PACE" as const,
    durationMinutes: "30",
    pacePerKilometre: "invalid",
  },
  {
    activityType: "STRENGTH" as const,
    durationMinutes: "1.5",
  },
])("rejects invalid target values %#", (override) => {
  expect(
    addActivityFormSchema.safeParse({
      ...defaultAddActivityFormValues,
      title: "Activity",
      ...override,
    }).success,
  ).toBe(false);
});

test.each([
  ["DISTANCE_DURATION", { pacePerKilometre: "invalid" }],
  ["DISTANCE_PACE", { durationMinutes: "invalid" }],
  ["DURATION_PACE", { distanceKilometres: "invalid" }],
] as const)("ignores metrics excluded by %s", (targetType, excludedMetric) => {
  expect(
    addActivityFormSchema.safeParse({
      ...defaultAddActivityFormValues,
      title: "Run",
      targetType,
      distanceKilometres: "5",
      durationMinutes: "30",
      pacePerKilometre: "5:00",
      ...excludedMetric,
    }).success,
  ).toBe(true);
});
