import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import {
  calculatePaceSecondsPerKilometre,
  createCompleteActivityFormSchema,
  toCompleteTrainingSessionRequest,
} from "./complete-activity-form";

const run = {
  id: "11111111-1111-4111-8111-111111111111",
  athleteId: "33333333-3333-4333-8333-333333333333",
  title: "Run",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: null,
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  activityType: "RUN",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1800,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
} satisfies RunTrainingSession;
const strength = {
  ...run,
  activityType: "STRENGTH",
  targetDurationSeconds: null,
} satisfies StrengthTrainingSession;
const fields = {
  derivedMetric: "pace" as const,
  pacePerKilometre: "5:00",
  durationHours: "00",
  durationMinutes: "30",
  durationSeconds: "00",
  distanceKilometres: "5",
};

test("validates and converts run and strength actuals", () => {
  expect(calculatePaceSecondsPerKilometre(5000, 1500)).toBe(300);
  expect(toCompleteTrainingSessionRequest(run, fields)).toEqual({
    actualDurationSeconds: 1800,
    actualDistanceMetres: 5000,
  });
  expect(
    toCompleteTrainingSessionRequest(strength, {
      ...fields,
      distanceKilometres: "",
    }),
  ).toEqual({ actualDurationSeconds: 1800 });
});

test.each(["", "0", "5.1234", "five"])(
  "rejects invalid run distance %s",
  (distanceKilometres) => {
    expect(
      createCompleteActivityFormSchema(run).safeParse({
        ...fields,
        distanceKilometres,
      }).success,
    ).toBe(false);
  },
);

test("requires a non-zero duration", () => {
  expect(
    createCompleteActivityFormSchema(run).safeParse({
      ...fields,
      durationMinutes: "00",
    }).success,
  ).toBe(false);
});
