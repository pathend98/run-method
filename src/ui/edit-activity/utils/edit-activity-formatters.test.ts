import type {
  RunTrainingSession,
  StrengthTrainingSession,
} from "@/domain/training-sessions";
import { formatLockedTargets } from "./edit-activity-formatters";

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

const run = {
  ...base,
  activityType: "RUN",
  targetType: "DISTANCE_DURATION",
  targetDistanceMetres: 6000,
  targetDurationSeconds: 1800,
  targetPaceSecondsPerKilometre: null,
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
  expect(formatLockedTargets(run)).toBe("6.0 km · 30 min");
  expect(
    formatLockedTargets({
      ...run,
      targetType: "DISTANCE_PACE",
      targetDurationSeconds: null,
      targetPaceSecondsPerKilometre: 255,
    }),
  ).toBe("6.0 km · 4:15 / km");
  expect(
    formatLockedTargets({
      ...run,
      targetType: "DURATION_PACE",
      targetDistanceMetres: null,
      targetPaceSecondsPerKilometre: 255,
    }),
  ).toBe("30 min · 4:15 / km");
});

test("formats strength duration with a missing-target fallback", () => {
  expect(formatLockedTargets(strength)).toBe("45 min");
  expect(
    formatLockedTargets({
      ...strength,
      targetDurationSeconds: null,
    }),
  ).toBe("No target duration");
});
