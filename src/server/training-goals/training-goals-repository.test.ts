import { PgDialect } from "drizzle-orm/pg-core";
import { trainingGoals, users } from "@db/schema";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import { DrizzleTrainingGoalsRepository } from "./training-goals-repository";

const goal = createTrainingGoal();
const row = { ...goal, createdAt: new Date(goal.createdAt), resolvedAt: null };
const fields = {
  title: goal.title,
  purpose: goal.purpose,
  trainingIntentions: goal.trainingIntentions,
  startDate: goal.startDate,
  targetDate: goal.targetDate,
};
const request = { ...fields, athleteId: goal.athleteId };

function connection() {
  const limit = vi.fn().mockResolvedValue([row]);
  const orderBy = vi.fn().mockResolvedValue([row]);
  const lock = vi.fn().mockResolvedValue([{ id: goal.athleteId }]);
  const whereSelect = vi
    .fn()
    .mockReturnValue(
      Object.assign(Promise.resolve([row]), { limit, orderBy, for: lock }),
    );
  const from = vi.fn().mockReturnValue({ where: whereSelect });
  const select = vi.fn().mockReturnValue({ from });
  const returning = vi.fn().mockResolvedValue([row]);
  const whereUpdate = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where: whereUpdate });
  const update = vi.fn().mockReturnValue({ set });
  const values = vi.fn().mockReturnValue({ returning });
  const insert = vi.fn().mockReturnValue({ values });
  return {
    select,
    update,
    insert,
    limit,
    orderBy,
    lock,
    whereSelect,
    from,
    returning,
    whereUpdate,
    set,
    values,
  };
}

function setup() {
  const root = connection();
  const tx = connection();
  const transaction = vi.fn(async (action) => action(tx));
  const transform = vi.fn().mockReturnValue(goal);
  const repository = new DrizzleTrainingGoalsRepository(
    { ...root, transaction } as never,
    { transform },
  );
  return { repository, root, tx, transaction, transform };
}

function query(condition: Parameters<PgDialect["sqlToQuery"]>[0]) {
  return new PgDialect().sqlToQuery(condition);
}

test("locks the athlete before running the callback and binds operations to the transaction", async () => {
  const s = setup();
  await expect(
    s.repository.withAthleteLock(goal.athleteId, async (repository) => {
      expect(s.tx.lock).toHaveBeenCalledExactlyOnceWith("update");
      expect(s.tx.from).toHaveBeenCalledWith(users);
      expect(query(s.tx.whereSelect.mock.calls[0][0]).params).toEqual([
        goal.athleteId,
      ]);
      await repository.findById(goal.id);
      await repository.findUnresolved(goal.athleteId);
      await repository.find(goal.athleteId);
      await repository.create(request);
      await repository.edit(goal.athleteId, goal.id, fields);
      await repository.complete(goal.athleteId, goal.id);
      return repository.discard(goal.athleteId, goal.id);
    }),
  ).resolves.toBe(goal);
  expect(s.transaction).toHaveBeenCalledOnce();
  expect(s.root.select).not.toHaveBeenCalled();
  expect(s.root.update).not.toHaveBeenCalled();
  expect(s.root.insert).not.toHaveBeenCalled();
  expect(s.tx.insert).toHaveBeenCalledOnce();
  expect(s.tx.update).toHaveBeenCalledTimes(3);
});

test("does not execute the callback when locking fails", async () => {
  const s = setup();
  const error = new Error("Lock failed");
  const action = vi.fn();
  s.tx.lock.mockRejectedValue(error);
  await expect(
    s.repository.withAthleteLock(goal.athleteId, action),
  ).rejects.toBe(error);
  expect(action).not.toHaveBeenCalled();
});

test("propagates callback failures to the transaction so it can roll back", async () => {
  const s = setup();
  const error = new Error("Abort");
  await expect(
    s.repository.withAthleteLock(goal.athleteId, async (repository) => {
      await repository.create(request);
      throw error;
    }),
  ).rejects.toBe(error);
  expect(s.tx.insert).toHaveBeenCalledOnce();
});

