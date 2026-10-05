import type { RunTrainingSession } from "@/domain/training-sessions";
import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
import {
  createCompleteActivityFormSchema,
  toCompleteTrainingSessionRequest,
} from "./complete-activity-form";

const run = createRunTrainingSession({
  title: "Run",
  timeOfDay: null,
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1800,
}) satisfies RunTrainingSession;
const strength = createStrengthTrainingSession({
  title: run.title,
  timeOfDay: run.timeOfDay,
  targetDurationSeconds: null,
});
const fields = {
  derivedMetric: "pace" as const,
  pace: "5:00",
  durationHours: "00",
  durationMinutes: "30",
  durationSeconds: "00",
  distance: "5",
};

test("validates and converts run and strength actuals", () => {
  expect(toCompleteTrainingSessionRequest(run, fields, "KILOMETRES")).toEqual({
    actualDurationSeconds: 1800,
    actualDistanceMetres: 5000,
  });
  expect(
    toCompleteTrainingSessionRequest(
      strength,
      {
        ...fields,
        distance: "",
      },
      "KILOMETRES",
    ),
  ).toEqual({ actualDurationSeconds: 1800 });
});

test.each(["", "0", "5.1234", "five"])(
  "rejects invalid run distance %s",
  (distance) => {
    expect(
      createCompleteActivityFormSchema(run, "KILOMETRES").safeParse({
        ...fields,
        distance,
      }).success,
    ).toBe(false);
  },
);

test("requires a non-zero duration", () => {
  expect(
    createCompleteActivityFormSchema(run, "KILOMETRES").safeParse({
      ...fields,
      durationMinutes: "00",
    }).success,
  ).toBe(false);
});

test("preserves the planned metres when mile prefill is submitted unchanged", () => {
  const planned = { ...run, targetDistanceMetres: 6001 };
  const values = { ...fields, distance: "3.729" };
  expect(
    toCompleteTrainingSessionRequest(planned, values, "MILES"),
  ).toMatchObject({ actualDistanceMetres: 6001 });
  expect(
    toCompleteTrainingSessionRequest(
      planned,
      { ...values, distance: "5" },
      "MILES",
    ),
  ).toMatchObject({ actualDistanceMetres: 8047 });
  const invalid = createCompleteActivityFormSchema(planned, "MILES").safeParse({
    ...values,
    distance: "3.1234",
  });
  expect(invalid.success).toBe(false);
  if (!invalid.success) {
    expect(invalid.error.issues[0].message).toBe("Enter a distance in miles");
  }
});

test("preserves the planned metres when a kilometre prefill is submitted unchanged", () => {
  const planned = { ...run, targetDistanceMetres: 6001 };
  expect(
    toCompleteTrainingSessionRequest(
      planned,
      { ...fields, distance: "6.001" },
      "KILOMETRES",
    ),
  ).toMatchObject({ actualDistanceMetres: 6001 });
});
