import { NextRequest } from "next/server";
import { BadRequestError } from "@/server/errors/bad-request-error";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { UserNotFoundError } from "@/server/user/user-errors";
import { createUser } from "@/test-support/fixtures/user";

import { GET, PATCH } from "./route";

const findBySessionKey = vi.hoisted(() => vi.fn());
const updateProfile = vi.hoisted(() => vi.fn());
const validateUpdate = vi.hoisted(() => vi.fn());

vi.mock("@/server/server", () => ({
  getUserService: () => ({ findBySessionKey, updateProfile }),
  userProfileRequestValidator: { validateUpdate },
}));

afterEach(() => {
  findBySessionKey.mockReset();
  updateProfile.mockReset();
  validateUpdate.mockReset();
});

function meRequest(sessionKey?: string) {
  return new NextRequest("https://app.example.com/api/v1/me", {
    headers: sessionKey
      ? { cookie: `__Host-user-session=${sessionKey}` }
      : undefined,
  });
}

test.each([
  createUser({
    firstName: "Ada",
    measurementUnit: "MILES",
  }),
  createUser({
    id: "guest-id",
    kind: "GUEST",
    expiresAt: new Date("2026-10-01T12:00:00.000Z"),
  }),
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

function patchRequest(body: string, sessionKey = "session-key") {
  return new NextRequest("https://app.example.com/api/v1/me", {
    method: "PATCH",
    headers: {
      cookie: `__Host-user-session=${sessionKey}`,
      "content-type": "application/json",
    },
    body,
  });
}

test("updates a registered user's profile and returns the full user", async () => {
  const user = createUser();
  const updated = createUser({ firstName: "Ada", measurementUnit: "MILES" });
  findBySessionKey.mockResolvedValue(user);
  validateUpdate.mockReturnValue({
    firstName: "Ada",
    measurementUnit: "MILES",
  });
  updateProfile.mockResolvedValue(updated);

  const response = await PATCH(
    patchRequest('{"firstName":"Ada","measurementUnit":"MILES"}'),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  await expect(response.json()).resolves.toEqual(updated);
  expect(validateUpdate).toHaveBeenCalledExactlyOnceWith({
    firstName: "Ada",
    measurementUnit: "MILES",
  });
  expect(updateProfile).toHaveBeenCalledExactlyOnceWith(user.id, {
    firstName: "Ada",
    measurementUnit: "MILES",
  });
});

test("rejects unauthenticated profile updates", async () => {
  const request = patchRequest('{"firstName":"Ada"}');
  request.cookies.delete("__Host-user-session");

  const response = await PATCH(request);

  expect(response.status).toBe(401);
  expect(validateUpdate).not.toHaveBeenCalled();
  expect(updateProfile).not.toHaveBeenCalled();
});

test("rejects malformed JSON", async () => {
  findBySessionKey.mockResolvedValue(createUser());

  const response = await PATCH(patchRequest("{"));

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Request body must be valid JSON",
  });
  expect(updateProfile).not.toHaveBeenCalled();
});

test("returns 400 for an invalid profile update", async () => {
  findBySessionKey.mockResolvedValue(createUser());
  validateUpdate.mockImplementation(() => {
    throw new BadRequestError("Invalid user profile");
  });

  const response = await PATCH(patchRequest('{"measurementUnit":"INVALID"}'));

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    error: "Invalid user profile",
  });
  expect(updateProfile).not.toHaveBeenCalled();
});

test("rejects guest profile updates", async () => {
  findBySessionKey.mockResolvedValue(
    createUser({ id: "guest-id", kind: "GUEST" }),
  );
  validateUpdate.mockReturnValue({ measurementUnit: "MILES" });
  updateProfile.mockRejectedValue(new ForbiddenError());

  const response = await PATCH(patchRequest('{"measurementUnit":"MILES"}'));

  expect(response.status).toBe(403);
  await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
});
