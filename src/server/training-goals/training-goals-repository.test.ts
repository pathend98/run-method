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
