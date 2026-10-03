import { ConflictError } from "@/server/errors/conflict-error";
import { ActiveTrainingGoalAlreadyExistsError } from "./training-goals-errors";

test("exposes an active goal conflict", () => {
  const error = new ActiveTrainingGoalAlreadyExistsError();
  expect(error).toBeInstanceOf(ConflictError);
  expect(error.name).toBe("ActiveTrainingGoalAlreadyExistsError");
  expect(error.message).toBe("Athlete already has an active training goal");
});
