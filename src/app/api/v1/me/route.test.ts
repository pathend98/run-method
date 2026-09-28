import { NextRequest } from "next/server";
import { UserNotFoundError } from "@/server/user/user-errors";

import { GET } from "./route";

const findBySessionKey = vi.hoisted(() => vi.fn());

vi.mock("@/server/server", () => ({
  getUserService: () => ({ findBySessionKey }),
}));

afterEach(() => {
  findBySessionKey.mockReset();
});

function meRequest(sessionKey?: string) {
  return new NextRequest("https://app.example.com/api/v1/me", {
    headers: sessionKey
      ? { cookie: `__Host-user-session=${sessionKey}` }
      : undefined,
  });
}

test.each([
  { id: "user-id", kind: "REGISTERED", expiresAt: null },
  {
    id: "guest-id",
    kind: "GUEST",
    expiresAt: new Date("2026-10-01T12:00:00.000Z"),
  },
])("returns the full user with the active session (%s)", async (user) => {
  findBySessionKey.mockResolvedValue(user);

  const response = await GET(meRequest("session-key"));

  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({
    ...user,
    expiresAt: user.expiresAt?.toISOString() ?? null,
  });
  expect(findBySessionKey).toHaveBeenCalledExactlyOnceWith("session-key");
});

test("returns 401 when the session cookie is missing", async () => {
  const response = await GET(meRequest());

  expect(response.status).toBe(401);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  expect(findBySessionKey).not.toHaveBeenCalled();
});

test("returns 401 when the session has no user", async () => {
  findBySessionKey.mockRejectedValue(new UserNotFoundError());

  const response = await GET(meRequest("invalid-session"));

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
});

test("returns 500 when session lookup fails", async () => {
  findBySessionKey.mockRejectedValue(new Error("database unavailable"));

  const response = await GET(meRequest("session-key"));

  expect(response.status).toBe(500);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual({
    error: "Unable to determine user session",
  });
});
