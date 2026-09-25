import { ApplicationError } from "./application-error";
import { ForbiddenError } from "./forbidden-error";

test("ForbiddenError has a stable message and extends ApplicationError", () => {
  const error = new ForbiddenError();
  expect(error).toBeInstanceOf(ApplicationError);
  expect(error.name).toBe("ForbiddenError");
  expect(error.message).toBe("Forbidden");
});
