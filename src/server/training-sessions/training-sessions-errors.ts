import { BadRequestError } from "@/server/errors/bad-request-error";

export class TrainingSessionsValidationError extends BadRequestError {
  constructor(message: string) {
    super(message);
    this.name = "TrainingSessionsValidationError";
  }
}

export class TrainingSessionsDataIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TrainingSessionsDataIntegrityError";
  }
}
