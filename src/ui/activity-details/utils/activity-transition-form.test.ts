import type { RunTrainingSession, StrengthTrainingSession } from "@/domain/training-sessions";
import {
  createCompleteActivityFormSchema,
  toCompleteTrainingSessionRequest,
  toSkipTrainingSessionRequest,
} from "./activity-transition-form";

const run = {
  id: "11111111-1111-4111-8111-111111111111", title: "Run", status: "SCHEDULED", date: "2026-08-17", timeOfDay: null,
  description: null, sortOrder: 0, skipReason: null, createdAt: "2026-08-01T10:00:00.000Z", updatedAt: "2026-08-01T10:00:00.000Z",
  activityType: "RUN", targetType: "DISTANCE_DURATION", targetDistanceMetres: 5000, targetDurationSeconds: 1800,
  targetPaceSecondsPerKilometre: null, actualDistanceMetres: null, actualDurationSeconds: null,
} satisfies RunTrainingSession;

const strength = { ...run, activityType: "STRENGTH", targetDurationSeconds: null } satisfies StrengthTrainingSession;

test("converts skip and run completion form values to API requests", () => {
  expect(toSkipTrainingSessionRequest({ skipReason: "  Travel  " })).toEqual({ skipReason: "Travel" });
  expect(toCompleteTrainingSessionRequest(run, { durationHours: "00", durationMinutes: "45", durationSeconds: "30", distanceKilometres: "5.25" })).toEqual({ actualDurationSeconds: 2730, actualDistanceMetres: 5250 });
});

test("does not require or send distance when completing strength", () => {
  expect(toCompleteTrainingSessionRequest(strength, { durationHours: "00", durationMinutes: "30", durationSeconds: "00", distanceKilometres: "" })).toEqual({ actualDurationSeconds: 1800 });
});

test.each(["", "0", "10.5"])("rejects invalid actual duration seconds %s", (durationSeconds) => {
  expect(createCompleteActivityFormSchema(run).safeParse({ durationHours: "00", durationMinutes: "00", durationSeconds, distanceKilometres: "5" }).success).toBe(false);
});

test.each(["", "0", "5.1234", "five"])("rejects invalid run distance %s", (distanceKilometres) => {
  expect(createCompleteActivityFormSchema(run).safeParse({ durationHours: "00", durationMinutes: "30", durationSeconds: "00", distanceKilometres }).success).toBe(false);
});
