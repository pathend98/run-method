import { makeValidator } from "envalid";

export const postgresUrlValidator = makeValidator<string>((input) => {
  const parsed = new URL(input);

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error(
      "DATABASE_URL must use the postgres:// or postgresql:// protocol",
    );
  }

  return input;
});
