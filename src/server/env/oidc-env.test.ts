import { OidcEnvironmentReader } from "./oidc-env";

const validEnvironment = {
  OIDC_AUTHORIZATION_URL:
    "http://localhost:8080/realms/run-method/protocol/openid-connect/auth",
  OIDC_CLIENT_ID: "run-method",
  OIDC_CALLBACK_URL: "http://localhost:3000/auth/callback",
  OIDC_SCOPES: "openid email profile",
};

beforeEach(() => {
  for (const [name, value] of Object.entries(validEnvironment)) {
    vi.stubEnv(name, value);
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("maps and normalizes OIDC environment variables", () => {
  vi.stubEnv("OIDC_AUTHORIZATION_URL", "https://id.example.com/authorize");
  vi.stubEnv("OIDC_CALLBACK_URL", "https://app.example.com/auth/callback");
  vi.stubEnv("OIDC_SCOPES", "  profile   openid  email ");

  expect(new OidcEnvironmentReader().read()).toEqual({
    authorizationUrl: "https://id.example.com/authorize",
    clientId: "run-method",
    callbackUrl: "https://app.example.com/auth/callback",
    scopes: "profile openid email",
  });
});

test.each([
  "OIDC_AUTHORIZATION_URL",
  "OIDC_CLIENT_ID",
  "OIDC_CALLBACK_URL",
  "OIDC_SCOPES",
])("rejects a missing %s", (name) => {
  vi.stubEnv(name, undefined);

  expect(() => new OidcEnvironmentReader().read()).toThrow();
});

test.each([
  "OIDC_AUTHORIZATION_URL",
  "OIDC_CLIENT_ID",
  "OIDC_CALLBACK_URL",
  "OIDC_SCOPES",
])("rejects an empty %s", (name) => {
  vi.stubEnv(name, "");

  expect(() => new OidcEnvironmentReader().read()).toThrow();
});

test.each(["not a URL", "ftp://identity.example.com/authorize"])(
  "rejects invalid OIDC URLs: %s",
  (url) => {
    vi.stubEnv("OIDC_AUTHORIZATION_URL", url);

    expect(() => new OidcEnvironmentReader().read()).toThrow();
  },
);

test("rejects scopes without openid", () => {
  vi.stubEnv("OIDC_SCOPES", "email profile");

  expect(() => new OidcEnvironmentReader().read()).toThrow(
    "OIDC_SCOPES must include openid",
  );
});
