import { makeValidator } from "envalid";
import { InvalidPostgresUrlError } from "./postgres-url-errors";

export const postgresUrlValidator = makeValidator<string>((input) => {
  let parsed: URL;

  try {
    parsed = new URL(input);
  } catch {
    throw new InvalidPostgresUrlError("DATABASE_URL must be a valid URL");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new InvalidPostgresUrlError(
      "DATABASE_URL must use the postgres:// or postgresql:// protocol",
    );
  }

  return input;
});
