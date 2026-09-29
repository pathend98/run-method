import { NextRequest } from "next/server";

import {
  AuthenticationCallbackError,
  AuthenticationIdTokenVerificationError,
  AuthenticationTokenExchangeError,
} from "@/server/authentication/authentication-errors";
import {
  IdentityAlreadyExistsError,
  UserNotFoundError,
} from "@/server/user/user-errors";
import { createUser } from "@/test-support/fixtures/user";

import { GET } from "./route";

const exchangeAuthorizationCode = vi.hoisted(() => vi.fn());
const create = vi.hoisted(() => vi.fn());
const createSession = vi.hoisted(() => vi.fn());
const findBySessionKey = vi.hoisted(() => vi.fn());
const deleteSession = vi.hoisted(() => vi.fn());
const findByIdentity = vi.hoisted(() => vi.fn());
const promoteGuestUser = vi.hoisted(() => vi.fn());
const deleteGuestUser = vi.hoisted(() => vi.fn());
const appEnv = vi.hoisted(() => ({
  APP_BASE_URL: "https://app.example.com/",
}));

vi.mock("@/server/env/app-env", () => ({
  readAppEnv: () => appEnv,
}));

vi.mock("@/server/server", () => ({
  getAuthenticationService: () => ({ exchangeAuthorizationCode }),
  getUserService: () => ({
    create,
    createSession,
    findBySessionKey,
    deleteSession,
    findByIdentity,
    promoteGuestUser,
    deleteGuestUser,
  }),
}));

beforeEach(() => {
  findBySessionKey.mockRejectedValue(new UserNotFoundError());
  findByIdentity.mockRejectedValue(new UserNotFoundError());
});

