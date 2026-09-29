import { createHash } from "node:crypto";

import { ForbiddenError } from "@/server/errors/forbidden-error";
import { createUser } from "@/test-support/fixtures/user";
import { IdentityAlreadyExistsError, UserNotFoundError } from "./user-errors";
import type { UserRepository } from "./user-repository";
import { DefaultUserService } from "./user-service";

const registeredUser = createUser({
  id: "11111111-1111-4111-8111-111111111111",
});
const guestUser = createUser({
  id: "22222222-2222-4222-8222-222222222222",
  kind: "GUEST",
  expiresAt: new Date("2026-10-01T12:00:00.000Z"),
});
const identity = {
  issuer: "https://issuer.example",
  subject: "subject-1",
  email: "runner@example.com",
  accessToken: "access-token",
  idToken: "id-token",
  refreshToken: "refresh-token",
};
const identityKey = {
  issuer: identity.issuer,
  subject: identity.subject,
};
const identityRecord = { ...identityKey, email: identity.email };

function userService() {
  const repository: UserRepository = {
    findById: vi.fn().mockResolvedValue(guestUser),
    findByIdentity: vi.fn().mockResolvedValue(registeredUser),
    findBySessionKeyHash: vi.fn().mockResolvedValue(guestUser),
    deleteSessionBySessionKeyHash: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(registeredUser),
    createGuestUser: vi.fn().mockResolvedValue(guestUser),
    promoteGuestUser: vi
      .fn()
      .mockResolvedValue(
        createUser({ ...guestUser, kind: "REGISTERED", expiresAt: null }),
      ),
    updateRegisteredProfile: vi.fn(),
    deleteGuestUser: vi.fn().mockResolvedValue(undefined),
    createSession: vi.fn().mockResolvedValue(undefined),
  };
  return { service: new DefaultUserService(repository), repository };
}

function sessionRecord(key: string, userId: string, tokens = identity) {
  return {
    userId,
    accessToken: tokens.accessToken,
    idToken: tokens.idToken,
    refreshToken: tokens.refreshToken,
    sessionKeyHash: createHash("sha256").update(key).digest("hex"),
    expiresAt: expect.any(Date),
  };
}

test.each(["id-token", null])(
  "deletes a session using its hash and returns %s",
  async (token) => {
    const { service, repository } = userService();
    vi.mocked(repository.deleteSessionBySessionKeyHash).mockResolvedValue(
      token,
    );

    await expect(service.deleteSession("session-key")).resolves.toBe(token);
    expect(
      repository.deleteSessionBySessionKeyHash,
    ).toHaveBeenCalledExactlyOnceWith(
      createHash("sha256").update("session-key").digest("hex"),
    );
  },
);

test("propagates session deletion failures", async () => {
  const { service, repository } = userService();
  const failure = new Error("database unavailable");
  vi.mocked(repository.deleteSessionBySessionKeyHash).mockRejectedValue(
    failure,
  );
  await expect(service.deleteSession("session-key")).rejects.toBe(failure);
});

test("updates only a registered user's profile", async () => {
  const { service, repository } = userService();
  const updated = createUser({
    ...registeredUser,
    firstName: "Ada",
    measurementUnit: "MILES",
  });
  vi.mocked(repository.findById).mockResolvedValue(registeredUser);
  vi.mocked(repository.updateRegisteredProfile).mockResolvedValue(updated);
  const input = { firstName: "Ada", measurementUnit: "MILES" as const };

  await expect(service.updateProfile(registeredUser.id, input)).resolves.toBe(
    updated,
  );
  expect(repository.updateRegisteredProfile).toHaveBeenCalledExactlyOnceWith(
    registeredUser.id,
    input,
  );
});

test("refuses guest profile updates", async () => {
  const { service, repository } = userService();
  await expect(
    service.updateProfile(guestUser.id, { measurementUnit: "MILES" }),
  ).rejects.toBeInstanceOf(ForbiddenError);
  expect(repository.updateRegisteredProfile).not.toHaveBeenCalled();
});

