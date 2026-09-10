import { cleanEnv } from "envalid";
import { InvalidPostgresUrlError } from "./postgres-url-errors";
import { postgresUrlValidator } from "./postgres-url-validator";

function readDatabaseUrl(DATABASE_URL: string) {
  return cleanEnv(
    { DATABASE_URL },
    { DATABASE_URL: postgresUrlValidator() },
    { reporter: null },
  ).DATABASE_URL;
}

test.each([
  "postgres://run_method:run_method@localhost:5432/run_method",
  "postgresql://run_method:run_method@localhost:5432/run_method",
])("accepts %s connection strings", (DATABASE_URL) => {
  expect(readDatabaseUrl(DATABASE_URL)).toBe(DATABASE_URL);
});

test("rejects connection strings that do not use a PostgreSQL protocol", () => {
  expect(() =>
    readDatabaseUrl("mysql://run_method:run_method@localhost/db"),
  ).toThrow(InvalidPostgresUrlError);
});

test("rejects malformed connection strings with the PostgreSQL URL error", () => {
  expect(() => readDatabaseUrl("not a url")).toThrow(InvalidPostgresUrlError);
});
