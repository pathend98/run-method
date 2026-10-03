import { NotFoundError } from "@/server/errors/not-found-error";
import { ConflictError } from "@/server/errors/conflict-error";

export class ActiveTrainingGoalAlreadyExistsError extends ConflictError {
  constructor() {
    super("Athlete already has an active training goal");
    this.name = "ActiveTrainingGoalAlreadyExistsError";
  }
}

export class TrainingGoalNotFoundError extends NotFoundError {
  constructor() {
    super("Training goal not found");
    this.name = "TrainingGoalNotFoundError";
  }
}

export class TrainingGoalNotActiveError extends ConflictError {
  constructor() {
    super("Only active training goals can be edited");
    this.name = "TrainingGoalNotActiveError";
  }
}

export class TrainingGoalCannotCompleteError extends ConflictError {
  constructor() {
    super("Only active training goals can be completed");
    this.name = "TrainingGoalCannotCompleteError";
  }
}