test("findById returns a matching user and rejects a missing user", async () => {
  const { service, repository } = userService();
  await expect(service.findById(guestUser.id)).resolves.toBe(guestUser);
  vi.mocked(repository.findById).mockResolvedValue(null);
  await expect(service.findById("missing-user")).rejects.toThrow(
    UserNotFoundError,
  );
});

test("finds a user for a valid session key using its hash", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-25T12:00:00.000Z"));
  try {
    const { service, repository } = userService();
    await expect(service.findBySessionKey("session-key")).resolves.toBe(
      guestUser,
    );
    expect(repository.findBySessionKeyHash).toHaveBeenCalledExactlyOnceWith(
      createHash("sha256").update("session-key").digest("hex"),
      new Date("2026-09-25T12:00:00.000Z"),
    );
  } finally {
    vi.useRealTimers();
  }
});

test("rejects missing, unknown, and expired sessions", async () => {
  const { service, repository } = userService();
  await expect(service.findBySessionKey("")).rejects.toThrow(UserNotFoundError);
  expect(repository.findBySessionKeyHash).not.toHaveBeenCalled();
  vi.mocked(repository.findBySessionKeyHash).mockResolvedValue(null);
  await expect(service.findBySessionKey("unknown-session")).rejects.toThrow(
    UserNotFoundError,
  );
  await expect(service.findBySessionKey("expired-session")).rejects.toThrow(
    UserNotFoundError,
  );
});

test("starts a guest session with a seven-day guest and a hashed thirty-day key", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-24T12:00:00.000Z"));
  try {
    const { service, repository } = userService();
    const first = await service.startGuestSession();
    const second = await service.startGuestSession();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).not.toBe(first);
    expect(repository.createGuestUser).toHaveBeenCalledTimes(2);
    expect(repository.createGuestUser).toHaveBeenCalledWith(
      new Date("2026-10-01T12:00:00.000Z"),
    );
    expect(repository.findById).toHaveBeenCalledWith(guestUser.id);
    expect(repository.findByIdentity).not.toHaveBeenCalled();
    for (const [index, key] of [first, second].entries()) {
      expect(repository.createSession).toHaveBeenNthCalledWith(index + 1, {
        userId: guestUser.id,
        accessToken: null,
        idToken: null,
        refreshToken: null,
        sessionKeyHash: createHash("sha256").update(key).digest("hex"),
        expiresAt: new Date("2026-10-24T12:00:00.000Z"),
      });
      expect(
        JSON.stringify(vi.mocked(repository.createSession).mock.calls[index]),
      ).not.toContain(key);
    }
  } finally {
    vi.useRealTimers();
  }
});

test("stops guest entry when guest creation fails", async () => {
  const { service, repository } = userService();
  const failure = new Error("database unavailable");
  vi.mocked(repository.createGuestUser).mockRejectedValue(failure);
  await expect(service.startGuestSession()).rejects.toBe(failure);
  expect(repository.createSession).not.toHaveBeenCalled();
});

test.each([null, registeredUser])(
  "refuses a guest session when the created guest is no longer active: %s",
  async (found) => {
    const { service, repository } = userService();
    vi.mocked(repository.findById).mockResolvedValue(found);
    await expect(service.startGuestSession()).rejects.toThrow(
      UserNotFoundError,
    );
    expect(repository.createSession).not.toHaveBeenCalled();
  },
);

test("does not return a guest key if session persistence fails", async () => {
  const { service, repository } = userService();
  const failure = new Error("database unavailable");
  vi.mocked(repository.createSession).mockRejectedValue(failure);
  await expect(service.startGuestSession()).rejects.toBe(failure);
});

