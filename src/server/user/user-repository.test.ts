import { userIdentities, userSessions, users } from "@db/schema";
import { PgDialect } from "drizzle-orm/pg-core";
import { DrizzleUserRepository } from "./user-repository";

test.each([undefined, "id-token", null])(
  "deletes only the matching session regardless of expiry (%s)",
  async (idToken) => {
    const returning = vi
      .fn()
      .mockResolvedValue(idToken === undefined ? [] : [{ idToken }]);
    const where = vi.fn().mockReturnValue({ returning });
    const deleteRows = vi.fn().mockReturnValue({ where });
    const repository = new DrizzleUserRepository({
      delete: deleteRows,
    } as never);

    await expect(
      repository.deleteSessionBySessionKeyHash("hash"),
    ).resolves.toBe(idToken ?? null);
    expect(returning).toHaveBeenCalledExactlyOnceWith({
      idToken: userSessions.idToken,
    });
    expect(deleteRows).toHaveBeenCalledExactlyOnceWith(userSessions);
    const query = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
    expect(query.sql).toBe('"user_session"."session_key_hash" = $1');
    expect(query.params).toEqual(["hash"]);
  },
);

test("propagates database errors during session deletion", async () => {
  const error = new Error("database unavailable");
  const where = vi
    .fn()
    .mockReturnValue({ returning: vi.fn().mockRejectedValue(error) });
  const repository = new DrizzleUserRepository({
    delete: vi.fn().mockReturnValue({ where }),
  } as never);

  await expect(repository.deleteSessionBySessionKeyHash("hash")).rejects.toBe(
    error,
  );
});

const input = {
  issuer: "https://issuer.example",
  subject: "subject-1",
  email: "runner@example.com",
};
const user = { id: "11111111-1111-4111-8111-111111111111" };

