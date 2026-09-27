async function importAuthenticationEnv() {
  vi.resetModules();

  return import("./authentication-env");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

function stubValidOidcEnv() {
  vi.stubEnv(
    "OIDC_AUTHORIZATION_ENDPOINT",
    "https://identity.example.com/oauth2/authorize",
  );
  vi.stubEnv("OIDC_CALLBACK_URL", "https://app.example.com/auth/callback");
  vi.stubEnv("OIDC_CLIENT_ID", "run-method-web");
  vi.stubEnv("OIDC_PROVIDER", "keycloak");
  vi.stubEnv("OIDC_LOGOUT_ENDPOINT", "https://identity.example.com/logout");
  vi.stubEnv("OIDC_LOGOUT_CALLBACK_URL", "https://app.example.com/");
  vi.stubEnv("OIDC_JWKS_URL", "https://identity.example.com/oauth2/certs");
  vi.stubEnv("OIDC_ISSUER", "https://identity.example.com");
  vi.stubEnv(
    "OIDC_TOKEN_ENDPOINT",
    "https://identity.example.com/oauth2/token",
  );
}

test("maps OIDC environment variables", async () => {
  stubValidOidcEnv();

  const { readAuthenticationEnv } = await importAuthenticationEnv();

  expect(readAuthenticationEnv()).toEqual({
    OIDC_AUTHORIZATION_ENDPOINT:
      "https://identity.example.com/oauth2/authorize",
    OIDC_CALLBACK_URL: "https://app.example.com/auth/callback",
    OIDC_CLIENT_ID: "run-method-web",
    OIDC_PROVIDER: "keycloak",
    OIDC_LOGOUT_ENDPOINT: "https://identity.example.com/logout",
    OIDC_LOGOUT_CALLBACK_URL: "https://app.example.com/",
    OIDC_JWKS_URL: "https://identity.example.com/oauth2/certs",
    OIDC_ISSUER: "https://identity.example.com",
    OIDC_TOKEN_ENDPOINT: "https://identity.example.com/oauth2/token",
  });
});

test.each([
  ["OIDC_AUTHORIZATION_ENDPOINT", "not a URL"],
  ["OIDC_CALLBACK_URL", "not a URL"],
  ["OIDC_JWKS_URL", "not a URL"],
  ["OIDC_ISSUER", "not a URL"],
  ["OIDC_TOKEN_ENDPOINT", "not a URL"],
  ["OIDC_PROVIDER", "unknown"],
  ["OIDC_LOGOUT_ENDPOINT", "not a URL"],
  ["OIDC_LOGOUT_CALLBACK_URL", "/"],
])("rejects an invalid %s", async (name, value) => {
  stubValidOidcEnv();
  vi.stubEnv(name, value);

  const { readAuthenticationEnv } = await importAuthenticationEnv();

  expect(() => readAuthenticationEnv()).toThrow();
});

test.each([
  "OIDC_JWKS_URL",
  "OIDC_ISSUER",
  "OIDC_PROVIDER",
  "OIDC_LOGOUT_ENDPOINT",
  "OIDC_LOGOUT_CALLBACK_URL",
])("rejects a missing %s", async (name) => {
  stubValidOidcEnv();
  vi.stubEnv(name, undefined);

  const { readAuthenticationEnv } = await importAuthenticationEnv();

  expect(() => readAuthenticationEnv()).toThrow();
});
