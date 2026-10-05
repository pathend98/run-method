import {
  completeTrainingSessionRequestSchema,
  createTrainingSessionRequestSchema,
  editTrainingSessionRequestSchema,
  skipTrainingSessionRequestSchema,
  trainingSessionSchema,
  trainingSessionsQuerySchema,
} from "./training-sessions";
import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";

const baseSession = {
  id: "11111111-1111-4111-8111-111111111111",
  athleteId: "33333333-3333-4333-8333-333333333333",
  title: "Easy run",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
} as const;

test("trainingSessionSchema validates run read models", () => {
  expect(
    trainingSessionSchema.parse(
      createRunTrainingSession({ title: "Easy run" }),
    ),
  ).toEqual({
    ...baseSession,
    activityType: "RUN",
    targetDistanceMetres: 8000,
    targetDurationSeconds: 2700,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
  });
});

test.each([undefined, null, "invalid"])(
  "trainingSessionSchema rejects invalid athlete id %s",
  (athleteId) => {
    expect(
      trainingSessionSchema.safeParse({
        ...baseSession,
        athleteId,
        activityType: "RUN",
        targetDistanceMetres: 8000,
        targetDurationSeconds: 2700,
        actualDistanceMetres: null,
        actualDurationSeconds: null,
      }).success,
    ).toBe(false);
  },
);

test("trainingSessionSchema validates strength read models", () => {
  expect(
    trainingSessionSchema.parse(
      createStrengthTrainingSession({
        id: "22222222-2222-4222-8222-222222222222",
        status: "COMPLETED",
        title: "Strength",
        actualDurationSeconds: 2400,
      }),
    ),
  ).toEqual({
    ...baseSession,
    id: "22222222-2222-4222-8222-222222222222",
    athleteId: "33333333-3333-4333-8333-333333333333",
    title: "Strength",
    status: "COMPLETED",
    activityType: "STRENGTH",
    targetDurationSeconds: 2700,
    actualDurationSeconds: 2400,
  });
});

test("trainingSessionSchema validates completed runs with required actuals", () => {
  expect(() =>
    trainingSessionSchema.parse(
      createRunTrainingSession({
        title: "Easy run",
        status: "COMPLETED",
        actualDistanceMetres: 8050,
        actualDurationSeconds: 2680,
      }),
    ),
  ).not.toThrow();
});

test.each([
  ["scheduled duration", { actualDurationSeconds: 1200 }],
  ["scheduled distance", { actualDistanceMetres: 5000 }],
  ["completed duration", { status: "COMPLETED", actualDurationSeconds: null }],
  [
    "completed run distance",
    {
      status: "COMPLETED",
      actualDurationSeconds: 1200,
      actualDistanceMetres: null,
    },
  ],
  [
    "skipped actuals",
    {
      status: "SKIPPED",
      skipReason: "Recovery",
      actualDurationSeconds: 1200,
    },
  ],
])("trainingSessionSchema rejects invalid %s state", (_name, override) => {
  const session = {
    ...baseSession,
    activityType: "RUN",
    targetDistanceMetres: 8000,
    targetDurationSeconds: 2700,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
  };
  Object.assign(session, override);

  expect(() => trainingSessionSchema.parse(session)).toThrow();
});

test("skip request requires and trims a non-empty reason", () => {
  expect(
    skipTrainingSessionRequestSchema.parse({ skipReason: "  Rest  " }),
  ).toEqual({ skipReason: "Rest" });
  expect(() => skipTrainingSessionRequestSchema.parse({})).toThrow();
  expect(() =>
    skipTrainingSessionRequestSchema.parse({ skipReason: "  " }),
  ).toThrow();
  expect(() =>
    skipTrainingSessionRequestSchema.parse({
      skipReason: "Rest",
      unexpected: true,
    }),
  ).toThrow();
});

test("completion request requires positive integer actuals", () => {
  expect(
    completeTrainingSessionRequestSchema.parse({
      actualDurationSeconds: 1500,
      actualDistanceMetres: 5000,
    }),
  ).toEqual({ actualDurationSeconds: 1500, actualDistanceMetres: 5000 });
  expect(() => completeTrainingSessionRequestSchema.parse({})).toThrow();
  expect(() =>
    completeTrainingSessionRequestSchema.parse({ actualDurationSeconds: 0 }),
  ).toThrow();
  expect(() =>
    completeTrainingSessionRequestSchema.parse({
      actualDurationSeconds: 1500,
      actualDistanceMetres: 1.5,
    }),
  ).toThrow();
});

test.each([
  ["empty title", { title: "" }],
  ["invalid activity type", { activityType: "BIKE" }],
  ["invalid status", { status: "DONE" }],
  ["invalid id", { id: "not-a-uuid" }],
  ["invalid date", { date: "2026-02-30" }],
  ["invalid time of day", { timeOfDay: "NOON" }],
  ["empty description", { description: "" }],
  ["negative sort order", { sortOrder: -1 }],
  ["decimal sort order", { sortOrder: 1.5 }],
  ["missing skipped reason", { status: "SKIPPED", skipReason: null }],
  ["unexpected skip reason", { skipReason: "Sick" }],
  ["negative run distance", { targetDistanceMetres: -1 }],
  ["missing run distance", { targetDistanceMetres: null }],
  ["missing run duration", { targetDurationSeconds: null }],
])("trainingSessionSchema rejects %s", (_caseName, override) => {
  expect(() =>
    trainingSessionSchema.parse({
      ...baseSession,
      activityType: "RUN",
      targetDistanceMetres: 8000,
      targetDurationSeconds: 2700,
      actualDistanceMetres: null,
      actualDurationSeconds: null,
      ...override,
    }),
  ).toThrow();
});

