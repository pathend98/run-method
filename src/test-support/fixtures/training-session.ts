import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";

const baseTrainingSession = {
  id: "11111111-1111-4111-8111-111111111111",
  athleteId: "33333333-3333-4333-8333-333333333333",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
} as const;

export function createStrengthTrainingSession(
  overrides: Partial<StrengthTrainingSession> = {},
): StrengthTrainingSession {
  return {
    ...baseTrainingSession,
    title: "Strength",
    activityType: "STRENGTH",
    targetDurationSeconds: 2700,
    actualDurationSeconds: null,
    ...overrides,
  };
}

export function createRunTrainingSession(
  overrides: Partial<RunTrainingSession> = {},
): RunTrainingSession {
  return {
    ...baseTrainingSession,
    title: "Tempo run",
    activityType: "RUN",
    targetDistanceMetres: 8000,
    targetDurationSeconds: 2700,
    actualDistanceMetres: null,
    actualDurationSeconds: null,
    ...overrides,
  };
}
