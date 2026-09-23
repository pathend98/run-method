import { BadRequestError } from "@/server/errors/bad-request-error";

import {
  AuthenticationCallbackError,
  AuthenticationTokenExchangeError,
} from "./authentication-errors";

test("AuthenticationCallbackError is a bad request error", () => {
  const error = new AuthenticationCallbackError("Invalid callback");

  expect(error).toBeInstanceOf(BadRequestError);
  expect(error.name).toBe("AuthenticationCallbackError");
  expect(error.message).toBe("Invalid callback");
});

test("AuthenticationTokenExchangeError has a stable public message", () => {
  const error = new AuthenticationTokenExchangeError();

  expect(error).toBeInstanceOf(Error);
  expect(error.name).toBe("AuthenticationTokenExchangeError");
  expect(error.message).toBe("Unable to exchange authorization code");
});
