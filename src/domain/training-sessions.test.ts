import { parseDateParam, trainingSessionSchema } from "./training-sessions";

test("parseDateParam accepts strict ISO dates", () => {
  expect(parseDateParam("2026-08-17")).toBeInstanceOf(Date);
});

test("parseDateParam rejects invalid or non-normalized dates", () => {
  expect(parseDateParam("2026-02-30")).toBeNull();
  expect(parseDateParam("08/17/2026")).toBeNull();
});

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
  ).toMatchObject({ title: "Easy run" });
});