function lookupRepository(rows: { id: string }[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const innerJoin = vi.fn().mockReturnValue({ where });
  const from = vi.fn().mockReturnValue({ innerJoin });
  const select = vi.fn().mockReturnValue({ from });
  return {
    repository: new DrizzleUserRepository({ select } as never),
    from,
    innerJoin,
    limit,
    where,
  };
}

test.each([{ rows: [user] }, { rows: [] }])(
  "findById returns the matching user or null %#",
  async ({ rows }) => {
    const limit = vi.fn().mockResolvedValue(rows);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    const select = vi.fn().mockReturnValue({ from });
    const repository = new DrizzleUserRepository({ select } as never);

    await expect(repository.findById(user.id)).resolves.toEqual(
      rows[0] ?? null,
    );
    expect(from).toHaveBeenCalledWith(users);
    expect(new PgDialect().sqlToQuery(where.mock.calls[0][0]).params).toEqual([
      user.id,
    ]);
    expect(limit).toHaveBeenCalledWith(1);
  },
);

test("finds the user joined to an identity", async () => {
  const { repository, from, innerJoin, limit } = lookupRepository([user]);

  await expect(repository.findByIdentity(input)).resolves.toEqual(user);
  expect(from).toHaveBeenCalledWith(userIdentities);
  expect(innerJoin).toHaveBeenCalledWith(users, expect.anything());
  expect(limit).toHaveBeenCalledWith(1);
});

test("returns null when the identity has no user", async () => {
  const { repository } = lookupRepository([]);

  await expect(repository.findByIdentity(input)).resolves.toBeNull();
});

test("finds a user joined to an unexpired session", async () => {
  const { repository, from, innerJoin, limit } = lookupRepository([user]);
  const now = new Date("2026-09-25T12:00:00.000Z");
  const where = vi.fn().mockReturnValue({ limit });
  innerJoin.mockReturnValue({ innerJoin, where });

  await expect(
    repository.findBySessionKeyHash("hashed-key", now),
  ).resolves.toEqual(user);
  expect(from).toHaveBeenCalledWith(userSessions);
  expect(innerJoin).toHaveBeenCalledExactlyOnceWith(users, expect.anything());
  expect(new PgDialect().sqlToQuery(innerJoin.mock.calls[0][1]).sql).toBe(
    '"user_session"."user_id" = "user"."id"',
  );
  const query = new PgDialect().sqlToQuery(where.mock.calls[0][0]);
  expect(query.sql).toContain('"user_session"."session_key_hash" = $1');
  expect(query.sql).toContain('"user_session"."expires_at" > $2');
  expect(query.params).toEqual(["hashed-key", now.toISOString()]);
  expect(limit).toHaveBeenCalledWith(1);
});

test("returns null for an unknown or expired session", async () => {
  const { repository, from, innerJoin, limit } = lookupRepository([]);
  const where = vi.fn().mockReturnValue({ limit });
  innerJoin.mockReturnValue({ innerJoin, where });

  await expect(
    repository.findBySessionKeyHash("missing-or-expired", new Date()),
  ).resolves.toBeNull();
  expect(from).toHaveBeenCalledWith(userSessions);
});

function creationRepository(identityRows: { userId: string }[]) {
  const userReturning = vi.fn().mockResolvedValue([user]);
  const userValues = vi.fn().mockReturnValue({ returning: userReturning });
  const identityReturning = vi.fn().mockResolvedValue(identityRows);
  const onConflictDoNothing = vi
    .fn()
    .mockReturnValue({ returning: identityReturning });
  const identityValues = vi.fn().mockReturnValue({ onConflictDoNothing });
  const insert = vi.fn((table) =>
    table === users ? { values: userValues } : { values: identityValues },
  );
  const transaction = vi.fn(async (callback) => callback({ insert }));
  return {
    repository: new DrizzleUserRepository({ transaction } as never),
    transaction,
    insert,
    userValues,
    identityValues,
    onConflictDoNothing,
  };
}

test("creates the user and identity in one transaction", async () => {
  const {
    repository,
    transaction,
    insert,
    userValues,
    identityValues,
    onConflictDoNothing,
  } = creationRepository([{ userId: user.id }]);

  await expect(repository.create(input)).resolves.toEqual(user);
  expect(transaction).toHaveBeenCalledOnce();
  expect(insert).toHaveBeenNthCalledWith(1, users);
  expect(insert).toHaveBeenNthCalledWith(2, userIdentities);
  expect(userValues).toHaveBeenCalledWith({});
  expect(identityValues).toHaveBeenCalledWith({
    userId: user.id,
    ...input,
  });
  expect(onConflictDoNothing).toHaveBeenCalledWith({
    target: [userIdentities.issuer, userIdentities.subject],
  });
});

test("returns the existing user after a duplicate identity rolls back", async () => {
  const { repository, transaction, identityValues } = creationRepository([]);
  const find = vi.spyOn(repository, "findByIdentity").mockResolvedValue(user);

  await expect(repository.create(input)).resolves.toEqual(user);
  expect(transaction).toHaveBeenCalledOnce();
  expect(find).toHaveBeenCalledWith(input);
  expect(identityValues).toHaveBeenCalledWith({ userId: user.id, ...input });
});

test("does not return an unrelated user if a conflicting identity disappears", async () => {
  const { repository } = creationRepository([]);
  vi.spyOn(repository, "findByIdentity").mockResolvedValue(null);

  await expect(repository.create(input)).rejects.toThrow();
});

test("propagates unrelated transaction failures", async () => {
  const failure = new Error("database unavailable");
  const repository = new DrizzleUserRepository({
    transaction: vi.fn().mockRejectedValue(failure),
  } as never);

  await expect(repository.create(input)).rejects.toBe(failure);
});

test("concurrent creation returns the same user for a shared identity", async () => {
  const winner = { id: "22222222-2222-4222-8222-222222222222" };
  let nextId = 0;
  let storedUser: typeof winner | null = null;
  const transaction = vi.fn(async (callback) => {
    const candidate = nextId++ === 0 ? winner : user;
    const insert = vi.fn((table) => ({
      values: vi.fn((value) => {
        if (table === users) {
          return { returning: vi.fn().mockResolvedValue([candidate]) };
        }
        return {
          onConflictDoNothing: vi.fn().mockReturnValue({
            returning: vi.fn(async () => {
              if (storedUser) return [];
              storedUser = { id: value.userId };
              return [{ userId: value.userId }];
            }),
          }),
        };
      }),
    }));
    return callback({ insert });
  });
  const repository = new DrizzleUserRepository({ transaction } as never);
  vi.spyOn(repository, "findByIdentity").mockImplementation(
    async () => storedUser,
  );

  await expect(
    Promise.all([repository.create(input), repository.create(input)]),
  ).resolves.toEqual([winner, winner]);
  expect(transaction).toHaveBeenCalledTimes(2);
});

test.each(["token", null])(
  "inserts a session linked directly to a user with tokens %s",
  async (token) => {
    const values = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn().mockReturnValue({ values });
    const repository = new DrizzleUserRepository({ insert } as never);
    const session = {
      sessionKeyHash: "hash",
      userId: user.id,
      accessToken: token,
      idToken: token,
      refreshToken: token,
      expiresAt: new Date("2026-10-24T12:00:00.000Z"),
    };

    await expect(repository.createSession(session)).resolves.toBeUndefined();
    expect(insert).toHaveBeenCalledWith(userSessions);
    expect(values).toHaveBeenCalledWith(session);
  },
);
