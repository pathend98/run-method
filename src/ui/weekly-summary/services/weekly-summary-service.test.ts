import type {
  RunTrainingSession,
  TrainingSession,
} from "@/domain/training-sessions";
import {
  createRunActivity,
  createStrengthActivity,
} from "@/test-support/fixtures/activity";
import { getWeeklySummary } from "./weekly-summary-service";

const activities: TrainingSession[] = [
  createRunActivity({
    title: "Activity",
    timeOfDay: null,
    actualDistanceMetres: 9500,
    actualDurationSeconds: 3600,
    status: "COMPLETED",
    targetDistanceMetres: 10000,
    targetDurationSeconds: 3000,
  }),
  createStrengthActivity({
    id: "22222222-2222-4222-8222-222222222222",
    title: "Activity",
    timeOfDay: null,
    actualDurationSeconds: 1800,
    status: "COMPLETED",
    targetDurationSeconds: null,
  }),
  createRunActivity({
    id: "33333333-3333-4333-8333-333333333333",
    date: "2026-08-20",
    title: "Activity",
    timeOfDay: null,
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1800,
  }),
  createStrengthActivity({
    id: "44444444-4444-4444-8444-444444444444",
    title: "Activity",
    timeOfDay: null,
    skipReason: "Tired",
    status: "SKIPPED",
    targetDurationSeconds: 1200,
  }),
  createStrengthActivity({
    id: "55555555-5555-4555-8555-555555555555",
    date: "2026-08-22",
    title: "Activity",
    timeOfDay: null,
  }),
];

test("summarises current-week actuals, original plan totals, and activity state", () => {
  expect(
    getWeeklySummary(
      activities,
      { from: "2026-08-17", to: "2026-08-23" },
      "2026-08-20",
    ),
  ).toEqual({
    completedDistanceMetres: 9500,
    completedDurationSeconds: 5400,
    isFutureWeek: false,
    isPastWeek: false,
    scheduledDistanceMetres: 15000,
    scheduledDurationSeconds: 8700,
    activities: { completed: 2, due: 1, scheduled: 5, skipped: 1, upcoming: 1 },
  });
});

test("marks outstanding activities as due for a past week", () => {
  const summary = getWeeklySummary(
    activities,
    { from: "2026-08-17", to: "2026-08-23" },
    "2026-08-24",
  );

  expect(summary.isPastWeek).toBe(true);
  expect(summary.activities).toEqual({
    completed: 2,
    due: 2,
    scheduled: 5,
    skipped: 1,
    upcoming: 0,
  });
});

test("treats absent actual metrics as zero defensively", () => {
  const completedRun = activities[0] as RunTrainingSession;
  const completedRunWithoutActuals: TrainingSession = {
    ...completedRun,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
  };

  expect(
    getWeeklySummary(
      [completedRunWithoutActuals],
      { from: "2026-08-17", to: "2026-08-23" },
      "2026-08-20",
    ),
  ).toMatchObject({
    completedDistanceMetres: 0,
    completedDurationSeconds: 0,
  });
});

test("shows future weeks as entirely scheduled", () => {
  const summary = getWeeklySummary(
    activities,
    { from: "2026-08-17", to: "2026-08-23" },
    "2026-08-16",
  );

  expect(summary.isFutureWeek).toBe(true);
  expect(summary.activities.scheduled).toBe(5);
});

test("summarises an empty current week with zero counts", () => {
  expect(
    getWeeklySummary(
      [],
      { from: "2026-08-17", to: "2026-08-23" },
      "2026-08-20",
    ),
  ).toMatchObject({
    isFutureWeek: false,
    activities: { completed: 0, due: 0, scheduled: 0, skipped: 0, upcoming: 0 },
  });
});
