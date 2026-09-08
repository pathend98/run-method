import type {
  EditTrainingSessionRequest,
  RunTrainingSession,
  TrainingSession,
} from "@/domain/training-sessions";
import { DrizzleTrainingSessionsRepository } from "./training-sessions-repository";
import type { TrainingSessionsTransformer } from "./training-sessions-transformer";

const run: RunTrainingSession = {
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
  targetDistanceMetres: 8000,
  targetDurationSeconds: 2700,
  actualDistanceMetres: null,
  actualDurationSeconds: null,
};

const strength: Extract<TrainingSession, { activityType: "STRENGTH" }> = {
  id: "22222222-2222-4222-8222-222222222222",
  title: "Strength",
  activityType: "STRENGTH",
  status: "COMPLETED",
  date: "2026-08-17",
  timeOfDay: "PM",
  description: "Lower body",
  sortOrder: 1,
  skipReason: null,
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:30:00.000Z",
  targetDurationSeconds: 2700,
  actualDurationSeconds: 2400,
};

function createRepository(
  current: TrainingSession,
  request: EditTrainingSessionRequest,
) {
  const session = {
    id: current.id,
    title: request.title,
    activityType: current.activityType,
    status: current.status,
    date: request.date ?? current.date,
    timeOfDay: request.timeOfDay,
    description: request.description,
    sortOrder:
      request.date === undefined && request.timeOfDay === current.timeOfDay
        ? current.sortOrder
        : 4,
    skipReason: current.skipReason,
    createdAt: new Date(current.createdAt),
    updatedAt: new Date("2026-08-31T10:00:00.000Z"),
  };
  const runRow = {
    trainingSessionId: run.id,
    targetDistanceMetres:
      request.activityType === "RUN"
        ? request.targetDistanceMetres
        : run.targetDistanceMetres,
    targetDurationSeconds:
      request.activityType === "RUN"
        ? request.targetDurationSeconds
        : run.targetDurationSeconds,
    actualDistanceMetres: run.actualDistanceMetres,
    actualDurationSeconds: run.actualDurationSeconds,
  };
  const strengthRow = {
    trainingSessionId: strength.id,
    targetDurationSeconds:
      "targetDurationSeconds" in request ? request.targetDurationSeconds : null,
    actualDurationSeconds: strength.actualDurationSeconds,
  };
  const updateValues: unknown[] = [];
  const update = vi.fn().mockImplementation(() => ({
    set: vi.fn().mockImplementation((values) => {
      updateValues.push(values);
      return {
        where: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue(
              [
                updateValues.length === 1
                  ? session
                  : request.activityType === "RUN"
                    ? runRow
                    : strengthRow,
              ].filter(Boolean),
            ),
        }),
      };
    }),
  }));
  const selectWhere = vi.fn().mockResolvedValue([{ nextOrder: "4" }]);
  const selectFrom = vi.fn().mockReturnValue({ where: selectWhere });
  const select = vi.fn().mockReturnValue({ from: selectFrom });
  const transaction = vi
    .fn()
    .mockImplementation((callback) => callback({ select, update }));
  const transformed = { ...current, title: request.title } as TrainingSession;
  const transformer: TrainingSessionsTransformer = {
    transform: vi.fn().mockReturnValue(transformed),
  };
  const repository = new DrizzleTrainingSessionsRepository(
    { transaction } as never,
    transformer,
  );

  return { repository, selectWhere, transformed, transformer, updateValues };
}

test("moves a scheduled run to its destination date and time bucket", async () => {
  const current = run;
  const request = {
    title: "Long easy run",
    description: "Keep it relaxed",
    date: "2026-08-27",
    timeOfDay: "PM",
    activityType: "RUN",
    targetDistanceMetres: 10000,
    targetDurationSeconds: 3600,
  } satisfies EditTrainingSessionRequest;
  const { repository, selectWhere, transformed, transformer, updateValues } =
    createRepository(current, request);
  await expect(repository.edit(current, request)).resolves.toBe(transformed);
  expect(selectWhere).toHaveBeenCalledOnce();
  expect(updateValues).toHaveLength(2);
  expect(updateValues[0]).toEqual({
    title: request.title,
    date: request.date,
    timeOfDay: request.timeOfDay,
    description: request.description,
    sortOrder: 4,
    updatedAt: expect.any(Date),
  });
  expect(updateValues[1]).toEqual({
    targetDistanceMetres: 10000,
    targetDurationSeconds: 3600,
  });
  expect(transformer.transform).toHaveBeenCalledWith({
    session: expect.objectContaining({ date: request.date, sortOrder: 4 }),
    runDetails: expect.objectContaining({
      targetDistanceMetres: 10000,
      targetDurationSeconds: 3600,
    }),
    strengthDetails: null,
  });
});

test("edits strength common fields without changing strength details or order", async () => {
  const current = strength;
  const request = {
    title: "Updated strength",
    description: "Upper body",
    timeOfDay: current.timeOfDay,
    activityType: "STRENGTH",
    targetDurationSeconds: current.targetDurationSeconds,
  } satisfies EditTrainingSessionRequest;
  const { repository, transformer, updateValues } = createRepository(
    current,
    request,
  );
  await repository.edit(current, request);
  expect(updateValues).toHaveLength(1);
  expect(transformer.transform).toHaveBeenCalledWith({
    session: expect.any(Object),
    runDetails: null,
    strengthDetails: {
      trainingSessionId: current.id,
      targetDurationSeconds: current.targetDurationSeconds,
      actualDurationSeconds: current.actualDurationSeconds,
    },
  });
});

