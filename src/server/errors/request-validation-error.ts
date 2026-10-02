import { BadRequestError } from "./bad-request-error";

export class RequestValidationError extends BadRequestError {
  constructor(readonly fieldErrors: Record<string, string[]>) {
    super("Invalid request body");
    this.name = "RequestValidationError";
  }
}
