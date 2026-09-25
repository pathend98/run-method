import { NotFoundError } from "@/server/errors/not-found-error";

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super("User not found");
    this.name = "UserNotFoundError";
  }
}

export class IdentityAlreadyExistsError extends Error {}
