import { TrainingGoalCannotDiscardError } from "./training-goals-errors";
import { TrainingGoalCannotCompleteError } from "./training-goals-errors";
import { NotFoundError } from "@/server/errors/not-found-error";
import {
  TrainingGoalNotFoundError,
  TrainingGoalAlreadyResolvedError,
} from "./training-goals-errors";
import { ConflictError } from "@/server/errors/conflict-error";
import { TrainingGoalOverlapError } from "./training-goals-errors";

test("exposes an overlap conflict", () => {
  const error = new TrainingGoalOverlapError();
  expect(error).toBeInstanceOf(ConflictError);
  expect(error.name).toBe("TrainingGoalOverlapError");
  expect(error.message).toBe(
    "Training goal overlaps an unresolved training goal",
  );
});

test("exposes a missing goal error", () => {
  const error = new TrainingGoalNotFoundError();
  expect(error).toBeInstanceOf(NotFoundError);
  expect(error.name).toBe("TrainingGoalNotFoundError");
  expect(error.message).toBe("Training goal not found");
});
test("exposes a resolved goal conflict", () => {
  const error = new TrainingGoalAlreadyResolvedError();
  expect(error).toBeInstanceOf(ConflictError);
  expect(error.name).toBe("TrainingGoalAlreadyResolvedError");
  expect(error.message).toBe("Only unresolved training goals can be edited");
});

test("exposes a completion conflict", () => {
  const error = new TrainingGoalCannotCompleteError();
  expect(error).toBeInstanceOf(ConflictError);
  expect(error.name).toBe("TrainingGoalCannotCompleteError");
  expect(error.message).toBe("Only unresolved training goals can be completed");
});

test("exposes a discard conflict", () => {
  const error = new TrainingGoalCannotDiscardError();
  expect(error).toBeInstanceOf(ConflictError);
  expect(error.name).toBe("TrainingGoalCannotDiscardError");
  expect(error.message).toBe("Only unresolved training goals can be discarded");
});