test("persists supplied creation fields without business validation or extra reads", async () => {
  const s = setup();
  await expect(
    s.repository.create({ ...request, title: " Goal " }),
  ).resolves.toBe(goal);
  expect(s.root.values).toHaveBeenCalledExactlyOnceWith({
    ...request,
    title: " Goal ",
  });
  expect(s.root.select).not.toHaveBeenCalled();
  expect(s.transaction).not.toHaveBeenCalled();
  expect(s.transform).toHaveBeenCalledExactlyOnceWith(row);
});

test("reads and transforms a goal by ID or returns null", async () => {
  const s = setup();
  await expect(s.repository.findById(goal.id)).resolves.toBe(goal);
  expect(s.root.from).toHaveBeenCalledExactlyOnceWith(trainingGoals);
  expect(query(s.root.whereSelect.mock.calls[0][0]).params).toEqual([goal.id]);
  expect(s.root.limit).toHaveBeenCalledWith(1);
  s.root.limit.mockResolvedValue([]);
  await expect(s.repository.findById(goal.id)).resolves.toBeNull();
});

test("lists all goals in creation order with a stable ID tiebreaker", async () => {
  const s = setup();
  await expect(s.repository.find(goal.athleteId)).resolves.toEqual([goal]);
  expect(query(s.root.whereSelect.mock.calls[0][0]).params).toEqual([
    goal.athleteId,
  ]);
  expect(s.root.orderBy.mock.calls[0].map((order) => query(order).sql)).toEqual(
    ['"training_goals"."created_at" desc', '"training_goals"."id" asc'],
  );
});

test("finds only unresolved goals for the requested athlete", async () => {
  const s = setup();
  await expect(s.repository.findUnresolved(goal.athleteId)).resolves.toEqual([
    goal,
  ]);
  expect(query(s.root.whereSelect.mock.calls[0][0])).toMatchObject({
    sql: '("training_goals"."athlete_id" = $1 and "training_goals"."resolution" is null)',
    params: [goal.athleteId],
  });
  s.root.whereSelect.mockResolvedValue([]);
  await expect(s.repository.findUnresolved(goal.athleteId)).resolves.toEqual(
    [],
  );
});

test("writes only editable fields and defensively checks ownership and resolution", async () => {
  const s = setup();
  await expect(
    s.repository.edit(goal.athleteId, goal.id, {
      ...fields,
      resolution: "discarded",
      athleteId: "other",
    } as never),
  ).resolves.toBe(goal);
  expect(s.root.set).toHaveBeenCalledExactlyOnceWith(fields);
  expect(query(s.root.whereUpdate.mock.calls[0][0])).toMatchObject({
    sql: '("training_goals"."id" = $1 and "training_goals"."athlete_id" = $2 and "training_goals"."resolution" is null)',
    params: [goal.id, goal.athleteId],
  });
  expect(s.root.select).not.toHaveBeenCalled();
  expect(s.transaction).not.toHaveBeenCalled();
  s.root.returning.mockResolvedValue([]);
  await expect(
    s.repository.edit(goal.athleteId, goal.id, fields),
  ).resolves.toBeNull();
});

test.each(["complete", "discard"] as const)(
  "%s atomically writes resolution and timestamp for an owned unresolved goal",
  async (operation) => {
    const s = setup();
    await expect(
      s.repository[operation](goal.athleteId, goal.id),
    ).resolves.toBe(goal);
    expect(s.root.set.mock.calls[0][0].resolution).toBe(
      operation === "complete" ? "completed" : "discarded",
    );
    expect(query(s.root.set.mock.calls[0][0].resolvedAt).sql).toBe("now()");
    expect(query(s.root.whereUpdate.mock.calls[0][0])).toMatchObject({
      sql: '("training_goals"."id" = $1 and "training_goals"."athlete_id" = $2 and "training_goals"."resolution" is null)',
      params: [goal.id, goal.athleteId],
    });
    expect(s.transaction).not.toHaveBeenCalled();
    s.root.returning.mockResolvedValue([]);
    await expect(
      s.repository[operation](goal.athleteId, goal.id),
    ).resolves.toBeNull();
  },
);

test.each(["returning", "transform"] as const)(
  "propagates %s failure",
  async (stage) => {
    const s = setup();
    const error = new Error(stage);
    (stage === "returning" ? s.root.returning : s.transform).mockImplementation(
      () => {
        throw error;
      },
    );
    await expect(s.repository.create(request)).rejects.toBe(error);
  },
);