test.each([
  {
    activityType: "RUN",
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1500,
  },
  { activityType: "STRENGTH", targetDurationSeconds: 1800 },
  { activityType: "STRENGTH", targetDurationSeconds: null },
])("editTrainingSessionRequestSchema validates $activityType edits", (edit) => {
  expect(
    editTrainingSessionRequestSchema.parse({
      title: " Updated session ",
      description: " Updated description ",
      timeOfDay: null,
      date: "2026-08-27",
      ...edit,
    }),
  ).toMatchObject({
    title: "Updated session",
    description: "Updated description",
    timeOfDay: null,
    date: "2026-08-27",
    ...edit,
  });
});

test.each([
  ["missing title", { title: undefined }],
  ["empty description", { description: "" }],
  ["invalid time of day", { timeOfDay: "NOON" }],
  ["missing target", { targetDurationSeconds: undefined }],
  ["invalid target", { targetDistanceMetres: 0 }],
  ["invalid date", { date: "2026-02-30" }],
  ["invalid actual", { actualDurationSeconds: 0 }],
])("editTrainingSessionRequestSchema rejects %s", (_caseName, override) => {
  expect(() =>
    editTrainingSessionRequestSchema.parse({
      title: "Easy run",
      description: null,
      timeOfDay: "AM",
      activityType: "RUN",
      targetDistanceMetres: 5000,
      targetDurationSeconds: 1500,
      ...override,
    }),
  ).toThrow();
});

test.each([undefined, 0, -1, 1.5, "1800"])(
  "editTrainingSessionRequestSchema rejects invalid strength duration %#",
  (targetDurationSeconds) => {
    expect(() =>
      editTrainingSessionRequestSchema.parse({
        title: "Strength",
        description: null,
        timeOfDay: "PM",
        activityType: "STRENGTH",
        targetDurationSeconds,
      }),
    ).toThrow();
  },
);

test("run write schemas reject legacy target fields", () => {
  expect(() =>
    createTrainingSessionRequestSchema.parse({
      title: "Easy run",
      date: "2026-08-27",
      description: null,
      timeOfDay: "AM",
      activityType: "RUN",
      targetDistanceMetres: 5000,
      targetDurationSeconds: 1500,
      targetType: "DISTANCE_DURATION",
    }),
  ).toThrow();
  expect(() =>
    editTrainingSessionRequestSchema.parse({
      title: "Easy run",
      description: null,
      timeOfDay: "AM",
      activityType: "RUN",
      targetDistanceMetres: 5000,
      targetDurationSeconds: 1500,
      targetPaceSecondsPerKilometre: 300,
    }),
  ).toThrow();
});

test("creation applies null defaults while editing requires explicit nullable fields", () => {
  const request = { title: " Strength ", activityType: "STRENGTH" };
  expect(
    createTrainingSessionRequestSchema.parse({
      ...request,
      date: "2026-10-02",
    }),
  ).toEqual({
    title: "Strength",
    activityType: "STRENGTH",
    date: "2026-10-02",
    timeOfDay: null,
    description: null,
    targetDurationSeconds: null,
  });
  expect(editTrainingSessionRequestSchema.safeParse(request).success).toBe(
    false,
  );
  expect(
    editTrainingSessionRequestSchema.parse({
      ...request,
      timeOfDay: null,
      description: null,
      targetDurationSeconds: null,
    }),
  ).toEqual({
    title: "Strength",
    activityType: "STRENGTH",
    timeOfDay: null,
    description: null,
    targetDurationSeconds: null,
  });
});

test("session response text preserves surrounding whitespace", () => {
  const session = createRunTrainingSession({
    title: " Easy run ",
    description: " Details ",
  });
  expect(trainingSessionSchema.parse(session)).toEqual(session);
});

describe("trainingSessionsQuerySchema", () => {
  const athleteId = baseSession.athleteId;

  test.each([
    {},
    { from: "2026-08-17" },
    { to: "2026-08-23" },
    { from: "2026-08-17", to: "2026-08-23" },
    { from: "2026-08-17", to: "2026-08-17" },
    { from: "2028-02-29" },
    { status: "SCHEDULED" },
    { status: "COMPLETED" },
    { status: "SKIPPED" },
  ])("accepts valid filters %j", (filters) => {
    const query = { athleteId, ...filters };
    expect(trainingSessionsQuerySchema.parse(query)).toEqual(query);
  });

  test.each([
    ["athleteId", "not-a-uuid"],
    ["athleteId", ""],
    ["athleteId", undefined],
    ["from", "2026-02-30"],
    ["from", "17/08/2026"],
    ["from", ""],
    ["to", "2026-02-29"],
    ["to", "2026-08-23T00:00:00Z"],
    ["to", ""],
    ["status", "DUE"],
    ["status", "scheduled"],
    ["status", ""],
  ])("rejects invalid %s: %s", (field, value) => {
    const result = trainingSessionsQuerySchema.safeParse({
      athleteId,
      [field]: value,
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: [field] })]),
      );
  });

  test("assigns inverted date range errors to from", () => {
    const result = trainingSessionsQuerySchema.safeParse({
      athleteId,
      from: "2026-08-24",
      to: "2026-08-23",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues).toEqual([
        expect.objectContaining({
          path: ["from"],
          message: "from must be before or equal to to",
        }),
      ]);
  });
});
