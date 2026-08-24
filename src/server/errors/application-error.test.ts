import { ApplicationError } from "./application-error";

test("ApplicationError exposes its message and error name", () => {
  const error = new ApplicationError("Application failed");

  expect(error).toBeInstanceOf(Error);
  expect(error.message).toBe("Application failed");
  expect(error.name).toBe("ApplicationError");
});
