import { createMoveTrainingSessionRequest } from "./create-move-training-session-request";
import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";

const run = {
  id: "11111111-1111-4111-8111-111111111111",
  athleteId: "33333333-3333-4333-8333-333333333333",
  title: "Tempo run",
  activityType: "RUN",
  status: "SCHEDULED",
  date: "2026-09-10",
  timeOfDay: "AM",
  description: "Controlled effort",
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
} satisfies RunTrainingSession;

test("creates an edit request for a moved run", () => {
  expect(
    createMoveTrainingSessionRequest(run, {
      date: "2026-09-11",
      timeOfDay: "PM",
    }),
  ).toEqual({
    title: run.title,
    date: "2026-09-11",
    timeOfDay: "PM",
    description: run.description,
    activityType: "RUN",
    targetDistanceMetres: run.targetDistanceMetres,
    targetDurationSeconds: run.targetDurationSeconds,
  });
});

test("creates an edit request for a moved strength activity", () => {
  const strength = {
    ...run,
    activityType: "STRENGTH",
    targetDurationSeconds: null,
    actualDurationSeconds: null,
  } satisfies StrengthTrainingSession;

  expect(
    createMoveTrainingSessionRequest(strength, {
      date: "2026-09-11",
      timeOfDay: null,
    }),
  ).toEqual({
    title: strength.title,
    date: "2026-09-11",
    timeOfDay: null,
    description: strength.description,
    activityType: "STRENGTH",
    targetDurationSeconds: null,
  });
});
