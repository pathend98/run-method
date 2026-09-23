import { BadRequestError } from "@/server/errors/bad-request-error";

export class AuthenticationCallbackError extends BadRequestError {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationCallbackError";
  }
}

export class AuthenticationTokenExchangeError extends Error {
  constructor() {
    super("Unable to exchange authorization code");
    this.name = "AuthenticationTokenExchangeError";
  }
}
