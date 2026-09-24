import { userIdentities, users } from "@db/schema";
import { DrizzleUserRepository } from "./user-repository";

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
  };
}

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
