async function importInstrumentation() {
  vi.resetModules();

  return import("./instrumentation");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

test("validates database configuration when the Node.js server starts", async () => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv(
    "DATABASE_URL",
    "postgres://training_brain:training_brain@localhost:5432/training_brain",
  );

  const { register } = await importInstrumentation();

  await expect(register()).resolves.toBeUndefined();
});

test("does not load Node.js configuration for non-Node runtimes", async () => {
  vi.stubEnv("NEXT_RUNTIME", "edge");
  vi.stubEnv("DATABASE_URL", undefined);

  const { register } = await importInstrumentation();

  await expect(register()).resolves.toBeUndefined();
});
