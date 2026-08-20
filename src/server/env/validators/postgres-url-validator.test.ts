import { cleanEnv } from "envalid";
import { postgresUrlValidator } from "./postgres-url-validator";

const readDatabaseUrl = (DATABASE_URL: string) =>
  cleanEnv(
    { DATABASE_URL },
    { DATABASE_URL: postgresUrlValidator() },
    { reporter: null },
  ).DATABASE_URL;

test.each([
  "postgres://training_brain:training_brain@localhost:5432/training_brain",
  "postgresql://training_brain:training_brain@localhost:5432/training_brain",
])("accepts %s connection strings", (DATABASE_URL) => {
  expect(readDatabaseUrl(DATABASE_URL)).toBe(DATABASE_URL);
});

test("rejects connection strings that do not use a PostgreSQL protocol", () => {
  expect(() =>
    readDatabaseUrl("mysql://training_brain:training_brain@localhost/db"),
  ).toThrow(
    "DATABASE_URL must use the postgres:// or postgresql:// protocol",
  );
});
