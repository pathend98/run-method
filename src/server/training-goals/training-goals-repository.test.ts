import { ActiveTrainingGoalAlreadyExistsError } from "./training-goals-errors";
import { PgDialect } from "drizzle-orm/pg-core";
import { trainingGoals } from "@db/schema";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import { DrizzleTrainingGoalsRepository } from "./training-goals-repository";

function setup(row: typeof trainingGoals.$inferSelect) {
  const returning = vi.fn().mockResolvedValue([row]);
  const onConflictDoNothing = vi.fn().mockReturnValue({ returning });
  const values = vi.fn().mockReturnValue({ onConflictDoNothing });
  const insert = vi.fn().mockReturnValue({ values });
  const transform = vi.fn().mockReturnValue(goal);
  return {
    repository: new DrizzleTrainingGoalsRepository({ insert } as never, {
      transform,
    }),
    transform,
    onConflictDoNothing,
    returning,
    values,
    insert,
  };
}

const goal = createTrainingGoal();
const row: typeof trainingGoals.$inferSelect = {
  ...goal,
  createdAt: new Date(goal.createdAt),
  targetDistanceMetres: null,
  targetTimeSeconds: null,
  targetDate: null,
  description: null,
};

test("delegates the returned row to the transformer", async () => {
  const { repository, insert, values, returning, transform } = setup(row);
  const request = {
    athleteId: goal.athleteId,
    title: goal.title,
    type: goal.type,
  };
  await expect(repository.create(request)).resolves.toBe(goal);
  expect(transform).toHaveBeenCalledExactlyOnceWith(row);
  expect(insert).toHaveBeenCalledExactlyOnceWith(trainingGoals);
  expect(values).toHaveBeenCalledExactlyOnceWith(request);
  expect(returning).toHaveBeenCalledExactlyOnceWith();
});

test("persists all supplied optional values", async () => {
  const targets = {
    targetDistanceMetres: 42195,
    targetTimeSeconds: 14400,
    targetDate: "2027-04-01",
    description: "Marathon",
  };
  const { repository, values } = setup({ ...row, ...targets });
  const request = {
    athleteId: goal.athleteId,
    title: goal.title,
    type: goal.type,
    ...targets,
  };
  await expect(repository.create(request)).resolves.toBe(goal);
  expect(values).toHaveBeenCalledExactlyOnceWith(request);
});

test("propagates persistence failure", async () => {
  const { repository, returning, transform } = setup(row);
  const error = new Error("Database unavailable");
  returning.mockRejectedValue(error);
  await expect(
    repository.create({
      athleteId: goal.athleteId,
      title: goal.title,
      type: goal.type,
    }),
  ).rejects.toBe(error);
  expect(transform).not.toHaveBeenCalled();
});

test("propagates transformer failure", async () => {
  const { repository, transform } = setup(row);
  const error = new Error("Transformation failed");
  transform.mockImplementation(() => {
    throw error;
  });
  await expect(
    repository.create({
      athleteId: goal.athleteId,
      title: goal.title,
      type: goal.type,
    }),
  ).rejects.toBe(error);
});

function setupFind(rows: (typeof trainingGoals.$inferSelect)[] = [row]) {
  const orderBy = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ orderBy });
  const from = vi.fn().mockReturnValue({ where });
  const select = vi.fn().mockReturnValue({ from });
  const transform = vi.fn().mockImplementation((row) => ({
    ...goal,
    id: row.id,
    createdAt: row.createdAt.toISOString(),
  }));
  return {
    repository: new DrizzleTrainingGoalsRepository({ select } as never, {
      transform,
    }),
    select,
    from,
    where,
    orderBy,
    transform,
  };
}

test("filters by athlete and orders by descending creation date then ascending id", async () => {
  const { repository, select, from, where, orderBy } = setupFind();
  await repository.find(goal.athleteId);
  expect(select).toHaveBeenCalledExactlyOnceWith();
  expect(from).toHaveBeenCalledExactlyOnceWith(trainingGoals);
  const dialect = new PgDialect();
  const predicate = dialect.sqlToQuery(where.mock.calls[0][0]);
  expect(predicate.sql).toBe('"training_goals"."athlete_id" = $1');
  expect(predicate.params).toEqual([goal.athleteId]);
  const ordering = orderBy.mock.calls[0].map(
    (expression) => dialect.sqlToQuery(expression).sql,
  );
  expect(ordering).toEqual([
    '"training_goals"."created_at" desc',
    '"training_goals"."id" asc',
  ]);
});