test.each([3600, null])(
  "updates a scheduled strength duration to %s",
  async (targetDurationSeconds) => {
    const current: TrainingSession = { ...strength, status: "SCHEDULED" };
    const request = {
      title: current.title,
      description: current.description,
      timeOfDay: current.timeOfDay,
      activityType: "STRENGTH" as const,
      targetDurationSeconds,
    };
    const { repository, transformer, updateValues } = createRepository(
      current,
      request,
    );

    await repository.edit(current, request);

    expect(updateValues[1]).toEqual({ targetDurationSeconds });
    expect(transformer.transform).toHaveBeenCalledOnce();
  },
);

test("updates canonical run target columns", async () => {
  const targets = {
    targetDistanceMetres: 5000,
    targetDurationSeconds: 1800,
    timeOfDay: null,
    request: { targetDistanceMetres: 6000, targetDurationSeconds: 2400 },
    expected: { targetDistanceMetres: 6000, targetDurationSeconds: 2400 },
  } as const;
  const current: TrainingSession = { ...run, ...targets, timeOfDay: "AM" };
  const request = {
    title: "Updated run",
    description: null,
    timeOfDay: targets.timeOfDay,
    activityType: "RUN" as const,
    ...targets.request,
  };
  const { repository, updateValues } = createRepository(current, request);

  await repository.edit(current, request);

  expect(updateValues[1]).toEqual(targets.expected);
});

test("preserves terminal run details while editing common fields", async () => {
  const current: RunTrainingSession = {
    ...run,
    status: "COMPLETED",
    actualDistanceMetres: 8050,
    actualDurationSeconds: 2680,
  };
  const request = {
    title: "Renamed completed run",
    description: "Felt good",
    timeOfDay: current.timeOfDay,
    activityType: "RUN",
    targetDistanceMetres: current.targetDistanceMetres,
    targetDurationSeconds: current.targetDurationSeconds,
  } satisfies EditTrainingSessionRequest;
  const { repository, transformer, updateValues } = createRepository(
    current,
    request,
  );

  await repository.edit(current, request);

  expect(updateValues).toHaveLength(1);
  expect(transformer.transform).toHaveBeenCalledWith({
    session: expect.any(Object),
    runDetails: {
      trainingSessionId: current.id,
      targetDistanceMetres: current.targetDistanceMetres,
      targetDurationSeconds: current.targetDurationSeconds,
      actualDistanceMetres: current.actualDistanceMetres,
      actualDurationSeconds: current.actualDurationSeconds,
    },
    strengthDetails: null,
  });
});

test("updates completed run actuals without changing targets", async () => {
  const current: RunTrainingSession = {
    ...run,
    status: "COMPLETED",
    actualDistanceMetres: 8050,
    actualDurationSeconds: 2680,
  };
  const request = {
    title: current.title,
    description: current.description,
    timeOfDay: current.timeOfDay,
    activityType: "RUN" as const,
    targetDistanceMetres: current.targetDistanceMetres,
    targetDurationSeconds: current.targetDurationSeconds,
    actualDistanceMetres: 8100,
    actualDurationSeconds: 2700,
  };
  const { repository, updateValues } = createRepository(current, request);

  await repository.edit(current, request);

  expect(updateValues).toHaveLength(2);
  expect(updateValues[1]).toEqual({
    actualDistanceMetres: request.actualDistanceMetres,
    actualDurationSeconds: request.actualDurationSeconds,
  });
});

test.each([{ actualDistanceMetres: 8100 }, { actualDurationSeconds: 2700 }])(
  "updates one completed run actual metric",
  async (actuals) => {
    const current: RunTrainingSession = {
      ...run,
      status: "COMPLETED",
      actualDistanceMetres: 8050,
      actualDurationSeconds: 2680,
    };
    const request = {
      title: current.title,
      description: current.description,
      timeOfDay: current.timeOfDay,
      activityType: "RUN" as const,
      targetDistanceMetres: current.targetDistanceMetres,
      targetDurationSeconds: current.targetDurationSeconds,
      ...actuals,
    };
    const { repository, updateValues } = createRepository(current, request);

    await repository.edit(current, request);

    expect(updateValues[1]).toEqual(actuals);
  },
);

test("updates completed strength actual duration without changing its target", async () => {
  const current: TrainingSession = {
    ...strength,
    status: "COMPLETED",
    actualDurationSeconds: 1750,
  };
  const request = {
    title: current.title,
    description: current.description,
    timeOfDay: current.timeOfDay,
    activityType: "STRENGTH" as const,
    targetDurationSeconds: current.targetDurationSeconds,
    actualDurationSeconds: 1800,
  };
  const { repository, updateValues } = createRepository(current, request);

  await repository.edit(current, request);

  expect(updateValues).toHaveLength(2);
  expect(updateValues[1]).toEqual({
    actualDurationSeconds: request.actualDurationSeconds,
  });
});

test("rejects mismatched aggregate and request activity types defensively", async () => {
  const current = run;
  const request = {
    title: "Strength",
    description: null,
    timeOfDay: current.timeOfDay,
    activityType: "STRENGTH",
    targetDurationSeconds: null,
  } satisfies EditTrainingSessionRequest;
  const { repository } = createRepository(current, request);

  await expect(repository.edit(current, request)).rejects.toThrow(
    "Training session activity type changed during edit",
  );
});
