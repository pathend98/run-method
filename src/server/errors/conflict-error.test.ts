import { ApplicationError } from "./application-error";
import { ConflictError } from "./conflict-error";

test("exposes a conflict message as an application error", () => {
  const error = new ConflictError("Already exists");
  expect(error).toBeInstanceOf(ApplicationError);
  expect(error.name).toBe("ConflictError");
  expect(error.message).toBe("Already exists");
});
