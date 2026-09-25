import { ApplicationError } from "./application-error";

export class ForbiddenError extends ApplicationError {
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}
