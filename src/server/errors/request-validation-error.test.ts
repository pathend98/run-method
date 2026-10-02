import { BadRequestError } from "./bad-request-error";
import { RequestValidationError } from "./request-validation-error";

test("exposes field errors as a bad request", () => {
  const fieldErrors = { body: ["Invalid JSON"] };
  const error = new RequestValidationError(fieldErrors);
  expect(error).toBeInstanceOf(BadRequestError);
  expect(error.name).toBe("RequestValidationError");
  expect(error.message).toBe("Invalid request body");
  expect(error.fieldErrors).toBe(fieldErrors);
});