afterEach(() => {
  exchangeAuthorizationCode.mockReset();
  create.mockReset();
  createSession.mockReset();
  findBySessionKey.mockReset();
  deleteSession.mockReset();
  findByIdentity.mockReset();
  promoteGuestUser.mockReset();
  deleteGuestUser.mockReset();
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
const guest = createUser({
  id: "guest-id",
  kind: "GUEST",
  expiresAt: new Date("2026-10-01"),
});
const registered = createUser({ id: "registered-id" });

test("promotes an existing guest and replaces its session for a new identity", async () => {
  exchangeAuthorizationCode.mockResolvedValue(identity);
  findBySessionKey.mockResolvedValue(guest);
  promoteGuestUser.mockResolvedValue(
    createUser({
      ...guest,
      kind: "REGISTERED",
      expiresAt: null,
    }),
  );
  createSession.mockResolvedValue("new-session");

  const response = await GET(
    callbackRequest(undefined, undefined, "old-session"),
  );

  expect(response.status).toBe(307);
  expect(findBySessionKey).toHaveBeenCalledExactlyOnceWith("old-session");
  expect(deleteSession).toHaveBeenCalledExactlyOnceWith("old-session");
  expect(findByIdentity).toHaveBeenCalledWith({
    issuer: identity.issuer,
    subject: identity.subject,
  });
  expect(promoteGuestUser).toHaveBeenCalledExactlyOnceWith(guest.id, {
    issuer: identity.issuer,
    subject: identity.subject,
    email: identity.email,
  });
  expect(create).not.toHaveBeenCalled();
  expect(deleteGuestUser).not.toHaveBeenCalled();
  expect(createSession).toHaveBeenCalledOnce();
  expect(deleteSession.mock.invocationCallOrder[0]).toBeLessThan(
    createSession.mock.invocationCallOrder[0],
  );
  expect(response.cookies.get("__Host-user-session")?.value).toBe(
    "new-session",
  );
});

test("deletes an existing guest when the IdP identity belongs to a user", async () => {
  exchangeAuthorizationCode.mockResolvedValue(identity);
  findBySessionKey.mockResolvedValue(guest);
  findByIdentity.mockResolvedValue(registered);
  createSession.mockResolvedValue("new-session");

  const response = await GET(
    callbackRequest(undefined, undefined, "old-session"),
  );

  expect(response.status).toBe(307);
  expect(deleteSession).toHaveBeenCalledWith("old-session");
  expect(deleteGuestUser).toHaveBeenCalledExactlyOnceWith(guest.id);
  expect(promoteGuestUser).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
  expect(deleteGuestUser.mock.invocationCallOrder[0]).toBeLessThan(
    createSession.mock.invocationCallOrder[0],
  );
});

test("replaces a registered session without changing its user", async () => {
  exchangeAuthorizationCode.mockResolvedValue(identity);
  findBySessionKey.mockResolvedValue(registered);
  findByIdentity.mockResolvedValue(
    createUser({ ...registered, id: "other-user" }),
  );
  createSession.mockResolvedValue("new-session");

  const response = await GET(
    callbackRequest(undefined, undefined, "old-session"),
  );

  expect(response.status).toBe(307);
  expect(deleteSession).toHaveBeenCalledWith("old-session");
  expect(promoteGuestUser).not.toHaveBeenCalled();
  expect(deleteGuestUser).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
  expect(createSession).toHaveBeenCalledOnce();
});

test("creates a new IdP user when a registered session switches to a new identity", async () => {
  exchangeAuthorizationCode.mockResolvedValue(identity);
  findBySessionKey.mockResolvedValue(registered);
  createSession.mockResolvedValue("new-session");

  const response = await GET(
    callbackRequest(undefined, undefined, "old-session"),
  );

  expect(response.status).toBe(307);
  expect(deleteSession).toHaveBeenCalledWith("old-session");
  expect(create).toHaveBeenCalledExactlyOnceWith({
    issuer: identity.issuer,
    subject: identity.subject,
    email: identity.email,
  });
  expect(promoteGuestUser).not.toHaveBeenCalled();
  expect(deleteGuestUser).not.toHaveBeenCalled();
  expect(createSession).toHaveBeenCalledOnce();
});

test("treats an unknown session cookie as no existing user and removes it", async () => {
  exchangeAuthorizationCode.mockResolvedValue(identity);
  createSession.mockResolvedValue("new-session");

  const response = await GET(
    callbackRequest(undefined, undefined, "stale-session"),
  );

  expect(response.status).toBe(307);
  expect(deleteSession).toHaveBeenCalledExactlyOnceWith("stale-session");
  expect(create).toHaveBeenCalledOnce();
  expect(promoteGuestUser).not.toHaveBeenCalled();
});

test("deletes a guest if the IdP identity is claimed during promotion", async () => {
  exchangeAuthorizationCode.mockResolvedValue(identity);
  findBySessionKey.mockResolvedValue(guest);
  findByIdentity
    .mockRejectedValueOnce(new UserNotFoundError())
    .mockResolvedValue(registered);
  promoteGuestUser.mockRejectedValue(new IdentityAlreadyExistsError());
  createSession.mockResolvedValue("new-session");

  const response = await GET(
    callbackRequest(undefined, undefined, "old-session"),
  );

  expect(response.status).toBe(307);
  expect(findByIdentity).toHaveBeenCalledTimes(2);
  expect(deleteGuestUser).toHaveBeenCalledExactlyOnceWith(guest.id);
  expect(createSession).toHaveBeenCalledOnce();
});

test.each(["findBySessionKey", "findByIdentity"])(
  "stops authentication when %s fails unexpectedly",
  async (operation) => {
    exchangeAuthorizationCode.mockResolvedValue(identity);
    findBySessionKey.mockResolvedValue(guest);
    if (operation === "findBySessionKey")
      findBySessionKey.mockRejectedValue(new Error("database unavailable"));
    if (operation === "findByIdentity")
      findByIdentity.mockRejectedValue(new Error("database unavailable"));

    const response = await GET(
      callbackRequest(undefined, undefined, "old-session"),
    );

    expect(response.status).toBe(500);
    expect(response.cookies.get("__Host-user-session")).toBeUndefined();
    expect(createSession).not.toHaveBeenCalled();
  },
);

test.each(["deleteSession", "promoteGuestUser", "deleteGuestUser"])(
  "does not issue a new session when %s fails",
  async (operation) => {
    exchangeAuthorizationCode.mockResolvedValue(identity);
    findBySessionKey.mockResolvedValue(guest);
    if (operation === "deleteGuestUser")
      findByIdentity.mockResolvedValue(registered);
    if (operation === "deleteSession")
      deleteSession.mockRejectedValue(new Error("database unavailable"));
    if (operation === "promoteGuestUser")
      promoteGuestUser.mockRejectedValue(new Error("database unavailable"));
    if (operation === "deleteGuestUser")
      deleteGuestUser.mockRejectedValue(new Error("database unavailable"));

    const response = await GET(
      callbackRequest(undefined, undefined, "old-session"),
    );

    expect(response.status).toBe(500);
    expect(response.cookies.get("__Host-user-session")).toBeUndefined();
    expect(createSession).not.toHaveBeenCalled();
  },
);

test("creates a user session, clears old cookies, and redirects to the app root", async () => {
  exchangeAuthorizationCode.mockResolvedValue(identity);
  create.mockResolvedValue(createUser());
  createSession.mockResolvedValue("session-key");

  const response = await GET(callbackRequest());

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://app.example.com/");
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
    idToken: identity.idToken,
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
    create.mockResolvedValue(createUser());
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

test.each(["https://app.example.com", "https://app.example.com/"])(
  "redirects successful authentication to app base URL %s",
  async (baseUrl) => {
    appEnv.APP_BASE_URL = baseUrl;
    exchangeAuthorizationCode.mockResolvedValue(identity);
    create.mockResolvedValue(createUser());
    createSession.mockResolvedValue("session-key");

    const response = await GET(callbackRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://app.example.com/");
  },
);
