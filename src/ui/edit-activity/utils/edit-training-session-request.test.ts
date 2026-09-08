import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import { getEditActivityFormValues } from "./edit-activity-form-values";
import { toEditTrainingSessionRequest } from "./edit-training-session-request";

const base = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Tempo run",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: "Controlled effort",
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
} as const;

function run(override: Partial<RunTrainingSession> = {}): RunTrainingSession {
  return {
    ...base,
    activityType: "RUN",
    targetDistanceMetres: 8000,
    targetDurationSeconds: 2700,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
    ...override,
  } as RunTrainingSession;
}

function strength(
  override: Partial<StrengthTrainingSession> = {},
): StrengthTrainingSession {
  return {
    ...base,
    activityType: "STRENGTH",
    targetDurationSeconds: 2400,
    actualDurationSeconds: null,
    ...override,
  };
}

test("converts scheduled run edits to canonical targets", () => {
  const activity = run();
  const request = toEditTrainingSessionRequest(
    {
      ...getEditActivityFormValues(activity),
      title: " Updated run ",
      description: " ",
      date: "2026-08-20",
      timeOfDay: "ANY",
      distanceKilometres: "10.125",
      durationMinutes: "50",
    },
    activity,
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
        ...getEditActivityFormValues(activity),
        title: "Gym",
        date: "2026-08-20",
        timeOfDay: "PM",
        ...duration,
      },
      activity,
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
        ...getEditActivityFormValues(activity),
        durationHours: "999",
      },
      activity,
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
      ...getEditActivityFormValues(activity),
      title: "Renamed",
      timeOfDay: "PM",
      distanceKilometres: "999",
      durationHours: "999",
      pacePerKilometre: "9:59",
    },
    activity,
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
      ...getEditActivityFormValues(activity),
      distanceKilometres: "8.5",
      durationMinutes: "46",
    },
    activity,
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
    { ...getEditActivityFormValues(activity), durationMinutes: "45" },
    activity,
  );

  expect(request).toMatchObject({
    targetDurationSeconds: activity.targetDurationSeconds,
    actualDurationSeconds: 2700,
  });
});
