async function importAuthenticationEnv() {
  vi.resetModules();

  return import("./authentication-env");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

test("maps OIDC environment variables", async () => {
  vi.stubEnv(
    "OIDC_AUTHORIZATION_ENDPOINT",
    "https://identity.example.com/oauth2/authorize",
  );
  vi.stubEnv("OIDC_CALLBACK_URL", "https://app.example.com/auth/callback");
  vi.stubEnv("OIDC_CLIENT_ID", "run-method-web");
  vi.stubEnv(
    "OIDC_TOKEN_ENDPOINT",
    "https://identity.example.com/oauth2/token",
  );

  const { readAuthenticationEnv } = await importAuthenticationEnv();

  expect(readAuthenticationEnv()).toEqual({
    OIDC_AUTHORIZATION_ENDPOINT:
      "https://identity.example.com/oauth2/authorize",
    OIDC_CALLBACK_URL: "https://app.example.com/auth/callback",
    OIDC_CLIENT_ID: "run-method-web",
    OIDC_TOKEN_ENDPOINT: "https://identity.example.com/oauth2/token",
  });
});

test.each([
  ["OIDC_AUTHORIZATION_ENDPOINT", "not a URL"],
  ["OIDC_CALLBACK_URL", "not a URL"],
  ["OIDC_TOKEN_ENDPOINT", "not a URL"],
])("rejects an invalid %s", async (name, value) => {
  vi.stubEnv(
    "OIDC_AUTHORIZATION_ENDPOINT",
    "https://identity.example.com/oauth2/authorize",
  );
  vi.stubEnv("OIDC_CALLBACK_URL", "https://app.example.com/auth/callback");
  vi.stubEnv("OIDC_CLIENT_ID", "run-method-web");
  vi.stubEnv(
    "OIDC_TOKEN_ENDPOINT",
    "https://identity.example.com/oauth2/token",
  );
  vi.stubEnv(name, value);

  const { readAuthenticationEnv } = await importAuthenticationEnv();

  expect(() => readAuthenticationEnv()).toThrow();
});
