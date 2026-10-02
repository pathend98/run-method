import { RequestValidationError } from "./request-validation-error";

export class RequestBodyValidationError extends RequestValidationError {
  constructor(fieldErrors: Record<string, string[]>) {
    super(fieldErrors);
    this.name = "RequestBodyValidationError";
  }
}
