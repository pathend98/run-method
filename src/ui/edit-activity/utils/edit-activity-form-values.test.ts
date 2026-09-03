import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import { getEditActivityFormValues } from "./edit-activity-form-values";

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

function strength(): StrengthTrainingSession {
  return {
    ...base,
    activityType: "STRENGTH",
    targetDurationSeconds: 2400,
    actualDurationSeconds: null,
  };
}

test("initializes common and run target values", () => {
  expect(getEditActivityFormValues(run())).toEqual({
    title: "Tempo run",
    timeOfDay: "AM",
    description: "Controlled effort",
    derivedMetric: "pace",
    distanceKilometres: "8",
    durationHours: "00",
    durationMinutes: "45",
    durationSeconds: "00",
    pacePerKilometre: "5:38",
  });
});

test("maps null values and formats pace", () => {
  expect(
    getEditActivityFormValues(
      run({
        timeOfDay: null,
        description: null,
        targetType: "DURATION_PACE",
        targetDistanceMetres: null,
        targetPaceSecondsPerKilometre: 255,
      }),
    ),
  ).toEqual({
    title: "Tempo run",
    timeOfDay: "ANY",
    description: "",
    derivedMetric: "distance",
    distanceKilometres: "10.588",
    durationHours: "00",
    durationMinutes: "45",
    durationSeconds: "00",
    pacePerKilometre: "4:15",
  });
  expect(
    getEditActivityFormValues(
      run({ targetDurationSeconds: null, targetType: "DISTANCE_PACE" }),
  ).durationMinutes,
  ).toBe("00");
});

test("derives duration for a distance and pace target", () => {
  expect(
    getEditActivityFormValues(
      run({
        targetType: "DISTANCE_PACE",
        targetDurationSeconds: null,
        targetPaceSecondsPerKilometre: 300,
      }),
    ),
  ).toMatchObject({
    derivedMetric: "duration",
    durationHours: "00",
    durationMinutes: "40",
    durationSeconds: "00",
  });
});

test("initializes the optional duration for strength activities", () => {
  expect(getEditActivityFormValues(strength())).toMatchObject({
    distanceKilometres: "",
    durationMinutes: "40",
    pacePerKilometre: "",
  });

  expect(
    getEditActivityFormValues({
      ...strength(),
      targetDurationSeconds: null,
    }).durationMinutes,
  ).toBe("00");
});
