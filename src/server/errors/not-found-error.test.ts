import { ApplicationError } from "./application-error";
import { NotFoundError } from "./not-found-error";

test("NotFoundError extends ApplicationError with its own name", () => {
  const error = new NotFoundError("Resource not found");

  expect(error).toBeInstanceOf(ApplicationError);
  expect(error.message).toBe("Resource not found");
  expect(error.name).toBe("NotFoundError");
});
