import { ApplicationError } from "./application-error";

export class AuthenticationLookupError extends ApplicationError {
  constructor() {
    super("Unable to determine user session");
    this.name = "AuthenticationLookupError";
  }
}
