import { createHash } from "node:crypto";

import type { User } from "@/domain/user-types";
import { UserNotFoundError } from "./user-errors";
import type { UserRepository } from "./user-repository";
import { DefaultUserService } from "./user-service";

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
  const user: User = { id: "11111111-1111-4111-8111-111111111111" };
  const repository: UserRepository = {
    findById: vi.fn(),
    findByIdentity: vi.fn().mockResolvedValue(user),
    findBySessionKeyHash: vi.fn(),
    deleteSessionBySessionKeyHash: vi.fn(),
    create: vi.fn(),
    createSession: vi.fn(),
  };
  const service = new DefaultUserService(repository);
  const identity = { issuer: "https://issuer.example", subject: "subject-1" };

  await expect(service.findByIdentity(identity)).resolves.toBe(user);
  expect(repository.findByIdentity).toHaveBeenCalledWith(identity);
});

test("creates a user from an identity and email", async () => {
  const user: User = { id: "11111111-1111-4111-8111-111111111111" };
  const repository: UserRepository = {
    findById: vi.fn(),
    findByIdentity: vi.fn(),
    findBySessionKeyHash: vi.fn(),
    deleteSessionBySessionKeyHash: vi.fn(),
    create: vi.fn().mockResolvedValue(user),
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

function sessionService(
  identity: User | null = { id: "11111111-1111-4111-8111-111111111111" },
) {
  const repository: UserRepository = {
    findById: vi.fn(),
    findByIdentity: vi.fn().mockResolvedValue(identity),
    findBySessionKeyHash: vi.fn(),
    deleteSessionBySessionKeyHash: vi.fn(),
    create: vi.fn(),
    createSession: vi.fn().mockResolvedValue(undefined),
  };
  return { service: new DefaultUserService(repository), repository };
}

test("findById returns a matching user", async () => {
  const { service, repository } = sessionService();
  const user = { id: "11111111-1111-4111-8111-111111111111" };
  vi.mocked(repository.findById).mockResolvedValue(user);

  await expect(service.findById(user.id)).resolves.toEqual(user);
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
    const user = { id: "11111111-1111-4111-8111-111111111111" };
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
        ...sessionInput,
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
