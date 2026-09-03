import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import { canTransitionActivity } from "./activity-transition-availability";

const now = new Date("2026-08-26T12:00:00");

const runActivity = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Easy run",
  activityType: "RUN",
  status: "SCHEDULED",
  date: "2026-08-26",
  timeOfDay: "AM",
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  targetDistanceMetres: 5000,
  targetDurationSeconds: 1500,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
} satisfies RunTrainingSession;

const strengthActivity = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "Strength",
  activityType: "STRENGTH",
  status: "SCHEDULED",
  date: "2026-08-27",
  timeOfDay: "PM",
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  targetDurationSeconds: 1800,
  actualDurationSeconds: null,
} satisfies StrengthTrainingSession;

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
