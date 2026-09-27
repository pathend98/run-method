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
  vi.stubEnv("OIDC_PROVIDER", "keycloak");
  vi.stubEnv("OIDC_LOGOUT_ENDPOINT", "https://identity.example.com/logout");
  vi.stubEnv("APP_BASE_URL", "https://app.example.com/");
  vi.stubEnv("OIDC_JWKS_URL", "https://identity.example.com/oauth2/certs");
  vi.stubEnv("OIDC_ISSUER", "https://identity.example.com");
  vi.stubEnv("OIDC_AUDIENCE", "run-method-web");
  vi.stubEnv(
    "OIDC_TOKEN_ENDPOINT",
    "https://identity.example.com/oauth2/token",
  );

  const { register } = await importInstrumentation();

  await expect(register()).resolves.toBeUndefined();
});

test("does not load Node.js configuration for non-Node runtimes", async () => {
  vi.stubEnv("NEXT_RUNTIME", "edge");
  vi.stubEnv("APP_BASE_URL", undefined);
  vi.stubEnv("DATABASE_URL", undefined);
  vi.stubEnv("OIDC_AUTHORIZATION_ENDPOINT", undefined);
  vi.stubEnv("OIDC_CALLBACK_URL", undefined);
  vi.stubEnv("OIDC_CLIENT_ID", undefined);
  vi.stubEnv("OIDC_JWKS_URL", undefined);
  vi.stubEnv("OIDC_ISSUER", undefined);
  vi.stubEnv("OIDC_AUDIENCE", undefined);
  vi.stubEnv("OIDC_TOKEN_ENDPOINT", undefined);

  const { register } = await importInstrumentation();

  await expect(register()).resolves.toBeUndefined();
});

test.each([undefined, "not a URL", "/"])(
  "rejects invalid app configuration at startup: %s",
  async (baseUrl) => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("APP_BASE_URL", baseUrl);

    const { register } = await importInstrumentation();

    await expect(register()).rejects.toThrow();
  },
);
