import { NextRequest } from "next/server";

import {
  AuthenticationCallbackError,
  AuthenticationIdTokenVerificationError,
  AuthenticationTokenExchangeError,
} from "@/server/authentication/authentication-errors";

import { GET } from "./route";

const exchangeAuthorizationCode = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
const createSession = vi.hoisted(() => vi.fn());

vi.mock("@/server/server", () => ({
  getAuthenticationService: () => ({ exchangeAuthorizationCode }),
  getUserService: () => ({ create, createSession }),
}));

afterEach(() => {
  exchangeAuthorizationCode.mockReset();
  create.mockReset();
  createSession.mockReset();
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

const identity = {
  issuer: "https://identity.example.com",
  subject: "runner-123",
  email: "runner@example.com",
  accessToken: "access-token",
  refreshToken: "refresh-token",
};

test("creates a user session, clears old cookies, and redirects to the app root", async () => {
  exchangeAuthorizationCode.mockResolvedValue(identity);
  create.mockResolvedValue({ id: "user-id" });
  createSession.mockResolvedValue("session-key");

  const response = await GET(callbackRequest());

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("/");
  expect(exchangeAuthorizationCode).toHaveBeenCalledWith({
    code: "authorization-code",
    state: "expected-state",
    transactionCookieValue: "encoded-transaction",
  });
  expect(create).toHaveBeenCalledExactlyOnceWith({
    issuer: identity.issuer,
    subject: identity.subject,
    email: identity.email,
  });
  expect(createSession).toHaveBeenCalledExactlyOnceWith({
    issuer: identity.issuer,
    subject: identity.subject,
    accessToken: identity.accessToken,
    refreshToken: identity.refreshToken,
  });
  expect(response.cookies.get("__Host-user-session")?.value).toBe(
    "session-key",
  );
  expect(response.cookies.get("__Host-oidc-transaction")?.value).toBe("");
  const setCookie = response.headers.get("set-cookie");
  expect(setCookie).toMatch(
    /__Host-user-session=session-key; Path=\/; Expires=[^;]+; Max-Age=2592000; Secure; HttpOnly; SameSite=lax/,
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
  expect(create).not.toHaveBeenCalled();
  expect(createSession).not.toHaveBeenCalled();
  expect(response.cookies.get("__Host-user-session")).toBeUndefined();
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

test("returns 502 without a session cookie when ID token verification fails", async () => {
  exchangeAuthorizationCode.mockRejectedValue(
    new AuthenticationIdTokenVerificationError(),
  );

  const response = await GET(callbackRequest());

  expect(response.status).toBe(502);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to complete authentication",
  });
  expect(create).not.toHaveBeenCalled();
  expect(createSession).not.toHaveBeenCalled();
  expect(response.cookies.get("__Host-user-session")).toBeUndefined();
  expect(response.cookies.get("__Host-oidc-transaction")?.value).toBe("");
});

test("returns 500 for an unexpected failure", async () => {
  exchangeAuthorizationCode.mockRejectedValue(new Error("unexpected"));

  const response = await GET(callbackRequest());

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to complete authentication",
  });
});

test.each(["create", "createSession"])(
  "returns 500 without a session cookie when %s fails",
  async (operation) => {
    exchangeAuthorizationCode.mockResolvedValue(identity);
    create.mockResolvedValue({ id: "user-id" });
    createSession.mockResolvedValue("session-key");
    (operation === "create" ? create : createSession).mockRejectedValue(
      new Error("database unavailable"),
    );

    const response = await GET(callbackRequest());

    expect(response.status).toBe(500);
    expect(response.cookies.get("__Host-user-session")).toBeUndefined();
    if (operation === "create") {
      expect(createSession).not.toHaveBeenCalled();
    }
    expect(response.cookies.get("__Host-oidc-transaction")?.value).toBe("");
  },
);
