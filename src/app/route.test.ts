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

function rootRequest(sessionKey?: string) {
  return new NextRequest("https://app.example.com/", {
    headers: sessionKey
      ? { cookie: `__Host-user-session=${sessionKey}` }
      : undefined,
  });
}

test("redirects an identified user to the training planner", async () => {
  findBySessionKey.mockResolvedValue({ id: "user-id" });

  const response = await GET(rootRequest("session-key"));

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(
    "https://app.example.com/training-planner",
  );
  expect(findBySessionKey).toHaveBeenCalledExactlyOnceWith("session-key");
});

test("redirects to auth when the session cookie is missing", async () => {
  const response = await GET(rootRequest());

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://app.example.com/auth");
  expect(findBySessionKey).not.toHaveBeenCalled();
});

test("redirects to auth when the session has no user", async () => {
  findBySessionKey.mockRejectedValue(new UserNotFoundError());

  const response = await GET(rootRequest("invalid-session"));

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://app.example.com/auth");
});

test("returns a server error if session lookup fails", async () => {
  findBySessionKey.mockRejectedValue(new Error("database unavailable"));

  const response = await GET(rootRequest("session-key"));

  expect(response.status).toBe(500);
  await expect(response.json()).resolves.toEqual({
    error: "Unable to determine user session",
  });
});
