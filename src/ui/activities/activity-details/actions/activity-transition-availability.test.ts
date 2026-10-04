import {
  createRunActivity,
  createStrengthActivity,
} from "@/test-support/fixtures/activity";
import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import { canTransitionActivity } from "../actions/activity-transition-availability";

const now = new Date("2026-08-26T12:00:00");

const runActivity = createRunActivity({
  title: "Easy run",
  date: "2026-08-26",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1500,
}) satisfies RunTrainingSession;

const strengthActivity = createStrengthActivity({
  id: "22222222-2222-4222-8222-222222222222",
  date: "2026-08-27",
  timeOfDay: "PM",
  targetDurationSeconds: 1800,
}) satisfies StrengthTrainingSession;

test.each([
  ["same-day scheduled run", runActivity, true],
  ["past scheduled run", { ...runActivity, date: "2026-08-25" }, true],
  ["future scheduled strength activity", strengthActivity, false],
  [
    "completed activity",
    { ...runActivity, status: "COMPLETED" as const },
    false,
  ],
])(
  "allows transitions for a %s only when expected",
  (_description, activity, expected) => {
    expect(canTransitionActivity(activity, now)).toBe(expected);
  },
);
