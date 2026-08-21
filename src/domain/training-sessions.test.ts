import { trainingSessionSchema } from "./training-sessions";

const baseSession = {
  id: "11111111-1111-4111-8111-111111111111",
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
    trainingSessionSchema.parse({
      ...baseSession,
      activityType: "RUN",
      targetType: "DISTANCE_DURATION",
      targetDistanceMetres: 8000,
      targetDurationSeconds: 2700,
      targetPaceSecondsPerKilometre: null,
      actualDistanceMetres: null,
      actualDurationSeconds: null,
    }),
  ).toEqual({
    ...baseSession,
    activityType: "RUN",
    targetType: "DISTANCE_DURATION",
    targetDistanceMetres: 8000,
    targetDurationSeconds: 2700,
    targetPaceSecondsPerKilometre: null,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
  });
});

test("trainingSessionSchema validates strength read models", () => {
  expect(
    trainingSessionSchema.parse({
      ...baseSession,
      id: "22222222-2222-4222-8222-222222222222",
      title: "Strength",
      activityType: "STRENGTH",
      targetDurationSeconds: 2700,
      actualDurationSeconds: 2400,
    }),
  ).toEqual({
    ...baseSession,
    id: "22222222-2222-4222-8222-222222222222",
    title: "Strength",
    activityType: "STRENGTH",
    targetDurationSeconds: 2700,
    actualDurationSeconds: 2400,
  });
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
  ["invalid run target type", { targetType: "DISTANCE" }],
  [
    "missing distance duration distance",
    { targetType: "DISTANCE_DURATION", targetDistanceMetres: null },
  ],
  [
    "unexpected distance duration pace",
    {
      targetType: "DISTANCE_DURATION",
      targetPaceSecondsPerKilometre: 300,
    },
  ],
  [
    "missing distance pace pace",
    {
      targetType: "DISTANCE_PACE",
      targetDurationSeconds: null,
      targetPaceSecondsPerKilometre: null,
    },
  ],
  [
    "unexpected distance pace duration",
    {
      targetType: "DISTANCE_PACE",
      targetDurationSeconds: 2700,
      targetPaceSecondsPerKilometre: 300,
    },
  ],
  [
    "missing duration pace duration",
    {
      targetType: "DURATION_PACE",
      targetDistanceMetres: null,
      targetDurationSeconds: null,
      targetPaceSecondsPerKilometre: 300,
    },
  ],
  [
    "unexpected duration pace distance",
    {
      targetType: "DURATION_PACE",
      targetDistanceMetres: 8000,
      targetPaceSecondsPerKilometre: 300,
    },
  ],
])("trainingSessionSchema rejects %s", (_caseName, override) => {
  expect(() =>
    trainingSessionSchema.parse({
      ...baseSession,
      activityType: "RUN",
      targetType: "DISTANCE_DURATION",
      targetDistanceMetres: 8000,
      targetDurationSeconds: 2700,
      targetPaceSecondsPerKilometre: null,
      actualDistanceMetres: null,
      actualDurationSeconds: null,
      ...override,
    }),
  ).toThrow();
});
