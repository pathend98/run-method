import { NextRequest } from "next/server";

import { AuthenticationLookupError } from "@/server/errors/authentication-lookup-error";
import { UnauthorizedError } from "@/server/errors/unauthorized-error";
import { UserNotFoundError } from "@/server/user/user-errors";
import { createUser } from "@/test-support/fixtures/user";
import { DefaultRequestAuthenticationService } from "./request-authentication-service";

const findBySessionKey = vi.fn();
const getUserService = vi.fn(() => ({ findBySessionKey }));
const service = new DefaultRequestAuthenticationService(getUserService);

function request(cookie?: string) {
  return new NextRequest("http://localhost/api/v1/athletes", {
    headers: cookie ? { cookie: `__Host-user-session=${cookie}` } : {},
  });
}

beforeEach(() => vi.clearAllMocks());

test("rejects a missing cookie without looking up a user", async () => {
  await expect(service.authenticateActor(request())).rejects.toThrow(
    UnauthorizedError,
  );
  expect(findBySessionKey).not.toHaveBeenCalled();
  expect(getUserService).not.toHaveBeenCalled();
});

test("resolves the actor id from the session cookie", async () => {
  findBySessionKey.mockResolvedValue(
    createUser({
      id: "athlete-id",
    }),
  );
  await expect(service.authenticateActor(request("session-key"))).resolves.toBe(
    "athlete-id",
  );
  expect(findBySessionKey).toHaveBeenCalledWith("session-key");
});

test("resolves the full user from the session cookie", async () => {
  const user = createUser({
    id: "athlete-id",
    kind: "GUEST",
    expiresAt: new Date("2026-10-01T12:00:00.000Z"),
  });
  findBySessionKey.mockResolvedValue(user);

  await expect(service.authenticateUser(request("session-key"))).resolves.toBe(
    user,
  );
});

test("translates a missing user into UnauthorizedError", async () => {
  findBySessionKey.mockRejectedValue(new UserNotFoundError());
  await expect(service.authenticateActor(request("expired"))).rejects.toThrow(
    UnauthorizedError,
  );
});

test("translates unexpected lookup errors into AuthenticationLookupError", async () => {
  findBySessionKey.mockRejectedValue(new Error("database down"));
  await expect(
    service.authenticateActor(request("session-key")),
  ).rejects.toThrow(AuthenticationLookupError);
});

test("masks service initialization failures", async () => {
  const service = new DefaultRequestAuthenticationService(() => {
    throw new Error("private configuration");
  });
  await expect(
    service.authenticateUser(request("session-key")),
  ).rejects.toThrow(AuthenticationLookupError);
});