test("transforms every returned goal and preserves database order", async () => {
  const rows = [
    { ...row, createdAt: new Date("2026-10-03T12:00:00.000Z") },
    {
      ...row,
      id: "22222222-2222-4222-8222-222222222222",
      createdAt: new Date("2026-10-02T12:00:00.000Z"),
    },
  ];
  const { repository, transform } = setupFind(rows);
  await expect(repository.find(goal.athleteId)).resolves.toEqual(
    rows.map((row) => ({
      ...goal,
      id: row.id,
      createdAt: row.createdAt.toISOString(),
    })),
  );
  expect(transform).toHaveBeenCalledTimes(2);
  expect(transform).toHaveBeenNthCalledWith(1, rows[0]);
  expect(transform).toHaveBeenNthCalledWith(2, rows[1]);
});

test("returns no goals without invoking the transformer for empty results", async () => {
  const { repository, transform } = setupFind([]);
  await expect(repository.find(goal.athleteId)).resolves.toEqual([]);
  expect(transform).not.toHaveBeenCalled();
});

test("propagates query failures without transforming rows", async () => {
  const { repository, orderBy, transform } = setupFind();
  const error = new Error("Database unavailable");
  orderBy.mockRejectedValue(error);
  await expect(repository.find(goal.athleteId)).rejects.toBe(error);
  expect(transform).not.toHaveBeenCalled();
});

test("targets only the partial active goal uniqueness constraint", async () => {
  const { repository, onConflictDoNothing } = setup(row);
  await repository.create({
    athleteId: goal.athleteId,
    title: goal.title,
    type: goal.type,
  });
  expect(onConflictDoNothing).toHaveBeenCalledTimes(1);
  const config = onConflictDoNothing.mock.calls[0][0];
  expect(config.target).toBe(trainingGoals.athleteId);
  expect(new PgDialect().sqlToQuery(config.where)).toMatchObject({
    sql: '"training_goals"."status" = \'ACTIVE\'',
    params: [],
  });
});

test("rejects an existing active goal without transforming a missing row", async () => {
  const { repository, returning, transform } = setup(row);
  returning.mockResolvedValue([]);
  await expect(
    repository.create({
      athleteId: goal.athleteId,
      title: goal.title,
      type: goal.type,
    }),
  ).rejects.toThrow(ActiveTrainingGoalAlreadyExistsError);
  expect(transform).not.toHaveBeenCalled();
});

function setupById() {
  const limit = vi.fn().mockResolvedValue([row]);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  const select = vi.fn().mockReturnValue({ from });
  const transform = vi.fn().mockReturnValue(goal);
  return {
    repository: new DrizzleTrainingGoalsRepository({ select } as never, {
      transform,
    }),
    limit,
    where,
    from,
    transform,
  };
}

test("finds and transforms a goal by id", async () => {
  const { repository, limit, where, from, transform } = setupById();
  await expect(repository.findById(goal.id)).resolves.toBe(goal);
  expect(from).toHaveBeenCalledExactlyOnceWith(trainingGoals);
  expect(limit).toHaveBeenCalledExactlyOnceWith(1);
  expect(new PgDialect().sqlToQuery(where.mock.calls[0][0])).toMatchObject({
    sql: '"training_goals"."id" = $1',
    params: [goal.id],
  });
  expect(transform).toHaveBeenCalledExactlyOnceWith(row);
});

test("returns null for a missing goal", async () => {
  const { repository, limit, transform } = setupById();
  limit.mockResolvedValue([]);
  await expect(repository.findById(goal.id)).resolves.toBeNull();
  expect(transform).not.toHaveBeenCalled();
});

test("propagates lookup database errors", async () => {
  const { repository, limit } = setupById();
  const error = new Error("Database unavailable");
  limit.mockRejectedValue(error);
  await expect(repository.findById(goal.id)).rejects.toBe(error);
});

function setupUpdate() {
  const returning = vi.fn().mockResolvedValue([row]);
  const where = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where });
  const update = vi.fn().mockReturnValue({ set });
  const transform = vi.fn().mockReturnValue(goal);
  return {
    repository: new DrizzleTrainingGoalsRepository({ update } as never, {
      transform,
    }),
    returning,
    where,
    set,
    update,
    transform,
  };
}

test("updates only editable fields and atomically checks ownership and active status", async () => {
  const { repository, update, where, set, transform } = setupUpdate();
  const request = {
    title: "New",
    description: null,
    targetDistanceMetres: null,
    targetTimeSeconds: null,
    targetDate: null,
    type: "OPEN" as const,
  };
  await expect(
    repository.edit(goal.athleteId, goal.id, {
      ...request,
      status: "DISCARDED",
      createdAt: "ignored",
    } as never),
  ).resolves.toBe(goal);
  expect(update).toHaveBeenCalledExactlyOnceWith(trainingGoals);
  expect(set).toHaveBeenCalledExactlyOnceWith(request);
  expect(new PgDialect().sqlToQuery(where.mock.calls[0][0])).toMatchObject({
    sql: '("training_goals"."id" = $1 and "training_goals"."athlete_id" = $2 and "training_goals"."status" = $3)',
    params: [goal.id, goal.athleteId, "ACTIVE"],
  });
  expect(transform).toHaveBeenCalledExactlyOnceWith(row);
});

