import { TrainingGoalCannotCompleteError } from "./training-goals-errors";
import { NotFoundError } from "@/server/errors/not-found-error";
import {
  TrainingGoalNotFoundError,
  TrainingGoalNotActiveError,
} from "./training-goals-errors";
import { ConflictError } from "@/server/errors/conflict-error";
import { ActiveTrainingGoalAlreadyExistsError } from "./training-goals-errors";

test("exposes an active goal conflict", () => {
  const error = new ActiveTrainingGoalAlreadyExistsError();
  expect(error).toBeInstanceOf(ConflictError);
  expect(error.name).toBe("ActiveTrainingGoalAlreadyExistsError");
  expect(error.message).toBe("Athlete already has an active training goal");
});

test("exposes a missing goal error", () => {
  const error = new TrainingGoalNotFoundError();
  expect(error).toBeInstanceOf(NotFoundError);
  expect(error.name).toBe("TrainingGoalNotFoundError");
  expect(error.message).toBe("Training goal not found");
});
test("exposes an inactive goal conflict", () => {
  const error = new TrainingGoalNotActiveError();
  expect(error).toBeInstanceOf(ConflictError);
  expect(error.name).toBe("TrainingGoalNotActiveError");
  expect(error.message).toBe("Only active training goals can be edited");
});

test("exposes a completion conflict", () => {
  const error = new TrainingGoalCannotCompleteError();
  expect(error).toBeInstanceOf(ConflictError);
  expect(error.name).toBe("TrainingGoalCannotCompleteError");
  expect(error.message).toBe("Only active training goals can be completed");
});
