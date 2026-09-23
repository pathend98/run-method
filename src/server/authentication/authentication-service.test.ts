import { createHash } from "node:crypto";

import { DefaultAuthenticationService } from "./authentication-service";

const configuration = {
  authorizationEndpoint:
    "https://identity.example.com/oauth2/authorize?provider=example&scope=old",
  callbackUrl: "https://app.example.com/auth/callback",
  clientId: "run-method-web",
};

type Transaction = {
  codeVerifier: string;
  state: string;
  nonce: string;
};

function decodeTransaction(value: string): Transaction {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

test("creates an OIDC authorization redirect with PKCE", () => {
  const service = new DefaultAuthenticationService(configuration);

  const result = service.createAuthorizationRedirect();
  const transaction = decodeTransaction(result.transactionCookieValue);
  const query = result.authorizationUrl.searchParams;

  expect(result.authorizationUrl.origin).toBe("https://identity.example.com");
  expect(result.authorizationUrl.pathname).toBe("/oauth2/authorize");
  expect(query.get("provider")).toBe("example");
  expect(query.get("response_type")).toBe("code");
  expect(query.get("client_id")).toBe("run-method-web");
  expect(query.get("redirect_uri")).toBe(
    "https://app.example.com/auth/callback",
  );
  expect(query.get("scope")).toBe("openid email profile");
  expect(query.get("state")).toBe(transaction.state);
  expect(query.get("nonce")).toBe(transaction.nonce);
  expect(query.get("code_challenge_method")).toBe("S256");
  expect(query.get("code_challenge")).toBe(
    createHash("sha256").update(transaction.codeVerifier).digest("base64url"),
  );
});

test("generates independent 256-bit base64url transaction values", () => {
  const service = new DefaultAuthenticationService(configuration);

  const first = decodeTransaction(
    service.createAuthorizationRedirect().transactionCookieValue,
  );
  const second = decodeTransaction(
    service.createAuthorizationRedirect().transactionCookieValue,
  );
  const values = [
    first.codeVerifier,
    first.state,
    first.nonce,
    second.codeVerifier,
    second.state,
    second.nonce,
  ];

  expect(new Set(values)).toHaveLength(values.length);
  for (const value of values) {
    expect(value).toMatch(/^[A-Za-z0-9_-]{43}$/);
  }
});
