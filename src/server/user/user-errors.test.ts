import { NotFoundError } from "@/server/errors/not-found-error";
import { IdentityAlreadyExistsError, UserNotFoundError } from "./user-errors";

test("user errors preserve their messages", () => {
  const error = new UserNotFoundError();
  expect(error).toBeInstanceOf(NotFoundError);
  expect(error.message).toBe("User not found");
  expect(error.name).toBe("UserNotFoundError");
  expect(new IdentityAlreadyExistsError()).toBeInstanceOf(Error);
});
