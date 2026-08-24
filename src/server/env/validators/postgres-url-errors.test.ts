import { InvalidPostgresUrlError } from "./postgres-url-errors";

test("InvalidPostgresUrlError exposes its message and error name", () => {
  const error = new InvalidPostgresUrlError("Expected a PostgreSQL URL");

  expect(error).toBeInstanceOf(Error);
  expect(error.message).toBe("Expected a PostgreSQL URL");
  expect(error.name).toBe("InvalidPostgresUrlError");
});
