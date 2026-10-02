import { BadRequestError } from "./bad-request-error";
import { RequestBodyValidationError } from "./request-body-validation-error";
import { RequestValidationError } from "./request-validation-error";

test("preserves the request validation error contract", () => {
  const fieldErrors = { "items.0.title": ["Required"] };
  const error = new RequestBodyValidationError(fieldErrors);

  expect(error).toBeInstanceOf(RequestValidationError);
  expect(error).toBeInstanceOf(BadRequestError);
  expect(error.name).toBe("RequestBodyValidationError");
  expect(error.message).toBe("Invalid request body");
  expect(error.fieldErrors).toBe(fieldErrors);
});
