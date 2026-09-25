import { NextRequest } from "next/server";

import { AuthenticationLookupError } from "@/server/errors/authentication-lookup-error";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { UnauthorizedError } from "@/server/errors/unauthorized-error";
import { UserNotFoundError } from "@/server/user/user-errors";
import { authenticateActor, authorizeAthlete } from "./athlete-authorization";

const findBySessionKey = vi.hoisted(() => vi.fn());
vi.mock("@/server/server", () => ({
  getUserService: () => ({ findBySessionKey }),
}));

function request(cookie?: string) {
  return new NextRequest("http://localhost/api/v1/athletes", {
    headers: cookie ? { cookie: `__Host-user-session=${cookie}` } : {},
  });
}

beforeEach(() => vi.clearAllMocks());

test("rejects a missing cookie without looking up a user", async () => {
  await expect(authenticateActor(request())).rejects.toThrow(UnauthorizedError);
  expect(findBySessionKey).not.toHaveBeenCalled();
});

test("resolves the actor id from the session cookie", async () => {
  findBySessionKey.mockResolvedValue({ id: "athlete-id" });
  await expect(authenticateActor(request("session-key"))).resolves.toBe(
    "athlete-id",
  );
  expect(findBySessionKey).toHaveBeenCalledWith("session-key");
});

test("translates a missing user into UnauthorizedError", async () => {
  findBySessionKey.mockRejectedValue(new UserNotFoundError());
  await expect(authenticateActor(request("expired"))).rejects.toThrow(
    UnauthorizedError,
  );
});

test("translates unexpected lookup errors into AuthenticationLookupError", async () => {
  findBySessionKey.mockRejectedValue(new Error("database down"));
  await expect(authenticateActor(request("session-key"))).rejects.toThrow(
    AuthenticationLookupError,
  );
});

test("allows only matching athlete ids", () => {
  expect(() => authorizeAthlete("athlete-id", "athlete-id")).not.toThrow();
  expect(() => authorizeAthlete("athlete-id", "other-id")).toThrow(
    ForbiddenError,
  );
});
