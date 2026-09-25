import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import { formatLockedTargets } from "./edit-activity-formatters";

const base = {
  id: "11111111-1111-4111-8111-111111111111",
  athleteId: "33333333-3333-4333-8333-333333333333",
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

const run = {
  ...base,
  activityType: "RUN",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1800,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
} satisfies RunTrainingSession;

const strength = {
  ...base,
  activityType: "STRENGTH",
  targetDurationSeconds: 2700,
  actualDurationSeconds: null,
} satisfies StrengthTrainingSession;

test("formats the available locked run targets", () => {
  expect(formatLockedTargets(run)).toBe("6.00 km · 30m");
});

test("formats strength duration with a missing-target fallback", () => {
  expect(formatLockedTargets(strength)).toBe("45m");
  expect(
    formatLockedTargets({
      ...strength,
      targetDurationSeconds: null,
    }),
  ).toBe("No target duration");
});
