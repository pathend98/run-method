import { BadRequestError } from "@/server/errors/bad-request-error";

export class TrainingSessionsValidationError extends BadRequestError {
  constructor(message: string) {
    super(message);
    this.name = "TrainingSessionsValidationError";
  }
}

export class TrainingSessionsRequestValidationError extends BadRequestError {
  constructor(readonly fieldErrors: Record<string, string[]>) {
    super("Invalid request body");
    this.name = "TrainingSessionsRequestValidationError";
  }
}

export class TrainingSessionsDataIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TrainingSessionsDataIntegrityError";
  }
}