test("leaves omitted fields undefined for Drizzle to preserve", async () => {
  const { repository, set } = setupUpdate();
  await repository.edit(goal.athleteId, goal.id, { title: "New" });
  expect(set).toHaveBeenCalledExactlyOnceWith({
    title: "New",
    description: undefined,
    type: undefined,
    targetDistanceMetres: undefined,
    targetTimeSeconds: undefined,
    targetDate: undefined,
  });
});

test("returns null when the conditional update no longer matches", async () => {
  const { repository, returning, transform } = setupUpdate();
  returning.mockResolvedValue([]);
  await expect(
    repository.edit(goal.athleteId, goal.id, { title: "New" }),
  ).resolves.toBeNull();
  expect(transform).not.toHaveBeenCalled();
});

test("propagates update database failures", async () => {
  const { repository, returning } = setupUpdate();
  const error = new Error("Database unavailable");
  returning.mockRejectedValue(error);
  await expect(
    repository.edit(goal.athleteId, goal.id, { title: "New" }),
  ).rejects.toBe(error);
});

test("atomically completes only the owned active goal and transforms the returned row", async () => {
  const { repository, set, where, returning, transform, update } =
    setupUpdate();
  const completedRow = { ...row, status: "COMPLETED" as const };
  const completed = { ...goal, status: "COMPLETED" as const };
  returning.mockResolvedValue([completedRow]);
  transform.mockReturnValue(completed);
  await expect(repository.complete(goal.athleteId, goal.id)).resolves.toBe(
    completed,
  );
  expect(update).toHaveBeenCalledExactlyOnceWith(trainingGoals);
  expect(set).toHaveBeenCalledExactlyOnceWith({ status: "COMPLETED" });
  expect(new PgDialect().sqlToQuery(where.mock.calls[0][0])).toMatchObject({
    sql: '("training_goals"."id" = $1 and "training_goals"."athlete_id" = $2 and "training_goals"."status" = $3)',
    params: [goal.id, goal.athleteId, "ACTIVE"],
  });
  expect(transform).toHaveBeenCalledExactlyOnceWith(completedRow);
});
test("returns null for an unmatched completion without transformation", async () => {
  const { repository, returning, transform } = setupUpdate();
  returning.mockResolvedValue([]);
  await expect(
    repository.complete(goal.athleteId, goal.id),
  ).resolves.toBeNull();
  expect(transform).not.toHaveBeenCalled();
});
test("propagates completion persistence failures", async () => {
  const { repository, returning } = setupUpdate();
  const error = new Error("Database unavailable");
  returning.mockRejectedValue(error);
  await expect(repository.complete(goal.athleteId, goal.id)).rejects.toBe(
    error,
  );
});

test("atomically discards only the owned active goal and transforms the returned row", async () => {
  const { repository, set, where, returning, transform, update } =
    setupUpdate();
  const discardedRow = { ...row, status: "DISCARDED" as const };
  const discarded = { ...goal, status: "DISCARDED" as const };
  returning.mockResolvedValue([discardedRow]);
  transform.mockReturnValue(discarded);
  await expect(repository.discard(goal.athleteId, goal.id)).resolves.toBe(
    discarded,
  );
  expect(update).toHaveBeenCalledExactlyOnceWith(trainingGoals);
  expect(set).toHaveBeenCalledExactlyOnceWith({ status: "DISCARDED" });
  expect(new PgDialect().sqlToQuery(where.mock.calls[0][0])).toMatchObject({
    sql: '("training_goals"."id" = $1 and "training_goals"."athlete_id" = $2 and "training_goals"."status" = $3)',
    params: [goal.id, goal.athleteId, "ACTIVE"],
  });
  expect(transform).toHaveBeenCalledExactlyOnceWith(discardedRow);
});
test("returns null for an unmatched discarding without transformation", async () => {
  const { repository, returning, transform } = setupUpdate();
  returning.mockResolvedValue([]);
  await expect(repository.discard(goal.athleteId, goal.id)).resolves.toBeNull();
  expect(transform).not.toHaveBeenCalled();
});
test("propagates discarding persistence failures", async () => {
  const { repository, returning } = setupUpdate();
  const error = new Error("Database unavailable");
  returning.mockRejectedValue(error);
  await expect(repository.discard(goal.athleteId, goal.id)).rejects.toBe(error);
});
