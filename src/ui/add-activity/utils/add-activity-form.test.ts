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
        pacePerKilometre: "6:24",
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

test("supports optional strength duration", () => {
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

test("always converts runs to distance and duration without pace", () => {
  expect(
    toCreateTrainingSessionRequest(
      {
        ...defaultAddActivityFormValues,
        title: "Intervals",
        derivedMetric: "duration",
        timeOfDay: "PM",
        distanceKilometres: "5",
        durationMinutes: "20",
        pacePerKilometre: "4:05",
      },
      "2026-08-17",
    ),
  ).toEqual({
    title: "Intervals",
    activityType: "RUN",
    targetType: "DISTANCE_DURATION",
    date: "2026-08-17",
    timeOfDay: "PM",
    description: null,
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1200,
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
  { distanceKilometres: "5" },
  {
    distanceKilometres: "5",
    durationMinutes: "30",
    pacePerKilometre: "0:00",
  },
  {
    distanceKilometres: "5",
    durationMinutes: "30",
    pacePerKilometre: "invalid",
  },
  {
    activityType: "STRENGTH" as const,
    durationSeconds: "1.5",
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

test("requires all three displayed run metrics", () => {
  expect(
    addActivityFormSchema.safeParse({
      ...defaultAddActivityFormValues,
      title: "Run",
      distanceKilometres: "5",
      durationMinutes: "30",
      pacePerKilometre: "invalid",
    }).success,
  ).toBe(false);
});
