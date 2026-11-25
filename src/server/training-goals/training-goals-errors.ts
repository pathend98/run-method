import { NotFoundError } from "@/server/errors/not-found-error";
import { ConflictError } from "@/server/errors/conflict-error";

export class TrainingGoalOverlapError extends ConflictError {
  constructor() {
    super("Training goal overlaps an unresolved training goal");
    this.name = "TrainingGoalOverlapError";
  }
}

export class TrainingGoalNotFoundError extends NotFoundError {
  constructor() {
    super("Training goal not found");
    this.name = "TrainingGoalNotFoundError";
  }
}

export class TrainingGoalAlreadyResolvedError extends ConflictError {
  constructor() {
    super("Only unresolved training goals can be edited");
    this.name = "TrainingGoalAlreadyResolvedError";
  }
}

export class TrainingGoalCannotCompleteError extends ConflictError {
  constructor() {
    super("Only unresolved training goals can be completed");
    this.name = "TrainingGoalCannotCompleteError";
  }
}

export class TrainingGoalCannotDiscardError extends ConflictError {
  constructor() {
    super("Only unresolved training goals can be discarded");
    this.name = "TrainingGoalCannotDiscardError";
  }
}