test("promotes a guest for a new identity and preserves their user ID", async () => {
  const { service, repository } = userService();
  vi.mocked(repository.findByIdentity)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(
      createUser({ ...guestUser, kind: "REGISTERED", expiresAt: null }),
    );

  const key = await service.completeIdentitySignIn(identity, "old-session");

  expect(
    repository.deleteSessionBySessionKeyHash,
  ).toHaveBeenCalledExactlyOnceWith(
    createHash("sha256").update("old-session").digest("hex"),
  );
  expect(repository.promoteGuestUser).toHaveBeenCalledExactlyOnceWith(
    guestUser.id,
    identityRecord,
  );
  expect(repository.create).not.toHaveBeenCalled();
  expect(repository.deleteGuestUser).not.toHaveBeenCalled();
  expect(repository.createSession).toHaveBeenCalledExactlyOnceWith(
    sessionRecord(key, guestUser.id),
  );
  expect(
    vi.mocked(repository.deleteSessionBySessionKeyHash).mock
      .invocationCallOrder[0],
  ).toBeLessThan(
    vi.mocked(repository.createSession).mock.invocationCallOrder[0],
  );
});

test("deletes a guest when signing in to an existing identity", async () => {
  const { service, repository } = userService();
  const key = await service.completeIdentitySignIn(identity, "old-session");

  expect(repository.deleteGuestUser).toHaveBeenCalledExactlyOnceWith(
    guestUser.id,
  );
  expect(repository.promoteGuestUser).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
  expect(repository.createSession).toHaveBeenCalledExactlyOnceWith(
    sessionRecord(key, registeredUser.id),
  );
});

test("replaces a registered session without changing an existing identity", async () => {
  const { service, repository } = userService();
  vi.mocked(repository.findBySessionKeyHash).mockResolvedValue(registeredUser);
  await service.completeIdentitySignIn(identity, "old-session");
  expect(repository.deleteSessionBySessionKeyHash).toHaveBeenCalledOnce();
  expect(repository.promoteGuestUser).not.toHaveBeenCalled();
  expect(repository.deleteGuestUser).not.toHaveBeenCalled();
  expect(repository.create).not.toHaveBeenCalled();
});

test("creates a new identity with no previous session", async () => {
  const { service, repository } = userService();
  vi.mocked(repository.findByIdentity)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(registeredUser);
  await service.completeIdentitySignIn(identity);
  expect(repository.findBySessionKeyHash).not.toHaveBeenCalled();
  expect(repository.deleteSessionBySessionKeyHash).not.toHaveBeenCalled();
  expect(repository.create).toHaveBeenCalledExactlyOnceWith(identityRecord);
});

test("creates a new identity when a registered session switches identity", async () => {
  const { service, repository } = userService();
  vi.mocked(repository.findBySessionKeyHash).mockResolvedValue(registeredUser);
  vi.mocked(repository.findByIdentity)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(registeredUser);
  await service.completeIdentitySignIn(identity, "old-session");
  expect(repository.deleteSessionBySessionKeyHash).toHaveBeenCalledOnce();
  expect(repository.create).toHaveBeenCalledExactlyOnceWith(identityRecord);
});

test("deletes an unknown previous session and continues registration", async () => {
  const { service, repository } = userService();
  vi.mocked(repository.findBySessionKeyHash).mockResolvedValue(null);
  vi.mocked(repository.findByIdentity)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(registeredUser);
  await service.completeIdentitySignIn(identity, "stale-session");
  expect(repository.deleteSessionBySessionKeyHash).toHaveBeenCalledOnce();
  expect(repository.create).toHaveBeenCalledOnce();
});

test("stops sign-in when previous session lookup fails unexpectedly", async () => {
  const { service, repository } = userService();
  const failure = new Error("database unavailable");
  vi.mocked(repository.findBySessionKeyHash).mockRejectedValue(failure);
  await expect(
    service.completeIdentitySignIn(identity, "old-session"),
  ).rejects.toBe(failure);
  expect(repository.deleteSessionBySessionKeyHash).not.toHaveBeenCalled();
  expect(repository.createSession).not.toHaveBeenCalled();
});

