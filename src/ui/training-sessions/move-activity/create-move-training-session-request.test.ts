import { createMoveTrainingSessionRequest } from "./create-move-training-session-request";
import type { RunTrainingSession } from "@/domain/training-sessions";
import {
  createRunActivity,
  createStrengthActivity,
} from "@/test-support/fixtures/activity";

const run = createRunActivity({
  date: "2026-09-10",
  description: "Controlled effort",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1530,
}) satisfies RunTrainingSession;

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
  const strength = createStrengthActivity({
    title: run.title,
    date: run.date,
    description: run.description,
    targetDurationSeconds: null,
  });

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
