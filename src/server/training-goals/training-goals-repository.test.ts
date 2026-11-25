import { PgDialect } from "drizzle-orm/pg-core";
import { trainingGoals, users } from "@db/schema";
import { createTrainingGoal } from "@/test-support/fixtures/training-goal";
import { RequestValidationError } from "@/server/errors/request-validation-error";
import { TrainingGoalOverlapError } from "./training-goals-errors";
import { DrizzleTrainingGoalsRepository } from "./training-goals-repository";

const goal = createTrainingGoal();
const row = { ...goal, createdAt: new Date(goal.createdAt), resolvedAt: null };
const request = {
  athleteId: goal.athleteId,
  title: goal.title,
  purpose: goal.purpose,
  trainingIntentions: goal.trainingIntentions,
  startDate: goal.startDate,
  targetDate: goal.targetDate,
};

function setup() {
  const limit = vi.fn().mockResolvedValue([]);
  const orderBy = vi.fn().mockResolvedValue([row]);
  const lock = vi.fn().mockResolvedValue([{ id: goal.athleteId }]);
  const whereSelect = vi.fn().mockReturnValue({ limit, orderBy, for: lock });
  const from = vi.fn().mockReturnValue({ where: whereSelect });
  const select = vi.fn().mockReturnValue({ from });
  const returning = vi.fn().mockResolvedValue([row]);
  const whereUpdate = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where: whereUpdate });
  const update = vi.fn().mockReturnValue({ set });
  const values = vi.fn().mockReturnValue({ returning });
  const insert = vi.fn().mockReturnValue({ values });
  const tx = { select, update, insert };
  const transaction = vi.fn(async (callback) => callback(tx));
  const transform = vi.fn().mockReturnValue(goal);
  const repository = new DrizzleTrainingGoalsRepository(
    { ...tx, transaction } as never,
    { transform },
  );
  return {
    repository,
    transaction,
    transform,
    limit,
    lock,
    whereSelect,
    whereUpdate,
    from,
    returning,
    set,
    values,
    insert,
    orderBy,
  };
}

function query(condition: Parameters<PgDialect["sqlToQuery"]>[0]) {
  return new PgDialect().sqlToQuery(condition);
}

test("creates a goal after locking its athlete and checking inclusive overlap", async () => {
  const s = setup();
  await expect(s.repository.create(request)).resolves.toBe(goal);
  expect(s.transaction).toHaveBeenCalledOnce();
  expect(s.from.mock.calls.map(([table]) => table)).toEqual([
    users,
    trainingGoals,
  ]);
  expect(s.lock).toHaveBeenCalledExactlyOnceWith("update");
  expect(s.lock.mock.invocationCallOrder[0]).toBeLessThan(
    s.limit.mock.invocationCallOrder[0],
  );
  expect(query(s.whereSelect.mock.calls[0][0]).params).toEqual([
    goal.athleteId,
  ]);
  expect(query(s.whereSelect.mock.calls[1][0])).toMatchObject({
    sql: '("training_goals"."athlete_id" = $1 and "training_goals"."resolution" is null and "training_goals"."start_date" <= $2 and "training_goals"."target_date" >= $3)',
    params: [goal.athleteId, goal.targetDate, goal.startDate],
  });
  expect(s.values).toHaveBeenCalledExactlyOnceWith(request);
  expect(s.transform).toHaveBeenCalledExactlyOnceWith(row);
});

test("rejects an overlap before inserting", async () => {
  const s = setup();
  s.limit.mockResolvedValue([{ id: "overlap" }]);
  await expect(s.repository.create(request)).rejects.toThrow(
    TrainingGoalOverlapError,
  );
  expect(s.insert).not.toHaveBeenCalled();
});

test("validates creation before opening a transaction", async () => {
  const s = setup();
  await expect(
    s.repository.create({ ...request, targetDate: "2000-01-01" }),
  ).rejects.toThrow(RequestValidationError);
  expect(s.transaction).not.toHaveBeenCalled();
});

test("propagates transaction, lookup, persistence, and transformer failures", async () => {
  for (const stage of ["lock", "limit", "returning", "transform"] as const) {
    const s = setup();
    const error = new Error(stage);
    s[stage].mockImplementation(() => {
      throw error;
    });
    await expect(s.repository.create(request)).rejects.toBe(error);
  }
});

test("reads and transforms a goal by ID, or returns null", async () => {
  const s = setup();
  s.limit.mockResolvedValueOnce([row]);
  await expect(s.repository.findById(goal.id)).resolves.toBe(goal);
  expect(query(s.whereSelect.mock.calls[0][0]).params).toEqual([goal.id]);
  expect(s.limit).toHaveBeenCalledWith(1);
  await expect(s.repository.findById(goal.id)).resolves.toBeNull();
});

test("lists goals in creation order with a stable ID tiebreaker", async () => {
  const s = setup();
  await expect(s.repository.find(goal.athleteId)).resolves.toEqual([goal]);
  expect(query(s.whereSelect.mock.calls[0][0]).params).toEqual([
    goal.athleteId,
  ]);
  expect(s.orderBy.mock.calls[0].map((order) => query(order).sql)).toEqual([
    '"training_goals"."created_at" desc',
    '"training_goals"."id" asc',
  ]);
});

