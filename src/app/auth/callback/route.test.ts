import { NextRequest } from "next/server";

import {
  AuthenticationCallbackError,
  AuthenticationTokenExchangeError,
} from "@/server/authentication/authentication-errors";

import { GET } from "./route";

const exchangeAuthorizationCode = vi.hoisted(() => vi.fn());

vi.mock("@/server/server", () => ({
  getAuthenticationService: () => ({ exchangeAuthorizationCode }),
}));

afterEach(() => {
  exchangeAuthorizationCode.mockReset();
});

function callbackRequest(
  query = "code=authorization-code&state=expected-state",
  transactionCookie = "encoded-transaction",
) {
  const headers = transactionCookie
    ? { cookie: `__Host-oidc-transaction=${transactionCookie}` }
    : undefined;

  return new NextRequest(`https://app.example.com/auth/callback?${query}`, {
    headers,
  });
}

test("stores tokens, clears the transaction, and redirects to the app root", async () => {
  exchangeAuthorizationCode.mockResolvedValue("encoded-tokens");

  const response = await GET(callbackRequest());

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://app.example.com/");
  expect(exchangeAuthorizationCode).toHaveBeenCalledWith({
    code: "authorization-code",
    state: "expected-state",
    transactionCookieValue: "encoded-transaction",
  });
  expect(response.cookies.get("__Host-oidc-tokens")?.value).toBe(
    "encoded-tokens",
  );
  expect(response.cookies.get("__Host-oidc-transaction")?.value).toBe("");
  const setCookie = response.headers.get("set-cookie");
  expect(setCookie).toContain(
    "__Host-oidc-tokens=encoded-tokens; Path=/; Secure; HttpOnly; SameSite=lax",
  );
  expect(setCookie).toContain(
    "__Host-oidc-transaction=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=lax",
  );
});

test.each([
  ["code", "state=expected-state", "encoded-transaction"],
  ["state", "code=authorization-code", "encoded-transaction"],
  ["transaction cookie", "code=authorization-code&state=expected-state", ""],
])("returns 400 when the %s is missing", async (_name, query, cookie) => {
  const response = await GET(callbackRequest(query, cookie));

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid authorization callback",
  });
  expect(exchangeAuthorizationCode).not.toHaveBeenCalled();
  expect(response.cookies.get("__Host-oidc-transaction")?.value).toBe("");
});

test("returns 400 for a rejected callback", async () => {
  exchangeAuthorizationCode.mockRejectedValue(
    new AuthenticationCallbackError("State mismatch"),
  );

  const response = await GET(callbackRequest());

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid authorization callback",
  });
});

test("returns 502 when the identity provider exchange fails", async () => {
  exchangeAuthorizationCode.mockRejectedValue(
    new AuthenticationTokenExchangeError(),
  );

  const response = await GET(callbackRequest());

  expect(response.status).toBe(502);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to complete authentication",
  });
});

test("returns 500 for an unexpected failure", async () => {
  exchangeAuthorizationCode.mockRejectedValue(new Error("unexpected"));

  const response = await GET(callbackRequest());

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to complete authentication",
  });
});
