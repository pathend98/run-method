import { RequestValidationError } from "@/server/errors/request-validation-error";
import { BadRequestError } from "@/server/errors/bad-request-error";
import { NotFoundError } from "@/server/errors/not-found-error";

export class TrainingSessionsValidationError extends BadRequestError {
  constructor(message: string) {
    super(message);
    this.name = "TrainingSessionsValidationError";
  }
}

export class TrainingSessionsRequestValidationError extends RequestValidationError {
  constructor(fieldErrors: Record<string, string[]>) {
    super(fieldErrors);
    this.name = "TrainingSessionsRequestValidationError";
  }
}

export class TrainingSessionsDataIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TrainingSessionsDataIntegrityError";
  }
}

export class TrainingSessionNotFoundError extends NotFoundError {
  constructor() {
    super("Training session not found");
    this.name = "TrainingSessionNotFoundError";
  }
}