test("merges a partial date edit with the latest row, excluding itself from overlap", async () => {
  const s = setup();
  s.limit.mockResolvedValueOnce([row]).mockResolvedValueOnce([]);
  await expect(
    s.repository.edit(goal.athleteId, goal.id, { targetDate: "2027-01-01" }),
  ).resolves.toBe(goal);
  expect(query(s.whereSelect.mock.calls[1][0]).params).toEqual([
    goal.id,
    goal.athleteId,
  ]);
  expect(query(s.whereSelect.mock.calls[2][0])).toMatchObject({
    params: [goal.athleteId, "2027-01-01", goal.startDate, goal.id],
  });
  expect(query(s.whereSelect.mock.calls[2][0]).sql).toContain('"id" <> $4');
  const fields = {
    title: goal.title,
    purpose: goal.purpose,
    trainingIntentions: goal.trainingIntentions,
    startDate: goal.startDate,
    targetDate: goal.targetDate,
  };
  expect(s.set).toHaveBeenCalledExactlyOnceWith({
    ...fields,
    targetDate: "2027-01-01",
  });
});

test.each([{ startDate: "2027-01-01" }, { targetDate: "2000-01-01" }])(
  "rejects invalid merged dates %j",
  async (edit) => {
    const s = setup();
    s.limit.mockResolvedValueOnce([row]);
    await expect(
      s.repository.edit(goal.athleteId, goal.id, edit),
    ).rejects.toThrow(RequestValidationError);
    expect(s.set).not.toHaveBeenCalled();
  },
);

test("rejects overlapping date edits without updating", async () => {
  const s = setup();
  s.limit.mockResolvedValueOnce([row]).mockResolvedValueOnce([{ id: "other" }]);
  await expect(
    s.repository.edit(goal.athleteId, goal.id, { startDate: "2026-01-01" }),
  ).rejects.toThrow(TrainingGoalOverlapError);
  expect(s.set).not.toHaveBeenCalled();
});

test("preserves omitted fields and skips overlap lookup for unchanged dates", async () => {
  const s = setup();
  s.limit.mockResolvedValueOnce([row]);
  await s.repository.edit(goal.athleteId, goal.id, { title: " New " });
  expect(s.limit).toHaveBeenCalledOnce();
  expect(s.set.mock.calls[0][0]).toMatchObject({
    title: "New",
    purpose: goal.purpose,
    startDate: goal.startDate,
  });
});

test("returns null when the locked goal is missing, foreign, or resolved", async () => {
  const s = setup();
  await expect(
    s.repository.edit(goal.athleteId, goal.id, { title: "New" }),
  ).resolves.toBeNull();
  expect(s.set).not.toHaveBeenCalled();
  expect(query(s.whereSelect.mock.calls[1][0]).sql).toContain(
    '"resolution" is null',
  );
});

test("does not transform an edit without a returned row", async () => {
  const s = setup();
  s.limit.mockResolvedValueOnce([row]);
  s.returning.mockResolvedValue([]);
  await expect(
    s.repository.edit(goal.athleteId, goal.id, { title: "New" }),
  ).resolves.toBeNull();
  expect(s.transform).not.toHaveBeenCalled();
});

test.each(["complete", "discard"] as const)(
  "%s atomically records resolution and database time for the owned unresolved goal",
  async (operation) => {
    const s = setup();
    await expect(
      s.repository[operation](goal.athleteId, goal.id),
    ).resolves.toBe(goal);
    expect(s.lock).toHaveBeenCalledExactlyOnceWith("update");
    expect(s.set.mock.calls[0][0].resolution).toBe(
      operation === "complete" ? "completed" : "discarded",
    );
    expect(query(s.set.mock.calls[0][0].resolvedAt).sql).toBe("now()");
    expect(query(s.whereUpdate.mock.calls[0][0])).toMatchObject({
      sql: '("training_goals"."id" = $1 and "training_goals"."athlete_id" = $2 and "training_goals"."resolution" is null)',
      params: [goal.id, goal.athleteId],
    });
    s.returning.mockResolvedValue([]);
    await expect(
      s.repository[operation](goal.athleteId, goal.id),
    ).resolves.toBeNull();
  },
);

test("updates all editable fields while preserving server-owned fields", async () => {
  const s = setup();
  s.limit.mockResolvedValueOnce([row]).mockResolvedValueOnce([]);
  const fields = {
    title: "Updated",
    purpose: "Stay healthy",
    trainingIntentions: "Easy runs",
    startDate: "2026-11-01",
    targetDate: "2027-01-01",
  };
  await s.repository.edit(goal.athleteId, goal.id, {
    ...fields,
    resolution: "discarded",
    athleteId: "other",
  } as never);
  expect(s.set).toHaveBeenCalledExactlyOnceWith(fields);
});
