import { createHash } from "node:crypto";

import { DefaultOidcLoginService } from "./oidc-login-service";

function decodeTransaction(transaction: string) {
  return JSON.parse(Buffer.from(transaction, "base64url").toString("utf8")) as {
    codeVerifier: string;
    state: string;
    nonce: string;
  };
}

test("creates a complete authorization request and PKCE transaction", () => {
  const service = new DefaultOidcLoginService({
    authorizationUrl:
      "http://localhost:8080/realms/run-method/protocol/openid-connect/auth?prompt=login&state=old",
    clientId: "run-method",
    callbackUrl: "http://localhost:3000/auth/callback",
    scopes: "openid email profile",
  });

  const login = service.createLogin();
  const transaction = decodeTransaction(login.transaction);
  const params = login.authorizationUrl.searchParams;

  expect(login.authorizationUrl.origin).toBe("http://localhost:8080");
  expect(login.authorizationUrl.pathname).toBe(
    "/realms/run-method/protocol/openid-connect/auth",
  );
  expect(params.get("prompt")).toBe("login");
  expect(params.get("response_type")).toBe("code");
  expect(params.get("client_id")).toBe("run-method");
  expect(params.get("redirect_uri")).toBe(
    "http://localhost:3000/auth/callback",
  );
  expect(params.get("scope")).toBe("openid email profile");
  expect(params.get("code_challenge_method")).toBe("S256");
  expect(params.get("state")).toBe(transaction.state);
  expect(params.get("nonce")).toBe(transaction.nonce);
  expect(transaction.codeVerifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(transaction.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(transaction.nonce).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(new Set(Object.values(transaction))).toHaveLength(3);
  expect(params.get("code_challenge")).toBe(
    createHash("sha256")
      .update(transaction.codeVerifier, "ascii")
      .digest("base64url"),
  );
  expect(login.callbackPath).toBe("/auth/callback");
  expect(login.secureCookie).toBe(false);
});

test("uses a secure cookie for HTTPS callbacks and fresh transaction values", () => {
  const service = new DefaultOidcLoginService({
    authorizationUrl: "https://identity.example.com/authorize",
    clientId: "run-method",
    callbackUrl: "https://app.example.com/callback",
    scopes: "openid",
  });

  const firstLogin = service.createLogin();
  const secondLogin = service.createLogin();

  expect(firstLogin.secureCookie).toBe(true);
  expect(firstLogin.callbackPath).toBe("/callback");
  expect(firstLogin.transaction).not.toBe(secondLogin.transaction);
});
