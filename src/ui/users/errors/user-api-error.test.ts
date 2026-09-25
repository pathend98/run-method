import { UserApiError } from "./user-api-error";

test("UserApiError exposes its message and HTTP status", () => {
  const error = new UserApiError("Unauthorized", 401);

  expect(error.name).toBe("UserApiError");
  expect(error.message).toBe("Unauthorized");
  expect(error.status).toBe(401);
});
