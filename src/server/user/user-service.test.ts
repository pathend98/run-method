import { createHash } from "node:crypto";

import type { User } from "@/domain/user-types";
import { ForbiddenError } from "@/server/errors/forbidden-error";
import { UserNotFoundError } from "./user-errors";
import type { UserRepository } from "./user-repository";
import { DefaultUserService } from "./user-service";

const registeredUser: User = {
  id: "11111111-1111-4111-8111-111111111111",
  kind: "REGISTERED",
  expiresAt: null,
  firstName: null,
  measurementUnit: "KILOMETRES",
};
const guestUser: User = {
  ...registeredUser,
  kind: "GUEST",
  expiresAt: new Date("2026-10-01T12:00:00.000Z"),
};

test.each(["id-token", null])(
  "deletes a session using its hash and returns %s",
  async (token) => {
    const { service, repository } = sessionService();

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
  const { service, repository } = sessionService();
  const error = new Error("database unavailable");
  vi.mocked(repository.deleteSessionBySessionKeyHash).mockRejectedValue(error);

  await expect(service.deleteSession("session-key")).rejects.toBe(error);
});

test("finds a user by issuer and subject", async () => {
  const user = registeredUser;
  const repository: UserRepository = {
    findById: vi.fn(),
    findByIdentity: vi.fn().mockResolvedValue(user),
    findBySessionKeyHash: vi.fn(),
    deleteSessionBySessionKeyHash: vi.fn(),
    create: vi.fn(),
    createGuestUser: vi.fn(),
    promoteGuestUser: vi.fn(),
    updateRegisteredProfile: vi.fn(),
    deleteGuestUser: vi.fn(),
    createSession: vi.fn(),
  };
  const service = new DefaultUserService(repository);
  const identity = { issuer: "https://issuer.example", subject: "subject-1" };

  await expect(service.findByIdentity(identity)).resolves.toBe(user);
  expect(repository.findByIdentity).toHaveBeenCalledWith(identity);
});

test("creates a user from an identity and email", async () => {
  const user = registeredUser;
  const repository: UserRepository = {
    findById: vi.fn(),
    findByIdentity: vi.fn(),
    findBySessionKeyHash: vi.fn(),
    deleteSessionBySessionKeyHash: vi.fn(),
    create: vi.fn().mockResolvedValue(user),
    createGuestUser: vi.fn(),
    promoteGuestUser: vi.fn(),
    updateRegisteredProfile: vi.fn(),
    deleteGuestUser: vi.fn(),
    createSession: vi.fn(),
  };
  const service = new DefaultUserService(repository);
  const input = {
    issuer: "https://issuer.example",
    subject: "subject-1",
    email: "runner@example.com",
  };

  await expect(service.create(input)).resolves.toBe(user);
  expect(repository.create).toHaveBeenCalledWith(input);
});

const sessionInput = {
  issuer: "https://issuer.example",
  subject: "subject-1",
  accessToken: "access-token",
  idToken: "id-token",
  refreshToken: "refresh-token",
};

function sessionService(identity: User | null = registeredUser) {
  const repository: UserRepository = {
    findById: vi.fn(),
    findByIdentity: vi.fn().mockResolvedValue(identity),
    findBySessionKeyHash: vi.fn(),
    deleteSessionBySessionKeyHash: vi.fn(),
    create: vi.fn(),
    createGuestUser: vi.fn(),
    promoteGuestUser: vi.fn(),
    updateRegisteredProfile: vi.fn(),
    deleteGuestUser: vi.fn(),
    createSession: vi.fn().mockResolvedValue(undefined),
  };
  return { service: new DefaultUserService(repository), repository };
}

test("updates only a registered user's profile", async () => {
  const { service, repository } = sessionService();
  const updated = {
    ...registeredUser,
    firstName: "Ada",
    measurementUnit: "MILES" as const,
  };
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
  const { service, repository } = sessionService();
  vi.mocked(repository.findById).mockResolvedValue(guestUser);

  await expect(
    service.updateProfile(guestUser.id, { measurementUnit: "MILES" }),
  ).rejects.toBeInstanceOf(ForbiddenError);
  expect(repository.updateRegisteredProfile).not.toHaveBeenCalled();
});

test("findById returns a matching user", async () => {
  const { service, repository } = sessionService();
  const user = guestUser;
  vi.mocked(repository.findById).mockResolvedValue(user);

  await expect(service.findById(user.id)).resolves.toBe(user);
  expect(repository.findById).toHaveBeenCalledWith(user.id);
});

test("findById rejects when the user is missing", async () => {
  const { service, repository } = sessionService();
  vi.mocked(repository.findById).mockResolvedValue(null);

  await expect(service.findById("missing-user")).rejects.toThrow(
    UserNotFoundError,
  );
});

test("findByIdentity rejects when the user is missing", async () => {
  const { service, repository } = sessionService(null);

  await expect(service.findByIdentity(sessionInput)).rejects.toThrow(
    UserNotFoundError,
  );
  expect(repository.findByIdentity).toHaveBeenCalledWith(sessionInput);
});

test("finds a user for a valid session key using its hash", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-25T12:00:00.000Z"));
  try {
    const { service, repository } = sessionService();
    const user = guestUser;
    vi.mocked(repository.findBySessionKeyHash).mockResolvedValue(user);

    await expect(service.findBySessionKey("session-key")).resolves.toBe(user);
    expect(repository.findBySessionKeyHash).toHaveBeenCalledExactlyOnceWith(
      createHash("sha256").update("session-key").digest("hex"),
      new Date("2026-09-25T12:00:00.000Z"),
    );
  } finally {
    vi.useRealTimers();
  }
});

