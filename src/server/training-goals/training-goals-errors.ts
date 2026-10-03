import { ConflictError } from "@/server/errors/conflict-error";

export class ActiveTrainingGoalAlreadyExistsError extends ConflictError {
  constructor() {
    super("Athlete already has an active training goal");
    this.name = "ActiveTrainingGoalAlreadyExistsError";
  }
}
