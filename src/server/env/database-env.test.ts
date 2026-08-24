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
    "postgres://training_brain:training_brain@localhost:5432/training_brain",
  );
  vi.stubEnv("MAX_DATABASE_CONNECTIONS", "12");
  vi.stubEnv("DATABASE_IDLE_CONNECTION_TIMEOUT_MS", "45000");
  vi.stubEnv("DATABASE_CONNECTION_TIMEOUT_MS", "7000");

  const { databaseEnv } = await importDatabaseEnv();

  expect(databaseEnv).toEqual({
    DATABASE_URL:
      "postgres://training_brain:training_brain@localhost:5432/training_brain",
    MAX_CONNECTIONS: 12,
    DATABASE_IDLE_CONNECTION_TIMEOUT_MS: 45000,
    DATABASE_CONNECTION_TIMEOUT_MS: 7000,
  });
});

test("uses defaults for optional database environment variables", async () => {
  vi.stubEnv(
    "DATABASE_URL",
    "postgresql://training_brain:training_brain@localhost:5432/training_brain",
  );
  vi.stubEnv("MAX_DATABASE_CONNECTIONS", undefined);
  vi.stubEnv("DATABASE_IDLE_CONNECTION_TIMEOUT_MS", undefined);
  vi.stubEnv("DATABASE_CONNECTION_TIMEOUT_MS", undefined);

  const { databaseEnv } = await importDatabaseEnv();

  expect(databaseEnv).toEqual({
    DATABASE_URL:
      "postgresql://training_brain:training_brain@localhost:5432/training_brain",
    MAX_CONNECTIONS: 5,
    DATABASE_IDLE_CONNECTION_TIMEOUT_MS: 30000,
    DATABASE_CONNECTION_TIMEOUT_MS: 5000,
  });
});