test("does not look up a missing session key", async () => {
  const { service, repository } = sessionService();

  await expect(service.findBySessionKey("")).rejects.toThrow(UserNotFoundError);
  expect(repository.findBySessionKeyHash).not.toHaveBeenCalled();
});

test("rejects an unknown or expired session", async () => {
  const { service, repository } = sessionService();
  vi.mocked(repository.findBySessionKeyHash).mockResolvedValue(null);

  await expect(service.findBySessionKey("unknown-session")).rejects.toThrow(
    UserNotFoundError,
  );
  await expect(service.findBySessionKey("expired-session")).rejects.toThrow(
    UserNotFoundError,
  );
});

test("creates distinct session keys and stores only their hashes for 30 days", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-24T12:00:00.000Z"));
  try {
    const { service, repository } = sessionService();

    const firstKey = await service.createSession(sessionInput);
    const secondKey = await service.createSession(sessionInput);

    expect(firstKey).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(secondKey).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(secondKey).not.toBe(firstKey);
    expect(repository.findByIdentity).toHaveBeenCalledWith(sessionInput);
    expect(repository.createSession).toHaveBeenCalledTimes(2);
    for (const [index, key] of [firstKey, secondKey].entries()) {
      expect(repository.createSession).toHaveBeenNthCalledWith(index + 1, {
        userId: "11111111-1111-4111-8111-111111111111",
        accessToken: sessionInput.accessToken,
        idToken: sessionInput.idToken,
        refreshToken: sessionInput.refreshToken,
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

test("rejects session creation for an unknown identity", async () => {
  const { service, repository } = sessionService(null);

  await expect(service.createSession(sessionInput)).rejects.toBeInstanceOf(
    UserNotFoundError,
  );
  expect(repository.createSession).not.toHaveBeenCalled();
});

test("does not return a session key if persistence fails", async () => {
  const { service, repository } = sessionService();
  const failure = new Error("database unavailable");
  vi.mocked(repository.createSession).mockRejectedValue(failure);

  await expect(service.createSession(sessionInput)).rejects.toBe(failure);
});

test("creates a guest user that expires seven days after creation", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-24T12:00:00.000Z"));
  try {
    const { service, repository } = sessionService();
    const user = guestUser;
    vi.mocked(repository.createGuestUser).mockResolvedValue(user);

    await expect(service.createGuestUser()).resolves.toBe(user);
    expect(repository.createGuestUser).toHaveBeenCalledExactlyOnceWith(
      new Date("2026-10-01T12:00:00.000Z"),
    );
  } finally {
    vi.useRealTimers();
  }
});

test("promotes a guest through the repository and preserves its ID", async () => {
  const { service, repository } = sessionService();
  const identity = {
    issuer: "issuer",
    subject: "subject",
    email: "runner@example.com",
  };
  const promoted = {
    ...guestUser,
    kind: "REGISTERED" as const,
    expiresAt: null,
  };
  vi.mocked(repository.promoteGuestUser).mockResolvedValue(promoted);

  await expect(
    service.promoteGuestUser(guestUser.id, identity),
  ).resolves.toEqual(promoted);
  expect(repository.promoteGuestUser).toHaveBeenCalledExactlyOnceWith(
    guestUser.id,
    identity,
  );
});

test("deletes a guest through the repository", async () => {
  const { service, repository } = sessionService();
  await service.deleteGuestUser(guestUser.id);
  expect(repository.deleteGuestUser).toHaveBeenCalledExactlyOnceWith(
    guestUser.id,
  );
});

test("creates distinct tokenless guest sessions using the regular key format", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-24T12:00:00.000Z"));
  try {
    const { service, repository } = sessionService();
    const userId = "11111111-1111-4111-8111-111111111111";
    vi.mocked(repository.findById).mockResolvedValue(guestUser);

    const first = await service.createGuestUserSession(userId);
    const second = await service.createGuestUserSession(userId);

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).not.toBe(first);
    expect(repository.findById).toHaveBeenCalledTimes(2);
    expect(repository.findByIdentity).not.toHaveBeenCalled();
    for (const [index, key] of [first, second].entries()) {
      expect(repository.createSession).toHaveBeenNthCalledWith(index + 1, {
        userId,
        accessToken: null,
        idToken: null,
        refreshToken: null,
        sessionKeyHash: createHash("sha256").update(key).digest("hex"),
        expiresAt: new Date("2026-10-24T12:00:00.000Z"),
      });
    }
  } finally {
    vi.useRealTimers();
  }
});

test("rejects guest session creation for a missing or expired user", async () => {
  const { service, repository } = sessionService();
  vi.mocked(repository.findById).mockResolvedValue(null);

  await expect(service.createGuestUserSession("missing")).rejects.toThrow(
    UserNotFoundError,
  );
  expect(repository.createSession).not.toHaveBeenCalled();
});

test("rejects a registered session for a guest user", async () => {
  const { service, repository } = sessionService(guestUser);

  await expect(service.createSession(sessionInput)).rejects.toThrow(
    UserNotFoundError,
  );
  expect(repository.createSession).not.toHaveBeenCalled();
});

test("rejects a guest session for a registered user", async () => {
  const { service, repository } = sessionService();
  vi.mocked(repository.findById).mockResolvedValue(registeredUser);

  await expect(
    service.createGuestUserSession("11111111-1111-4111-8111-111111111111"),
  ).rejects.toThrow(UserNotFoundError);
  expect(repository.createSession).not.toHaveBeenCalled();
});
