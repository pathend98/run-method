import { ApplicationError } from "./application-error";

export class UnauthorizedError extends ApplicationError {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
