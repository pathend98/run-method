import { trainingSessionSchema } from "./training-sessions";

test("trainingSessionSchema validates the read model", () => {
  expect(
    trainingSessionSchema.parse({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Easy run",
      activityType: "Run",
      date: "2026-08-17",
      timeOfDay: "AM",
      description: null,
      sortOrder: 0,
    }),
  ).toEqual({
    id: "11111111-1111-4111-8111-111111111111",
    title: "Easy run",
    activityType: "Run",
    date: "2026-08-17",
    timeOfDay: "AM",
    description: null,
    sortOrder: 0,
  });
});

test.each([
  ["empty title", { title: "" }],
  ["empty activity type", { activityType: "" }],
  ["invalid id", { id: "not-a-uuid" }],
  ["invalid date", { date: "2026-02-30" }],
  ["invalid time of day", { timeOfDay: "NOON" }],
  ["empty description", { description: "" }],
  ["negative sort order", { sortOrder: -1 }],
  ["decimal sort order", { sortOrder: 1.5 }],
])("trainingSessionSchema rejects %s", (_caseName, override) => {
  expect(() =>
    trainingSessionSchema.parse({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Easy run",
      activityType: "Run",
      date: "2026-08-17",
      timeOfDay: "AM",
      description: null,
      sortOrder: 0,
      ...override,
    }),
  ).toThrow();
});
