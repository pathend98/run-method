async function importInstrumentation() {
  vi.resetModules();

  return import("./instrumentation");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

test("validates server configuration when the Node.js server starts", async () => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv(
    "DATABASE_URL",
    "postgres://run_method:run_method@localhost:5432/run_method",
  );
  vi.stubEnv(
    "OIDC_AUTHORIZATION_ENDPOINT",
    "https://identity.example.com/oauth2/authorize",
  );
  vi.stubEnv("OIDC_CALLBACK_URL", "https://app.example.com/auth/callback");
  vi.stubEnv("OIDC_CLIENT_ID", "run-method-web");

  const { register } = await importInstrumentation();

  await expect(register()).resolves.toBeUndefined();
});

test("does not load Node.js configuration for non-Node runtimes", async () => {
  vi.stubEnv("NEXT_RUNTIME", "edge");
  vi.stubEnv("DATABASE_URL", undefined);
  vi.stubEnv("OIDC_AUTHORIZATION_ENDPOINT", undefined);
  vi.stubEnv("OIDC_CALLBACK_URL", undefined);
  vi.stubEnv("OIDC_CLIENT_ID", undefined);

  const { register } = await importInstrumentation();

  await expect(register()).resolves.toBeUndefined();
});
