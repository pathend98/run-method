import type { TrainingSession } from "@/domain/training-sessions";
import { DrizzleTrainingSessionsRepository } from "./training-sessions-repository";
import type { TrainingSessionsTransformer } from "./training-sessions-transformer";

const run: Extract<TrainingSession, { activityType: "RUN" }> = {
  id: "11111111-1111-4111-8111-111111111111",
  athleteId: "33333333-3333-4333-8333-333333333333",
  title: "Easy run",
  activityType: "RUN",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "AM",
  description: null,
  sortOrder: 0,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:30:00.000Z",
  targetDistanceMetres: 8000,
  targetDurationSeconds: 2700,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
};

const strength: Extract<TrainingSession, { activityType: "STRENGTH" }> = {
  id: "22222222-2222-4222-8222-222222222222",
  athleteId: "33333333-3333-4333-8333-333333333333",
  title: "Strength",
  activityType: "STRENGTH",
  status: "SCHEDULED",
  date: "2026-08-17",
  timeOfDay: "PM",
  description: null,
  sortOrder: 1,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:30:00.000Z",
  targetDurationSeconds: 2700,
  actualDurationSeconds: null,
};

function createRepository(returnSession = true) {
  const updateValues: unknown[] = [];
  const session = {
    id: run.id,
    athleteId: "33333333-3333-4333-8333-333333333333",
    title: run.title,
    activityType: run.activityType,
    status: "SCHEDULED",
    date: run.date,
    timeOfDay: run.timeOfDay,
    description: run.description,
    sortOrder: run.sortOrder,
    skipReason: null,
    createdAt: new Date(run.createdAt),
    updatedAt: new Date(run.updatedAt),
  };
  const update = vi.fn().mockImplementation(() => ({
    set: vi.fn().mockImplementation((values) => {
      updateValues.push(values);
      return {
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation(async () => {
            if (updateValues.length === 1) {
              return returnSession
                ? [{ ...session, ...(values as object) }]
                : [];
            }
            return [
              "actualDistanceMetres" in (values as object)
                ? {
                    trainingSessionId: run.id,
                    targetDistanceMetres: run.targetDistanceMetres,
                    targetDurationSeconds: run.targetDurationSeconds,
                    actualDistanceMetres: null,
                    actualDurationSeconds: null,
                    ...(values as object),
                  }
                : {
                    trainingSessionId: strength.id,
                    targetDurationSeconds: strength.targetDurationSeconds,
                    actualDurationSeconds: null,
                    ...(values as object),
                  },
            ];
          }),
        }),
      };
    }),
  }));
  const selectWhere = vi.fn().mockResolvedValue([{ nextOrder: "1" }]);
  const selectFrom = vi.fn().mockReturnValue({ where: selectWhere });
  const select = vi.fn().mockReturnValue({ from: selectFrom });
  const transaction = vi
    .fn()
    .mockImplementation((callback) => callback({ select, update }));
  const transformed = { id: session.id } as TrainingSession;
  const transformer: TrainingSessionsTransformer = {
    transform: vi.fn().mockReturnValue(transformed),
  };
  const repository = new DrizzleTrainingSessionsRepository(
    { transaction, update } as never,
    transformer,
  );

  return { repository, transformed, transformer, updateValues };
}

test("skips a scheduled run with a guarded update", async () => {
  const { repository, transformed, transformer, updateValues } =
    createRepository();

  await expect(repository.skip(run, { skipReason: "Recovery" })).resolves.toBe(
    transformed,
  );
  expect(updateValues).toEqual([
    {
      status: "SKIPPED",
      skipReason: "Recovery",
      updatedAt: expect.any(Date),
    },
  ]);
  expect(transformer.transform).toHaveBeenCalledWith({
    session: expect.objectContaining({ status: "SKIPPED" }),
    runDetails: expect.objectContaining({ actualDurationSeconds: null }),
    strengthDetails: null,
  });
});

test("skips a scheduled strength session", async () => {
  const { repository, transformer } = createRepository();

  await repository.skip(strength, { skipReason: "Recovery" });

  expect(transformer.transform).toHaveBeenCalledWith({
    session: expect.objectContaining({ status: "SKIPPED" }),
    runDetails: null,
    strengthDetails: expect.objectContaining({ actualDurationSeconds: null }),
  });
});

test("returns null when a guarded skip loses a concurrent transition", async () => {
  const { repository, transformer } = createRepository(false);

  await expect(
    repository.skip(run, { skipReason: "Recovery" }),
  ).resolves.toBeNull();
  expect(transformer.transform).not.toHaveBeenCalled();
});

test("returns null when a guarded date edit loses a concurrent transition", async () => {
  const { repository, transformer } = createRepository(false);

  await expect(
    repository.edit(run, {
      title: run.title,
      date: "2026-08-18",
      timeOfDay: run.timeOfDay,
      description: run.description,
      activityType: "RUN",
      targetDistanceMetres: run.targetDistanceMetres,
      targetDurationSeconds: run.targetDurationSeconds,
    }),
  ).resolves.toBeNull();
  expect(transformer.transform).not.toHaveBeenCalled();
});

test("completes a run in a transaction", async () => {
  const { repository, transformed, transformer, updateValues } =
    createRepository();

  await expect(
    repository.complete(run, {
      actualDurationSeconds: 2680,
      actualDistanceMetres: 8050,
    }),
  ).resolves.toBe(transformed);
  expect(updateValues).toEqual([
    {
      status: "COMPLETED",
      skipReason: null,
      updatedAt: expect.any(Date),
    },
    { actualDistanceMetres: 8050, actualDurationSeconds: 2680 },
  ]);
  expect(transformer.transform).toHaveBeenCalledWith({
    session: expect.objectContaining({ status: "COMPLETED" }),
    runDetails: expect.objectContaining({ actualDistanceMetres: 8050 }),
    strengthDetails: null,
  });
});

test("completes strength with its actual duration", async () => {
  const { repository, transformer, updateValues } = createRepository();

  await repository.complete(strength, { actualDurationSeconds: 2400 });

  expect(updateValues[1]).toEqual({ actualDurationSeconds: 2400 });
  expect(transformer.transform).toHaveBeenCalledWith({
    session: expect.objectContaining({ status: "COMPLETED" }),
    runDetails: null,
    strengthDetails: expect.objectContaining({ actualDurationSeconds: 2400 }),
  });
});

test("does not write actuals after a concurrent completion", async () => {
  const { repository, transformer, updateValues } = createRepository(false);

  await expect(
    repository.complete(run, {
      actualDurationSeconds: 2680,
      actualDistanceMetres: 8050,
    }),
  ).resolves.toBeNull();
  expect(updateValues).toHaveLength(1);
  expect(transformer.transform).not.toHaveBeenCalled();
});
