import type { TrainingSession } from "@/domain/training-sessions";
import { DrizzleTrainingSessionsRepository } from "./training-sessions-repository";
import type { TrainingSessionsTransformer } from "./training-sessions-transformer";

const run: Extract<TrainingSession, { activityType: "RUN" }> = {
  id: "11111111-1111-4111-8111-111111111111",
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
  targetType: "DISTANCE_DURATION",
  targetDistanceMetres: 8000,
  targetDurationSeconds: 2700,
  targetPaceSecondsPerKilometre: null,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
};

const strength: Extract<TrainingSession, { activityType: "STRENGTH" }> = {
  id: "22222222-2222-4222-8222-222222222222",
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
                    targetType: run.targetType,
                    targetDistanceMetres: run.targetDistanceMetres,
                    targetDurationSeconds: run.targetDurationSeconds,
                    targetPaceSecondsPerKilometre:
                      run.targetPaceSecondsPerKilometre,
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
  const transaction = vi
    .fn()
    .mockImplementation((callback) => callback({ update }));
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

test("patches a completed run's supplied actual values", async () => {
  const { repository, transformed, transformer, updateValues } =
    createRepository();
  const completed = {
    ...run,
    status: "COMPLETED" as const,
    actualDistanceMetres: 8000,
    actualDurationSeconds: 2700,
  };

  await expect(
    repository.patchFinal(completed, {
      actualDistanceMetres: 8000,
      actualDurationSeconds: 2800,
    }),
  ).resolves.toBe(transformed);
  expect(updateValues).toEqual([
    { updatedAt: expect.any(Date) },
    { actualDistanceMetres: 8000, actualDurationSeconds: 2800 },
  ]);
  expect(transformer.transform).toHaveBeenCalledWith({
    session: expect.any(Object),
    runDetails: expect.objectContaining({
      actualDistanceMetres: 8000,
      actualDurationSeconds: 2800,
    }),
    strengthDetails: null,
  });
});

test("patches a skipped reason without touching activity details", async () => {
  const { repository, updateValues } = createRepository();
  const skipped = { ...run, status: "SKIPPED" as const, skipReason: "Recovery" };

  await repository.patchFinal(skipped, { skipReason: "Sick" });
  expect(updateValues).toEqual([
    { skipReason: "Sick", updatedAt: expect.any(Date) },
  ]);
});

test("patches a skipped strength reason without touching activity details", async () => {
  const { repository, updateValues } = createRepository();
  const skipped = {
    ...strength,
    status: "SKIPPED" as const,
    skipReason: "Recovery",
  };

  await repository.patchFinal(skipped, { skipReason: "Sick" });
  expect(updateValues).toEqual([
    { skipReason: "Sick", updatedAt: expect.any(Date) },
  ]);
});

test("patches completed strength duration", async () => {
  const { repository, transformed, transformer, updateValues } =
    createRepository();
  const completed = {
    ...strength,
    status: "COMPLETED" as const,
    actualDurationSeconds: 2700,
  };

  await expect(
    repository.patchFinal(completed, { actualDurationSeconds: 2800 }),
  ).resolves.toBe(transformed);
  expect(updateValues).toEqual([
    { updatedAt: expect.any(Date) },
    { actualDurationSeconds: 2800 },
  ]);
  expect(transformer.transform).toHaveBeenCalledWith({
    session: expect.any(Object),
    runDetails: null,
    strengthDetails: expect.objectContaining({ actualDurationSeconds: 2800 }),
  });
});

test.each([
  { actualDurationSeconds: 2800 },
  { actualDistanceMetres: 8100 },
])("patches one completed run actual at a time", async (request) => {
  const { repository } = createRepository();
  const completed = {
    ...run,
    status: "COMPLETED" as const,
    actualDistanceMetres: 8000,
    actualDurationSeconds: 2700,
  };

  await expect(repository.patchFinal(completed, request)).resolves.toBeDefined();
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
