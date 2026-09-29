import { createRunActivity, createStrengthActivity } from "./activity";

test("creates scheduled strength and run activities with their distinct fields", () => {
  expect(createStrengthActivity()).toEqual({
    id: "11111111-1111-4111-8111-111111111111",
    athleteId: "33333333-3333-4333-8333-333333333333",
    title: "Strength",
    activityType: "STRENGTH",
    status: "SCHEDULED",
    date: "2026-08-17",
    timeOfDay: "AM",
    description: null,
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    targetDurationSeconds: 2700,
    actualDurationSeconds: null,
  });
  expect(createRunActivity()).toEqual({
    id: "11111111-1111-4111-8111-111111111111",
    athleteId: "33333333-3333-4333-8333-333333333333",
    title: "Tempo run",
    activityType: "RUN",
    status: "SCHEDULED",
    date: "2026-08-17",
    timeOfDay: "AM",
    description: null,
    sortOrder: 0,
    skipReason: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    targetDistanceMetres: 8000,
    targetDurationSeconds: 2700,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
  });
});

test("applies overrides without changing later activities", () => {
  const strength = createStrengthActivity({
    status: "COMPLETED",
    actualDurationSeconds: 2400,
  });
  const run = createRunActivity({
    title: "Easy run",
    targetDistanceMetres: 5000,
  });

  expect(strength).toMatchObject({
    status: "COMPLETED",
    actualDurationSeconds: 2400,
  });
  expect(run).toMatchObject({ title: "Easy run", targetDistanceMetres: 5000 });
  expect(createStrengthActivity()).not.toBe(strength);
  expect(createRunActivity()).not.toBe(run);
  expect(createStrengthActivity().actualDurationSeconds).toBeNull();
  expect(createRunActivity().targetDistanceMetres).toBe(8000);
});
