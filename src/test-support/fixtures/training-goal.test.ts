import { trainingGoalSchema } from "@/domain/training-goals";
import { createTrainingGoal } from "./training-goal";

test("creates a valid independent goal with defaults and overrides", () => {
  const original = createTrainingGoal();
  expect(trainingGoalSchema.parse(original)).toEqual(original);
  const updated = createTrainingGoal({
    title: "Run regularly",
    purpose: "Run consistently",
  });
  expect(updated).toEqual({
    ...original,
    title: "Run regularly",
    purpose: "Run consistently",
  });
  updated.title = "Changed";
  expect(createTrainingGoal()).toEqual(original);
});
