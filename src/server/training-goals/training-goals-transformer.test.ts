import type { trainingGoals } from "@db/schema";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import { DefaultTrainingGoalsTransformer } from "./training-goals-transformer";

test.each([null, "completed", "discarded"] as const)(
  "serializes timestamps and preserves %s resolution",
  (resolution) => {
    const goal = createTrainingGoal({
      resolution,
      resolvedAt: resolution === null ? null : "2026-11-25T12:00:00.000Z",
    });
    const row: typeof trainingGoals.$inferSelect = {
      ...goal,
      createdAt: new Date(goal.createdAt),
      resolvedAt: goal.resolvedAt === null ? null : new Date(goal.resolvedAt),
    };
    expect(new DefaultTrainingGoalsTransformer().transform(row)).toEqual(goal);
  },
);
