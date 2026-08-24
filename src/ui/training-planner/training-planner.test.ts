import {
  getCurrentWeekRange,
  groupSessionsByWeekday,
  TrainingPlanner,
  TrainingPlannerContainer,
} from "./training-planner";

test("training planner module exposes its public interface", () => {
  expect(TrainingPlanner).toBeTypeOf("function");
  expect(TrainingPlannerContainer).toBeTypeOf("function");
  expect(getCurrentWeekRange).toBeTypeOf("function");
  expect(groupSessionsByWeekday).toBeTypeOf("function");
});
