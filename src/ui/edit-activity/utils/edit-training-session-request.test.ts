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
    targetType: "DISTANCE_DURATION",
    targetDistanceMetres: 8000,
    targetDurationSeconds: 2700,
    targetPaceSecondsPerKilometre: null,
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

test.each([
  [
    "DISTANCE_DURATION",
    run(),
    { distanceKilometres: "10.125", durationMinutes: "50" },
    { targetDistanceMetres: 10125, targetDurationSeconds: 3000 },
  ],
  [
    "DISTANCE_PACE",
    run({
      targetType: "DISTANCE_PACE",
      targetDurationSeconds: null,
      targetPaceSecondsPerKilometre: 300,
    }),
    { distanceKilometres: "5", pacePerKilometre: "4:20" },
    { targetDistanceMetres: 5000, targetPaceSecondsPerKilometre: 260 },
  ],
  [
    "DURATION_PACE",
    run({
      targetType: "DURATION_PACE",
      targetDistanceMetres: null,
      targetPaceSecondsPerKilometre: 300,
    }),
    { durationMinutes: "60", pacePerKilometre: "5:10" },
    { targetDurationSeconds: 3600, targetPaceSecondsPerKilometre: 310 },
  ],
] as const)(
  "converts scheduled %s run edits",
  (_name, activity, fields, expected) => {
    const request = toEditTrainingSessionRequest(
      {
        ...getEditActivityFormValues(activity),
        title: " Updated run ",
        description: " ",
        timeOfDay: "ANY",
        ...fields,
      },
      activity,
    );

    expect(request).toMatchObject({
      title: "Updated run",
      description: null,
      timeOfDay: null,
      activityType: "RUN",
      targetType: activity.targetType,
      ...expected,
    });
  },
);

test.each([
  ["60", 3600],
  ["", null],
] as const)(
  "converts a scheduled strength duration of %#",
  (durationMinutes, targetDurationSeconds) => {
    const activity = strength();
    const request = toEditTrainingSessionRequest(
      {
        ...getEditActivityFormValues(activity),
        title: "Gym",
        timeOfDay: "PM",
        durationMinutes,
      },
      activity,
    );

    expect(request).toEqual({
      title: "Gym",
      description: "Controlled effort",
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
        durationMinutes: "999",
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
    targetType: "DISTANCE_PACE",
    targetDurationSeconds: null,
    targetPaceSecondsPerKilometre: 300,
  }),
  run({
    status: "COMPLETED",
    targetType: "DURATION_PACE",
    targetDistanceMetres: null,
    targetPaceSecondsPerKilometre: 300,
  }),
])("preserves locked terminal run values", (activity) => {
  const request = toEditTrainingSessionRequest(
    {
      ...getEditActivityFormValues(activity),
      title: "Renamed",
      timeOfDay: "PM",
      distanceKilometres: "999",
      durationMinutes: "999",
      pacePerKilometre: "9:59",
    },
    activity,
  );

  expect(request.timeOfDay).toBe(activity.timeOfDay);
  if (request.activityType === "RUN") {
    expect(request.targetType).toBe(activity.targetType);
  }
});
