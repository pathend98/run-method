import { ApplicationError } from "./application-error";
import { UnauthorizedError } from "./unauthorized-error";

test("UnauthorizedError has a stable message and extends ApplicationError", () => {
  const error = new UnauthorizedError();
  expect(error).toBeInstanceOf(ApplicationError);
  expect(error.name).toBe("UnauthorizedError");
  expect(error.message).toBe("Unauthorized");
});
