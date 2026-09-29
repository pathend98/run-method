import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import {
  createRunActivity,
  createStrengthActivity,
} from "@/test-support/fixtures/activity";
import { getEditActivityFormValues } from "./edit-activity-form-values";
import { toEditTrainingSessionRequest } from "./edit-training-session-request";

function run(override: Partial<RunTrainingSession> = {}): RunTrainingSession {
  return createRunActivity({
    description: "Controlled effort",
    ...override,
  });
}

function strength(
  override: Partial<StrengthTrainingSession> = {},
): StrengthTrainingSession {
  return createStrengthActivity({
    description: "Controlled effort",
    targetDurationSeconds: 2400,
    ...override,
  });
}

test("converts scheduled run edits to canonical targets", () => {
  const activity = run();
  const request = toEditTrainingSessionRequest(
    {
      ...getEditActivityFormValues(activity, "KILOMETRES"),
      title: " Updated run ",
      description: " ",
      date: "2026-08-20",
      timeOfDay: "ANY",
      distance: "10.125",
      durationMinutes: "50",
    },
    activity,
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
    const activity = strength();
    const request = toEditTrainingSessionRequest(
      {
        ...getEditActivityFormValues(activity, "KILOMETRES"),
        title: "Gym",
        date: "2026-08-20",
        timeOfDay: "PM",
        ...duration,
      },
      activity,
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
  "preserves the locked duration for a %s strength activity",
  (status) => {
    const activity = strength({
      status,
      skipReason: status === "SKIPPED" ? "Rest" : null,
    });
    const request = toEditTrainingSessionRequest(
      {
        ...getEditActivityFormValues(activity, "KILOMETRES"),
        durationHours: "999",
      },
      activity,
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
])("preserves locked terminal run values", (activity) => {
  const request = toEditTrainingSessionRequest(
    {
      ...getEditActivityFormValues(activity, "KILOMETRES"),
      title: "Renamed",
      timeOfDay: "PM",
      distance: "999",
      durationHours: "999",
      pace: "9:59",
    },
    activity,
    "KILOMETRES",
  );

  expect(request.timeOfDay).toBe(activity.timeOfDay);
  expect(request.date).toBeUndefined();
  if (request.activityType === "RUN") {
    expect(request.targetDistanceMetres).toBe(activity.targetDistanceMetres);
    expect(request.targetDurationSeconds).toBe(activity.targetDurationSeconds);
  }
});

test("converts completed actual metrics while preserving run targets", () => {
  const activity = run({
    status: "COMPLETED",
    actualDistanceMetres: 8000,
    actualDurationSeconds: 2700,
  });
  const request = toEditTrainingSessionRequest(
    {
      ...getEditActivityFormValues(activity, "KILOMETRES"),
      distance: "8.5",
      durationMinutes: "46",
    },
    activity,
    "KILOMETRES",
  );

  expect(request).toMatchObject({
    targetDistanceMetres: activity.targetDistanceMetres,
    targetDurationSeconds: activity.targetDurationSeconds,
    actualDistanceMetres: 8500,
    actualDurationSeconds: 2760,
  });
});

test("converts completed strength actual duration while preserving its target", () => {
  const activity = strength({
    status: "COMPLETED",
    actualDurationSeconds: 2400,
  });
  const request = toEditTrainingSessionRequest(
    {
      ...getEditActivityFormValues(activity, "KILOMETRES"),
      durationMinutes: "45",
    },
    activity,
    "KILOMETRES",
  );

  expect(request).toMatchObject({
    targetDurationSeconds: activity.targetDurationSeconds,
    actualDurationSeconds: 2700,
  });
});

test("preserves an untouched rounded mile distance when editing a run", () => {
  const activity = run({ targetDistanceMetres: 8001 });
  const values = getEditActivityFormValues(activity, "MILES");
  expect(values.distance).toBe("4.972");
  expect(
    toEditTrainingSessionRequest(
      { ...values, title: "Renamed" },
      activity,
      "MILES",
    ),
  ).toMatchObject({ targetDistanceMetres: 8001 });
  expect(
    toEditTrainingSessionRequest(
      { ...values, distance: "5" },
      activity,
      "MILES",
    ),
  ).toMatchObject({ targetDistanceMetres: 8047 });
});

test("converts edited completed run actuals from miles", () => {
  const activity = run({
    status: "COMPLETED",
    actualDistanceMetres: 8001,
    actualDurationSeconds: 2700,
  });
  const values = getEditActivityFormValues(activity, "MILES");
  expect(toEditTrainingSessionRequest(values, activity, "MILES")).toMatchObject(
    { actualDistanceMetres: 8001 },
  );
  expect(
    toEditTrainingSessionRequest(
      { ...values, distance: "5" },
      activity,
      "MILES",
    ),
  ).toMatchObject({ actualDistanceMetres: 8047 });
});
