import { createHash } from "node:crypto";

import type { User } from "@/domain/user-types";
import { UserIdentityNotFoundError } from "./user-errors";
import type { UserRepository } from "./user-repository";
import { DefaultUserService } from "./user-service";

test("finds a user by issuer and subject", async () => {
  const user: User = { id: "11111111-1111-4111-8111-111111111111" };
  const repository: UserRepository = {
    findById: vi.fn(),
    findByIdentity: vi.fn().mockResolvedValue(user),
    findBySessionKeyHash: vi.fn(),
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
  refreshToken: "refresh-token",
};

function sessionService(
  identity: User | null = { id: "11111111-1111-4111-8111-111111111111" },
) {
  const repository: UserRepository = {
    findById: vi.fn(),
    findByIdentity: vi.fn().mockResolvedValue(identity),
    findBySessionKeyHash: vi.fn(),
    create: vi.fn(),
    createSession: vi.fn().mockResolvedValue(undefined),
  };
  return { service: new DefaultUserService(repository), repository };
}

test.each([[{ id: "11111111-1111-4111-8111-111111111111" }], [null]])(
  "findById returns the repository result %#",
  async (user) => {
    const { service, repository } = sessionService();
    vi.mocked(repository.findById).mockResolvedValue(user);

    await expect(
      service.findById("11111111-1111-4111-8111-111111111111"),
    ).resolves.toEqual(user);
    expect(repository.findById).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
    );
  },
);

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

  await expect(service.findBySessionKey("")).resolves.toBeNull();
  expect(repository.findBySessionKeyHash).not.toHaveBeenCalled();
});

test("returns no user for an unknown or expired session", async () => {
  const { service, repository } = sessionService();
  vi.mocked(repository.findBySessionKeyHash).mockResolvedValue(null);

  await expect(service.findBySessionKey("unknown-session")).resolves.toBeNull();
  await expect(service.findBySessionKey("expired-session")).resolves.toBeNull();
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
    UserIdentityNotFoundError,
  );
  expect(repository.createSession).not.toHaveBeenCalled();
});

test("does not return a session key if persistence fails", async () => {
  const { service, repository } = sessionService();
  const failure = new Error("database unavailable");
  vi.mocked(repository.createSession).mockRejectedValue(failure);

  await expect(service.createSession(sessionInput)).rejects.toBe(failure);
});
