import { ApplicationError, BadRequestError } from "./server-errors";

test("ApplicationError exposes its message and error name", () => {
  const error = new ApplicationError("Application failed");

  expect(error).toBeInstanceOf(Error);
  expect(error.message).toBe("Application failed");
  expect(error.name).toBe("ApplicationError");
});

test("BadRequestError extends ApplicationError with its own name", () => {
  const error = new BadRequestError("Request was invalid");

  expect(error).toBeInstanceOf(ApplicationError);
  expect(error).toBeInstanceOf(Error);
  expect(error.message).toBe("Request was invalid");
  expect(error.name).toBe("BadRequestError");
});
