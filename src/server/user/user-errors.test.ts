import {
  IdentityAlreadyExistsError,
  UserIdentityNotFoundError,
} from "./user-errors";

test("user errors preserve their messages", () => {
  expect(
    new UserIdentityNotFoundError("User identity not found"),
  ).toMatchObject({
    message: "User identity not found",
  });
  expect(new IdentityAlreadyExistsError()).toBeInstanceOf(Error);
});
