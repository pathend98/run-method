import { ApplicationError } from "./application-error";
import { BadRequestError } from "./bad-request-error";

test("BadRequestError extends ApplicationError with its own name", () => {
  const error = new BadRequestError("Request was invalid");

  expect(error).toBeInstanceOf(ApplicationError);
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toBe("Request was invalid");
  expect(error.name).toBe("BadRequestError");
});