test("stops sign-in when previous session deletion fails", async () => {
  const { service, repository } = userService();
  const failure = new Error("database unavailable");
  vi.mocked(repository.deleteSessionBySessionKeyHash).mockRejectedValue(
    failure,
  );
  await expect(
    service.completeIdentitySignIn(identity, "old-session"),
  ).rejects.toBe(failure);
  expect(repository.findByIdentity).not.toHaveBeenCalled();
  expect(repository.createSession).not.toHaveBeenCalled();
});

test("stops sign-in when identity lookup fails", async () => {
  const { service, repository } = userService();
  const failure = new Error("database unavailable");
  vi.mocked(repository.findByIdentity).mockRejectedValue(failure);
  await expect(service.completeIdentitySignIn(identity)).rejects.toBe(failure);
  expect(repository.createSession).not.toHaveBeenCalled();
});

test("deletes a guest if the identity is claimed during promotion", async () => {
  const { service, repository } = userService();
  vi.mocked(repository.findByIdentity)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(registeredUser)
    .mockResolvedValueOnce(registeredUser);
  vi.mocked(repository.promoteGuestUser).mockRejectedValue(
    new IdentityAlreadyExistsError(),
  );
  await service.completeIdentitySignIn(identity, "old-session");
  expect(repository.findByIdentity).toHaveBeenCalledTimes(3);
  expect(repository.deleteGuestUser).toHaveBeenCalledExactlyOnceWith(
    guestUser.id,
  );
  expect(repository.createSession).toHaveBeenCalledOnce();
});

test("does not delete a guest when a conflicting identity disappears", async () => {
  const { service, repository } = userService();
  vi.mocked(repository.findByIdentity)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce(null);
  vi.mocked(repository.promoteGuestUser).mockRejectedValue(
    new IdentityAlreadyExistsError(),
  );
  await expect(
    service.completeIdentitySignIn(identity, "old-session"),
  ).rejects.toThrow(UserNotFoundError);
  expect(repository.deleteGuestUser).not.toHaveBeenCalled();
  expect(repository.createSession).not.toHaveBeenCalled();
});

test("does not issue a session when promotion fails unexpectedly", async () => {
  const { service, repository } = userService();
  const failure = new Error("database unavailable");
  vi.mocked(repository.findByIdentity).mockResolvedValueOnce(null);
  vi.mocked(repository.promoteGuestUser).mockRejectedValue(failure);
  await expect(
    service.completeIdentitySignIn(identity, "old-session"),
  ).rejects.toBe(failure);
  expect(repository.createSession).not.toHaveBeenCalled();
});

test("does not issue a session when guest deletion fails", async () => {
  const { service, repository } = userService();
  const failure = new Error("database unavailable");
  vi.mocked(repository.deleteGuestUser).mockRejectedValue(failure);
  await expect(
    service.completeIdentitySignIn(identity, "old-session"),
  ).rejects.toBe(failure);
  expect(repository.createSession).not.toHaveBeenCalled();
});

test("does not issue a session when new user creation fails", async () => {
  const { service, repository } = userService();
  const failure = new Error("database unavailable");
  vi.mocked(repository.findByIdentity).mockResolvedValueOnce(null);
  vi.mocked(repository.create).mockRejectedValue(failure);
  await expect(service.completeIdentitySignIn(identity)).rejects.toBe(failure);
  expect(repository.createSession).not.toHaveBeenCalled();
});

test.each([null, guestUser])(
  "rejects sign-in if the identity is not registered after reconciliation: %s",
  async (found) => {
    const { service, repository } = userService();
    vi.mocked(repository.findByIdentity)
      .mockResolvedValueOnce(registeredUser)
      .mockResolvedValueOnce(found);
    await expect(service.completeIdentitySignIn(identity)).rejects.toThrow(
      UserNotFoundError,
    );
    expect(repository.createSession).not.toHaveBeenCalled();
  },
);

test("does not return a registered key if persistence fails", async () => {
  const { service, repository } = userService();
  const failure = new Error("database unavailable");
  vi.mocked(repository.createSession).mockRejectedValue(failure);
  await expect(service.completeIdentitySignIn(identity)).rejects.toBe(failure);
});
