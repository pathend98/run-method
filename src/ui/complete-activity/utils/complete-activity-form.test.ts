import type { RunTrainingSession } from "@/domain/training-sessions";
import {
  createRunActivity,
  createStrengthActivity,
} from "@/test-support/fixtures/activity";
import {
  calculatePaceSecondsPerKilometre,
  createCompleteActivityFormSchema,
  toCompleteTrainingSessionRequest,
} from "./complete-activity-form";

const run = createRunActivity({
  title: "Run",
  timeOfDay: null,
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1800,
}) satisfies RunTrainingSession;
const strength = createStrengthActivity({
  title: run.title,
  timeOfDay: run.timeOfDay,
  targetDurationSeconds: null,
});
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
