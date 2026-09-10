async function importDatabaseEnv() {
  vi.resetModules();

  return import("./database-env");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

test("maps explicit database environment variables", async () => {
  vi.stubEnv(
    "DATABASE_URL",
    "postgres://run_method:run_method@localhost:5432/run_method",
  );
  vi.stubEnv("DATABASE_CA_PATH", "/run/secrets/rds-ca-bundle.pem");
  vi.stubEnv("MAX_DATABASE_CONNECTIONS", "12");
  vi.stubEnv("DATABASE_IDLE_CONNECTION_TIMEOUT_MS", "45000");
  vi.stubEnv("DATABASE_CONNECTION_TIMEOUT_MS", "7000");

  const { readDatabaseEnv } = await importDatabaseEnv();
  const databaseEnv = readDatabaseEnv();

  expect(databaseEnv).toEqual({
    DATABASE_URL: "postgres://run_method:run_method@localhost:5432/run_method",
    DATABASE_CA_PATH: "/run/secrets/rds-ca-bundle.pem",
    MAX_CONNECTIONS: 12,
    DATABASE_IDLE_CONNECTION_TIMEOUT_MS: 45000,
    DATABASE_CONNECTION_TIMEOUT_MS: 7000,
  });
});

test("uses defaults for optional database environment variables", async () => {
  vi.stubEnv(
    "DATABASE_URL",
    "postgresql://run_method:run_method@localhost:5432/run_method",
  );
  vi.stubEnv("MAX_DATABASE_CONNECTIONS", undefined);
  vi.stubEnv("DATABASE_CA_PATH", undefined);
  vi.stubEnv("DATABASE_IDLE_CONNECTION_TIMEOUT_MS", undefined);
  vi.stubEnv("DATABASE_CONNECTION_TIMEOUT_MS", undefined);

  const { readDatabaseEnv } = await importDatabaseEnv();
  const databaseEnv = readDatabaseEnv();

  expect(databaseEnv).toEqual({
    DATABASE_URL:
      "postgresql://run_method:run_method@localhost:5432/run_method",
    DATABASE_CA_PATH: undefined,
    MAX_CONNECTIONS: 5,
    DATABASE_IDLE_CONNECTION_TIMEOUT_MS: 30000,
    DATABASE_CONNECTION_TIMEOUT_MS: 5000,
  });
});
