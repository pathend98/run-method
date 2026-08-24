import { ApplicationError } from "./application-error";

export class BadRequestError extends ApplicationError {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}
