import { ApplicationError } from "./application-error";
import { AuthenticationLookupError } from "./authentication-lookup-error";

test("AuthenticationLookupError has a stable message and extends ApplicationError", () => {
  const error = new AuthenticationLookupError();
  expect(error).toBeInstanceOf(ApplicationError);
  expect(error.name).toBe("AuthenticationLookupError");
  expect(error.message).toBe("Unable to determine user session");
});
