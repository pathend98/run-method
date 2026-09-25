import { NextRequest } from "next/server";

import { config, proxy } from "./proxy";

const findBySessionKey = vi.hoisted(() => vi.fn());

vi.mock("@/server/server", () => ({
  getUserService: () => ({ findBySessionKey }),
}));

afterEach(() => {
  findBySessionKey.mockReset();
});

function plannerRequest(sessionKey?: string) {
  return new NextRequest("https://app.example.com/training-planner", {
    headers: sessionKey
      ? { cookie: `__Host-user-session=${sessionKey}` }
      : undefined,
  });
}

test("matches only the training planner route", () => {
  expect(config.matcher).toBe("/training-planner");
});

test("allows an identified user to open the planner", async () => {
  findBySessionKey.mockResolvedValue({ id: "user-id" });

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
