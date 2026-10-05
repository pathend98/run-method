import {
  createAddTrainingSessionFormSchema,
  defaultAddTrainingSessionFormValues,
  toCreateTrainingSessionRequest,
} from "./add-training-session-form";

test("converts friendly run values into the create request", () => {
  expect(
    toCreateTrainingSessionRequest(
      {
        ...defaultAddTrainingSessionFormValues,
        title: "  Tempo run  ",
        timeOfDay: "AM",
        description: "  Controlled  ",
        distance: "6.25",
        durationMinutes: "40",
        pace: "6:24",
      },
      "2026-08-17",
      "KILOMETRES",
    ),
  ).toEqual({
    title: "Tempo run",
    activityType: "RUN",
    date: "2026-08-17",
    timeOfDay: "AM",
    description: "Controlled",
    targetDistanceMetres: 6250,
    targetDurationSeconds: 2400,
  });
});

test("converts entered miles to whole metres", () => {
  expect(
    toCreateTrainingSessionRequest(
      {
        ...defaultAddTrainingSessionFormValues,
        title: "Five miles",
        distance: "5",
        durationMinutes: "40",
        pace: "8:00",
      },
      "2026-08-17",
      "MILES",
    ),
  ).toMatchObject({
    targetDistanceMetres: 8047,
    targetDurationSeconds: 2400,
  });
});

test("validates mile distance precision with a mile-specific message", () => {
  const schema = createAddTrainingSessionFormSchema("MILES");
  const values = {
    ...defaultAddTrainingSessionFormValues,
    title: "Run",
    distance: "5.1234",
    durationMinutes: "40",
    pace: "8:00",
  };
  const result = schema.safeParse(values);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].message).toBe("Enter a distance in miles");
  }
  expect(schema.safeParse({ ...values, distance: "5.123" }).success).toBe(true);
});

test("supports optional strength duration", () => {
  expect(
    toCreateTrainingSessionRequest(
      {
        ...defaultAddTrainingSessionFormValues,
        title: "Lift",
        activityType: "STRENGTH",
      },
      "2026-08-17",
      "KILOMETRES",
    ),
  ).toMatchObject({ activityType: "STRENGTH", targetDurationSeconds: null });
});

test("always converts runs to distance and duration without pace", () => {
  expect(
    toCreateTrainingSessionRequest(
      {
        ...defaultAddTrainingSessionFormValues,
        title: "Intervals",
        derivedMetric: "duration",
        timeOfDay: "PM",
        distance: "5",
        durationMinutes: "20",
        pace: "4:05",
      },
      "2026-08-17",
      "KILOMETRES",
    ),
  ).toEqual({
    title: "Intervals",
    activityType: "RUN",
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
        ...defaultAddTrainingSessionFormValues,
        title: "Lift",
        activityType: "STRENGTH",
        durationMinutes: "35",
      },
      "2026-08-17",
      "KILOMETRES",
    ),
  ).toMatchObject({
    activityType: "STRENGTH",
    targetDurationSeconds: 2100,
  });
});

test("rejects incomplete required targets", () => {
  expect(
    createAddTrainingSessionFormSchema("KILOMETRES").safeParse({
      ...defaultAddTrainingSessionFormValues,
      title: "Run",
      distance: "5",
    }).success,
  ).toBe(false);
});

test.each([
  { distance: "0", durationMinutes: "30" },
  { distance: "5" },
  {
    distance: "5",
    durationMinutes: "30",
    pace: "0:00",
  },
  {
    distance: "5",
    durationMinutes: "30",
    pace: "invalid",
  },
  {
    activityType: "STRENGTH" as const,
    durationSeconds: "1.5",
  },
])("rejects invalid target values %#", (override) => {
  expect(
    createAddTrainingSessionFormSchema("KILOMETRES").safeParse({
      ...defaultAddTrainingSessionFormValues,
      title: "Training session",
      ...override,
    }).success,
  ).toBe(false);
});

test("requires all three displayed run metrics", () => {
  expect(
    createAddTrainingSessionFormSchema("KILOMETRES").safeParse({
      ...defaultAddTrainingSessionFormValues,
      title: "Run",
      distance: "5",
      durationMinutes: "30",
      pace: "invalid",
    }).success,
  ).toBe(false);
});
