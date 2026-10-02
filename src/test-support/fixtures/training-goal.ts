import type { TrainingGoal } from "@/domain/training-goals";

const baseGoal: TrainingGoal = {
  id: "11111111-1111-4111-8111-111111111111",
  athleteId: "33333333-3333-4333-8333-333333333333",
  title: "Run a marathon",
  type: "RACE",
  status: "ACTIVE",
  createdAt: "2026-10-02T12:00:00.000Z",
};

export function createTrainingGoal(
  overrides: Partial<TrainingGoal> = {},
): TrainingGoal {
  return { ...baseGoal, ...overrides };
}
