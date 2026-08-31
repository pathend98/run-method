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
    distanceKilometres: "8",
    durationMinutes: "45",
    pacePerKilometre: "",
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
    distanceKilometres: "",
    durationMinutes: "45",
    pacePerKilometre: "4:15",
  });
  expect(
    getEditActivityFormValues(
      run({ targetDurationSeconds: null, targetType: "DISTANCE_PACE" }),
    ).durationMinutes,
  ).toBe("");
});

test("leaves target fields empty for strength activities", () => {
  expect(getEditActivityFormValues(strength())).toMatchObject({
    distanceKilometres: "",
    durationMinutes: "",
    pacePerKilometre: "",
  });
});
