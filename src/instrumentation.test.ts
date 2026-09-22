async function importInstrumentation() {
  vi.resetModules();

  return import("./instrumentation");
}

function stubOidcEnvironment() {
  vi.stubEnv(
    "OIDC_AUTHORIZATION_URL",
    "http://localhost:8080/realms/run-method/protocol/openid-connect/auth",
  );
  vi.stubEnv("OIDC_CLIENT_ID", "run-method");
  vi.stubEnv("OIDC_CALLBACK_URL", "http://localhost:3000/auth/callback");
  vi.stubEnv("OIDC_SCOPES", "openid email profile");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

test("validates database configuration when the Node.js server starts", async () => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv(
    "DATABASE_URL",
    "postgres://run_method:run_method@localhost:5432/run_method",
  );
  stubOidcEnvironment();

  const { register } = await importInstrumentation();

  await expect(register()).resolves.toBeUndefined();
});

test("validates OIDC configuration when the Node.js server starts", async () => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv(
    "DATABASE_URL",
    "postgres://run_method:run_method@localhost:5432/run_method",
  );
  stubOidcEnvironment();
  vi.stubEnv("OIDC_SCOPES", "email profile");

  const { register } = await importInstrumentation();

  await expect(register()).rejects.toThrow("OIDC_SCOPES must include openid");
});

test("does not load Node.js configuration for non-Node runtimes", async () => {
  vi.stubEnv("NEXT_RUNTIME", "edge");
  vi.stubEnv("DATABASE_URL", undefined);

  const { register } = await importInstrumentation();

  await expect(register()).resolves.toBeUndefined();
});
