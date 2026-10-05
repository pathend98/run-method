import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import {
  createRunTrainingSession,
  createStrengthTrainingSession,
} from "@/test-support/fixtures/training-session";
import { getEditTrainingSessionFormValues } from "./edit-training-session-form-values";
import { toEditTrainingSessionRequest } from "./edit-training-session-request";

function run(override: Partial<RunTrainingSession> = {}): RunTrainingSession {
  return createRunTrainingSession({
    description: "Controlled effort",
    ...override,
  });
}

function strength(
  override: Partial<StrengthTrainingSession> = {},
): StrengthTrainingSession {
  return createStrengthTrainingSession({
    description: "Controlled effort",
    targetDurationSeconds: 2400,
    ...override,
  });
}

test("converts scheduled run edits to canonical targets", () => {
  const trainingSession = run();
  const request = toEditTrainingSessionRequest(
    {
      ...getEditTrainingSessionFormValues(trainingSession, "KILOMETRES"),
      title: " Updated run ",
      description: " ",
      date: "2026-08-20",
      timeOfDay: "ANY",
      distance: "10.125",
      durationMinutes: "50",
    },
    trainingSession,
    "KILOMETRES",
  );

  expect(request).toEqual({
    title: "Updated run",
    description: null,
    date: "2026-08-20",
    timeOfDay: null,
    activityType: "RUN",
    targetDistanceMetres: 10125,
    targetDurationSeconds: 3000,
  });
});

test.each([
  [{ durationHours: "01", durationMinutes: "00", durationSeconds: "00" }, 3600],
  [{ durationHours: "00", durationMinutes: "00", durationSeconds: "00" }, null],
] as const)(
  "converts a scheduled strength duration of %#",
  (duration, targetDurationSeconds) => {
    const trainingSession = strength();
    const request = toEditTrainingSessionRequest(
      {
        ...getEditTrainingSessionFormValues(trainingSession, "KILOMETRES"),
        title: "Gym",
        date: "2026-08-20",
        timeOfDay: "PM",
        ...duration,
      },
      trainingSession,
      "KILOMETRES",
    );

    expect(request).toEqual({
      title: "Gym",
      description: "Controlled effort",
      date: "2026-08-20",
      timeOfDay: "PM",
      activityType: "STRENGTH",
      targetDurationSeconds,
    });
  },
);

test.each(["COMPLETED", "SKIPPED"] as const)(
  "preserves the locked duration for a %s strength training session",
  (status) => {
    const trainingSession = strength({
      status,
      skipReason: status === "SKIPPED" ? "Rest" : null,
    });
    const request = toEditTrainingSessionRequest(
      {
        ...getEditTrainingSessionFormValues(trainingSession, "KILOMETRES"),
        durationHours: "999",
      },
      trainingSession,
      "KILOMETRES",
    );

    expect(request).toMatchObject({ targetDurationSeconds: 2400 });
  },
);

test.each([
  run({ status: "COMPLETED" }),
  run({
    status: "SKIPPED",
    skipReason: "Tired",
  }),
])("preserves locked terminal run values", (trainingSession) => {
  const request = toEditTrainingSessionRequest(
    {
      ...getEditTrainingSessionFormValues(trainingSession, "KILOMETRES"),
      title: "Renamed",
      timeOfDay: "PM",
      distance: "999",
      durationHours: "999",
      pace: "9:59",
    },
    trainingSession,
    "KILOMETRES",
  );

  expect(request.timeOfDay).toBe(trainingSession.timeOfDay);
  expect(request.date).toBeUndefined();
  if (request.activityType === "RUN") {
    expect(request.targetDistanceMetres).toBe(
      trainingSession.targetDistanceMetres,
    );
    expect(request.targetDurationSeconds).toBe(
      trainingSession.targetDurationSeconds,
    );
  }
});

test("converts completed actual metrics while preserving run targets", () => {
  const trainingSession = run({
    status: "COMPLETED",
    actualDistanceMetres: 8000,
    actualDurationSeconds: 2700,
  });
  const request = toEditTrainingSessionRequest(
    {
      ...getEditTrainingSessionFormValues(trainingSession, "KILOMETRES"),
      distance: "8.5",
      durationMinutes: "46",
    },
    trainingSession,
    "KILOMETRES",
  );

  expect(request).toMatchObject({
    targetDistanceMetres: trainingSession.targetDistanceMetres,
    targetDurationSeconds: trainingSession.targetDurationSeconds,
    actualDistanceMetres: 8500,
    actualDurationSeconds: 2760,
  });
});

test("converts completed strength actual duration while preserving its target", () => {
  const trainingSession = strength({
    status: "COMPLETED",
    actualDurationSeconds: 2400,
  });
  const request = toEditTrainingSessionRequest(
    {
      ...getEditTrainingSessionFormValues(trainingSession, "KILOMETRES"),
      durationMinutes: "45",
    },
    trainingSession,
    "KILOMETRES",
  );

  expect(request).toMatchObject({
    targetDurationSeconds: trainingSession.targetDurationSeconds,
    actualDurationSeconds: 2700,
  });
});

test("preserves an untouched rounded mile distance when editing a run", () => {
  const trainingSession = run({ targetDistanceMetres: 8001 });
  const values = getEditTrainingSessionFormValues(trainingSession, "MILES");
  expect(values.distance).toBe("4.972");
  expect(
    toEditTrainingSessionRequest(
      { ...values, title: "Renamed" },
      trainingSession,
      "MILES",
    ),
  ).toMatchObject({ targetDistanceMetres: 8001 });
  expect(
    toEditTrainingSessionRequest(
      { ...values, distance: "5" },
      trainingSession,
      "MILES",
    ),
  ).toMatchObject({ targetDistanceMetres: 8047 });
});

test("converts edited completed run actuals from miles", () => {
  const trainingSession = run({
    status: "COMPLETED",
    actualDistanceMetres: 8001,
    actualDurationSeconds: 2700,
  });
  const values = getEditTrainingSessionFormValues(trainingSession, "MILES");
  expect(
    toEditTrainingSessionRequest(values, trainingSession, "MILES"),
  ).toMatchObject({ actualDistanceMetres: 8001 });
  expect(
    toEditTrainingSessionRequest(
      { ...values, distance: "5" },
      trainingSession,
      "MILES",
    ),
  ).toMatchObject({ actualDistanceMetres: 8047 });
});
