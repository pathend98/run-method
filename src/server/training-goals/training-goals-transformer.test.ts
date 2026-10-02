import type { trainingGoals } from "@db/schema";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import { DefaultTrainingGoalsTransformer } from "./training-goals-transformer";

const goal = createTrainingGoal();
const row: typeof trainingGoals.$inferSelect = {
  ...goal,
  createdAt: new Date(goal.createdAt),
  targetDistanceMetres: null,
  targetTimeSeconds: null,
  targetDate: null,
  description: null,
};

test("serializes the timestamp and omits null optional fields", () => {
  const transformer = new DefaultTrainingGoalsTransformer();
  expect(transformer.transform(row)).toEqual(goal);
});

test("preserves populated optional fields", () => {
  const targets = {
    targetDistanceMetres: 42195,
    targetTimeSeconds: 14400,
    targetDate: "2027-04-01",
    description: "Marathon",
  };
  const transformer = new DefaultTrainingGoalsTransformer();
  expect(transformer.transform({ ...row, ...targets })).toEqual({
    ...goal,
    ...targets,
  });
});
