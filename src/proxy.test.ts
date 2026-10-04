import { NextRequest } from "next/server";
import { UserNotFoundError } from "@/server/user/user-errors";
import { createUser } from "@/test-support/fixtures/user";

import { config, proxy } from "./proxy";

const findBySessionKey = vi.hoisted(() => vi.fn());
const appEnv = vi.hoisted(() => ({
  APP_BASE_URL: "https://app.example.com/",
}));

vi.mock("@/server/server", () => ({
  getUserService: () => ({ findBySessionKey }),
}));
vi.mock("@/server/env/app-env", () => ({
  readAppEnv: () => appEnv,
}));

afterEach(() => {
  findBySessionKey.mockReset();
  appEnv.APP_BASE_URL = "https://app.example.com/";
});

function plannerRequest(sessionKey?: string) {
  return new NextRequest("http://0.0.0.0:3000/training-planner", {
    headers: sessionKey
      ? { cookie: `__Host-user-session=${sessionKey}` }
      : undefined,
  });
}

test("matches the home, training planner, training goals, and settings routes", () => {
  expect(config.matcher).toEqual([
    "/",
    "/training-planner",
    "/training-goals",
    "/settings",
  ]);
});

test.each(["GUEST", "REGISTERED"] as const)(
  "allows a %s session to open training goals",
  async (kind) => {
    findBySessionKey.mockResolvedValue(createUser({ kind }));

    const response = await proxy(
      new NextRequest("https://app.example.com/training-goals", {
        headers: { cookie: "__Host-user-session=session-key" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  },
);

test("redirects a visitor without a session away from training goals", async () => {
  const response = await proxy(
    new NextRequest("https://app.example.com/training-goals"),
  );

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://app.example.com/auth");
});

test("allows a guest session to open settings for the registration message", async () => {
  findBySessionKey.mockResolvedValue(
    createUser({ id: "guest-id", kind: "GUEST" }),
  );

  const response = await proxy(
    new NextRequest("https://app.example.com/settings", {
      headers: { cookie: "__Host-user-session=session-key" },
    }),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("x-middleware-next")).toBe("1");
});

test("redirects a visitor without a session away from settings", async () => {
  const response = await proxy(
    new NextRequest("https://app.example.com/settings"),
  );

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://app.example.com/auth");
});

test("allows an identified user to open the planner", async () => {
  findBySessionKey.mockResolvedValue(createUser());

  const response = await proxy(plannerRequest("session-key"));

  expect(response.status).toBe(200);
  expect(response.headers.get("x-middleware-next")).toBe("1");
  expect(findBySessionKey).toHaveBeenCalledExactlyOnceWith("session-key");
});

test("redirects to auth without a session cookie", async () => {
  const response = await proxy(plannerRequest());

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://app.example.com/auth");
  expect(findBySessionKey).not.toHaveBeenCalled();
});

test("redirects to auth when a session has no user", async () => {
  findBySessionKey.mockResolvedValue(null);

  const response = await proxy(plannerRequest("invalid-session"));

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://app.example.com/auth");
});

test("returns a server error if session lookup fails", async () => {
  findBySessionKey.mockRejectedValue(new Error("database unavailable"));

  const response = await proxy(plannerRequest("session-key"));

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to determine user session",
  });
});

function rootRequest(sessionKey?: string) {
  return new NextRequest("http://0.0.0.0:3000/", {
    headers: sessionKey
      ? { cookie: `__Host-user-session=${sessionKey}` }
      : undefined,
  });
}

test("redirects an identified home page user to the planner", async () => {
  findBySessionKey.mockResolvedValue(createUser());

  const response = await proxy(rootRequest("session-key"));

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(
    "https://app.example.com/training-planner",
  );
  expect(findBySessionKey).toHaveBeenCalledExactlyOnceWith("session-key");
});

test("renders the home page without a session cookie", async () => {
  const response = await proxy(rootRequest());

  expect(response.headers.get("x-middleware-next")).toBe("1");
  expect(response.headers.get("location")).toBeNull();
  expect(findBySessionKey).not.toHaveBeenCalled();
});

test("renders the home page when the session user is not found", async () => {
  findBySessionKey.mockRejectedValue(new UserNotFoundError());

  const response = await proxy(rootRequest("invalid-session"));

  expect(response.headers.get("x-middleware-next")).toBe("1");
  expect(response.headers.get("location")).toBeNull();
});

test("renders the home page when session lookup returns no user", async () => {
  findBySessionKey.mockResolvedValue(null);

  const response = await proxy(rootRequest("invalid-session"));

  expect(response.headers.get("x-middleware-next")).toBe("1");
});

test("returns a server error if home page session lookup fails", async () => {
  findBySessionKey.mockRejectedValue(new Error("database unavailable"));

  const response = await proxy(rootRequest("session-key"));

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to determine user session",
  });
});

test.each(["https://app.example.com", "https://app.example.com/"])(
  "uses app base URL %s for both proxy redirects",
  async (baseUrl) => {
    appEnv.APP_BASE_URL = baseUrl;
    findBySessionKey.mockResolvedValue(createUser());

    const homeResponse = await proxy(rootRequest("session-key"));
    const plannerResponse = await proxy(plannerRequest());

    expect(homeResponse.status).toBe(307);
    expect(homeResponse.headers.get("location")).toBe(
      "https://app.example.com/training-planner",
    );
    expect(plannerResponse.status).toBe(307);
    expect(plannerResponse.headers.get("location")).toBe(
      "https://app.example.com/auth",
    );
  },
);
