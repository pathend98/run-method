import { NextRequest } from "next/server";

import {
  AuthenticationCallbackError,
  AuthenticationIdTokenVerificationError,
  AuthenticationTokenExchangeError,
} from "@/server/authentication/authentication-errors";
import { GET } from "./route";

const exchangeAuthorizationCode = vi.hoisted(() => vi.fn());
const completeIdentitySignIn = vi.hoisted(() => vi.fn());
const appEnv = vi.hoisted(() => ({ APP_BASE_URL: "https://app.example.com/" }));

vi.mock("@/server/env/app-env", () => ({ readAppEnv: () => appEnv }));
vi.mock("@/server/server", () => ({
  getAuthenticationService: () => ({ exchangeAuthorizationCode }),
  getUserService: () => ({ completeIdentitySignIn }),
}));

afterEach(() => {
  exchangeAuthorizationCode.mockReset();
  completeIdentitySignIn.mockReset();
  appEnv.APP_BASE_URL = "https://app.example.com/";
});

function callbackRequest(
  query = "code=authorization-code&state=expected-state",
  transactionCookie = "encoded-transaction",
  sessionCookie?: string,
) {
  const cookies = [
    transactionCookie && `__Host-oidc-transaction=${transactionCookie}`,
    sessionCookie && `__Host-user-session=${sessionCookie}`,
  ].filter(Boolean);
  const headers = cookies.length ? { cookie: cookies.join("; ") } : undefined;
  return new NextRequest(`https://request.example.com/auth/callback?${query}`, {
    headers,
  });
}

const identity = {
  issuer: "https://identity.example.com",
  subject: "runner-123",
  email: "runner@example.com",
  accessToken: "access-token",
  idToken: "id-token",
  refreshToken: "refresh-token",
};

test("passes the verified identity and previous session to User entry", async () => {
  exchangeAuthorizationCode.mockResolvedValue(identity);
  completeIdentitySignIn.mockResolvedValue("new-session");

  const response = await GET(
    callbackRequest(undefined, undefined, "old-session"),
  );

  expect(exchangeAuthorizationCode).toHaveBeenCalledExactlyOnceWith({
    code: "authorization-code",
    state: "expected-state",
    transactionCookieValue: "encoded-transaction",
  });
  expect(completeIdentitySignIn).toHaveBeenCalledExactlyOnceWith(
    identity,
    "old-session",
  );
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://app.example.com/");
  expect(response.cookies.get("__Host-user-session")?.value).toBe(
    "new-session",
  );
  expect(response.cookies.get("__Host-oidc-transaction")?.value).toBe("");
  expect(response.headers.get("set-cookie")).toMatch(
    /__Host-user-session=new-session; Path=\/; Expires=[^;]+; Max-Age=2592000; Secure; HttpOnly; SameSite=lax/,
  );
});

test("passes no previous session when there is no cookie", async () => {
  exchangeAuthorizationCode.mockResolvedValue(identity);
  completeIdentitySignIn.mockResolvedValue("new-session");

  await GET(callbackRequest());

  expect(completeIdentitySignIn).toHaveBeenCalledExactlyOnceWith(
    identity,
    undefined,
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
  expect(completeIdentitySignIn).not.toHaveBeenCalled();
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
  expect(completeIdentitySignIn).not.toHaveBeenCalled();
  expect(response.cookies.get("__Host-user-session")).toBeUndefined();
  expect(response.cookies.get("__Host-oidc-transaction")?.value).toBe("");
});

test("returns 500 for an unexpected exchange failure", async () => {
  exchangeAuthorizationCode.mockRejectedValue(new Error("unexpected"));
  const response = await GET(callbackRequest());
  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to complete authentication",
  });
});

test("returns 500 without a session cookie when User entry fails", async () => {
  exchangeAuthorizationCode.mockResolvedValue(identity);
  completeIdentitySignIn.mockRejectedValue(new Error("database unavailable"));
  const response = await GET(callbackRequest());
  expect(response.status).toBe(500);
  expect(response.cookies.get("__Host-user-session")).toBeUndefined();
  expect(response.cookies.get("__Host-oidc-transaction")?.value).toBe("");
});

test.each(["https://app.example.com", "https://app.example.com/"])(
  "redirects successful authentication to app base URL %s",
  async (baseUrl) => {
    appEnv.APP_BASE_URL = baseUrl;
    exchangeAuthorizationCode.mockResolvedValue(identity);
    completeIdentitySignIn.mockResolvedValue("session-key");
    const response = await GET(callbackRequest());
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.example.com/");
  },
);
